package main

import (
	"context"
	"embed"
	"fmt"
	"io/fs"
	"log"
	"log/slog"
	"net/http"
	"os"
	"time"
	_ "time/tzdata" // Asia/Dhaka must resolve even on a bare VPS image.

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose/v3"

	"github.com/ebnsina/tavora/api/store"
)

//go:embed db/migrations/*.sql
var migrations embed.FS

func mustEnv(k string) string {
	v := os.Getenv(k)
	if v == "" {
		log.Fatalf("missing required env var %s", k)
	}
	return v
}

func mustLoc(name string) *time.Location {
	loc, err := time.LoadLocation(name)
	if err != nil {
		log.Fatal(err)
	}
	return loc
}

func main() {
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, mustEnv("DATABASE_URL"))
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()

	dir, _ := fs.Sub(migrations, "db/migrations")
	p, err := goose.NewProvider(goose.DialectPostgres, stdlib.OpenDBFromPool(pool), dir)
	if err != nil {
		log.Fatal(err)
	}
	if _, err := p.Up(ctx); err != nil {
		log.Fatalf("migrate: %v", err)
	}
	q := store.New(pool)

	if len(os.Args) > 1 {
		switch os.Args[1] {
		case "create-admin":
			err = createAdmin(ctx, q, os.Args[2:])
		case "seed-demo":
			err = seedDemo(ctx, pool, q)
		default:
			err = fmt.Errorf("unknown command %q (commands: create-admin, seed-demo)", os.Args[1])
		}
		if err != nil {
			log.Fatal(err)
		}
		return
	}

	addr, origin, uploadDir := mustEnv("ADDR"), mustEnv("CORS_ORIGIN"), mustEnv("UPLOAD_DIR")
	if err := os.MkdirAll(uploadDir, 0o755); err != nil {
		log.Fatal(err)
	}
	sms, err := newSMS(mustEnv("SMS_PROVIDER"))
	if err != nil {
		log.Fatal(err)
	}
	s := &server{pool: pool, q: q, uploadDir: uploadDir, logins: &throttle{fails: map[string][]time.Time{}}, sms: sms}
	admin, owner := s.requireAdmin, s.requireOwner

	mux := http.NewServeMux()
	mux.HandleFunc("GET /v1/restaurant", s.restaurant)
	mux.HandleFunc("GET /v1/menu", s.menu)
	mux.HandleFunc("GET /v1/site", s.site)
	mux.HandleFunc("POST /v1/orders", s.createOrder)
	mux.HandleFunc("POST /v1/reservations", s.createReservation)
	mux.Handle("GET /uploads/", s.uploads())
	mux.HandleFunc("POST /v1/auth/code", s.sendCode)
	mux.HandleFunc("POST /v1/auth/verify", s.verifyCode)
	mux.HandleFunc("POST /v1/auth/logout", s.customerLogout)
	mux.HandleFunc("GET /v1/me", s.customerMe)

	mux.HandleFunc("POST /v1/admin/login", s.login)
	mux.HandleFunc("POST /v1/admin/pin", s.pinLogin)
	mux.HandleFunc("POST /v1/admin/logout", admin(s.logout))
	mux.HandleFunc("GET /v1/admin/alerts", admin(s.alerts))
	mux.HandleFunc("GET /v1/admin/staff", owner(s.listStaff))
	mux.HandleFunc("POST /v1/admin/staff", owner(s.createStaff))
	mux.HandleFunc("PUT /v1/admin/staff/{id}", owner(s.updateStaff))
	mux.HandleFunc("DELETE /v1/admin/staff/{id}", owner(s.deleteStaff))
	mux.HandleFunc("GET /v1/admin/reports/day", owner(s.dayReport))
	mux.HandleFunc("GET /v1/admin/me", admin(s.me))
	mux.HandleFunc("PUT /v1/admin/site", owner(s.putSite))
	mux.HandleFunc("PUT /v1/admin/restaurant", owner(s.putRestaurant))
	mux.HandleFunc("PUT /v1/admin/hours", owner(s.putHours))
	mux.HandleFunc("PUT /v1/admin/vat", owner(s.putVat))
	mux.HandleFunc("PUT /v1/admin/theme", owner(s.putTheme))
	mux.HandleFunc("GET /v1/admin/categories", owner(s.listCategories))
	mux.HandleFunc("POST /v1/admin/categories", owner(s.createCategory))
	mux.HandleFunc("PUT /v1/admin/categories/{id}", owner(s.updateCategory))
	mux.HandleFunc("DELETE /v1/admin/categories/{id}", owner(s.deleteCategory))
	mux.HandleFunc("POST /v1/admin/items", owner(s.createItem))
	mux.HandleFunc("PUT /v1/admin/items/{id}", owner(s.updateItem))
	mux.HandleFunc("DELETE /v1/admin/items/{id}", owner(s.deleteItem))
	mux.HandleFunc("GET /v1/admin/stats", owner(s.stats))
	mux.HandleFunc("GET /v1/admin/orders", admin(s.listOrders))
	mux.HandleFunc("GET /v1/admin/orders/{id}", admin(s.getPosOrder))
	mux.HandleFunc("PATCH /v1/admin/orders/{id}", admin(s.patchOrder))
	mux.HandleFunc("GET /v1/admin/reservations", admin(s.listReservations))
	mux.HandleFunc("GET /v1/admin/reservations/{id}", admin(s.getReservation))
	mux.HandleFunc("PATCH /v1/admin/reservations/{id}", admin(s.patchReservation))
	mux.HandleFunc("POST /v1/admin/uploads", owner(s.upload))
	mux.HandleFunc("GET /v1/admin/tables", owner(s.listTables))
	mux.HandleFunc("POST /v1/admin/tables", owner(s.createTable))
	mux.HandleFunc("PUT /v1/admin/tables/{id}", owner(s.updateTable))
	mux.HandleFunc("DELETE /v1/admin/tables/{id}", owner(s.deleteTable))

	mux.HandleFunc("GET /v1/pos/floor", admin(s.floor))
	mux.HandleFunc("GET /v1/pos/orders/{id}", admin(s.getPosOrder))
	mux.HandleFunc("PUT /v1/pos/orders/{id}", admin(s.putPosOrder))
	mux.HandleFunc("POST /v1/pos/orders/{id}/kitchen", admin(s.sendToKitchen))
	mux.HandleFunc("POST /v1/pos/orders/{id}/payments", admin(s.addPayment))
	mux.HandleFunc("POST /v1/pos/orders/{id}/void", admin(s.voidOrder))
	mux.HandleFunc("GET /v1/kitchen", admin(s.kitchen))
	mux.HandleFunc("POST /v1/kitchen/{id}/done", admin(s.ticketDone))

	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusNoContent) })
	mux.HandleFunc("/", s.notFound)

	srv := &http.Server{
		Addr:              addr,
		Handler:           recoverer(cors(origin, mux)),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       20 * time.Second,
		WriteTimeout:      30 * time.Second,
	}
	slog.Info("api listening", "addr", addr)
	log.Fatal(srv.ListenAndServe())
}

func cors(origin string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("Origin") == origin {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func recoverer(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if v := recover(); v != nil {
				slog.Error("panic", "path", r.URL.Path, "err", v)
				writeJSON(w, http.StatusInternalServerError, map[string]*apiError{"error": errInternal})
			}
		}()
		next.ServeHTTP(w, r)
	})
}

package main

import (
	"context"
	"embed"
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
	dbURL, addr, origin := mustEnv("DATABASE_URL"), mustEnv("ADDR"), mustEnv("CORS_ORIGIN")
	ctx := context.Background()

	pool, err := pgxpool.New(ctx, dbURL)
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

	s := &server{pool: pool, q: store.New(pool)}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /v1/restaurant", s.restaurant)
	mux.HandleFunc("GET /v1/menu", s.menu)
	mux.HandleFunc("POST /v1/orders", s.createOrder)
	mux.HandleFunc("POST /v1/reservations", s.createReservation)
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusNoContent) })
	mux.HandleFunc("/", s.notFound)

	srv := &http.Server{
		Addr:              addr,
		Handler:           recoverer(cors(origin, mux)),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      15 * time.Second,
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
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
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

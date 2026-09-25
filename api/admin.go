package main

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"slices"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/ebnsina/tavora/api/store"
)

func notFoundErr(what string) *apiError {
	return &apiError{http.StatusNotFound, "not_found", what + " not found", nil}
}

func isUnique(err error) bool {
	var pe *pgconn.PgError
	return errors.As(err, &pe) && pe.Code == "23505"
}

func pathID(r *http.Request) (int64, bool) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	return id, err == nil && id > 0
}

// ---- site content

func (s *server) site(w http.ResponseWriter, r *http.Request) {
	data, err := s.q.GetSiteContent(r.Context())
	if err != nil {
		fail(w, r, err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}

func (s *server) putSite(w http.ResponseWriter, r *http.Request) {
	var c SiteContent
	if err := decode(w, r, &c); err != nil {
		fail(w, r, err)
		return
	}
	if bad := c.validate(); len(bad) > 0 {
		fail(w, r, invalid(bad))
		return
	}
	data, _ := json.Marshal(c)
	if err := s.q.UpdateSiteContent(r.Context(), data); err != nil {
		fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, c)
}

// ---- restaurant details and hours (amounts in poisha)

func (s *server) putRestaurant(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name             string `json:"name"`
		Area             string `json:"area"`
		Address          string `json:"address"`
		Phone            string `json:"phone"`
		Whatsapp         string `json:"whatsapp"`
		Email            string `json:"email"`
		DeliveryFee      int64  `json:"delivery_fee"`
		FreeDeliveryOver int64  `json:"free_delivery_over"`
		DeliveryAreas    string `json:"delivery_areas"`
		DeliveryEta      string `json:"delivery_eta"`
		PickupEta        string `json:"pickup_eta"`
	}
	if err := decode(w, r, &req); err != nil {
		fail(w, r, err)
		return
	}
	bad := map[string]string{}
	need := func(field string, v *string, max int) {
		if t, ok := text(*v, max); ok {
			*v = t
		} else {
			bad[field] = fmt.Sprintf("required, up to %d characters", max)
		}
	}
	need("name", &req.Name, 40)
	need("area", &req.Area, 60)
	need("address", &req.Address, 200)
	need("phone", &req.Phone, 20)
	need("whatsapp", &req.Whatsapp, 20)
	need("email", &req.Email, 120)
	need("delivery_areas", &req.DeliveryAreas, 200)
	need("delivery_eta", &req.DeliveryEta, 20)
	need("pickup_eta", &req.PickupEta, 20)
	if normalizePhone(req.Phone) == "" {
		bad["phone"] = "must be a Bangladeshi mobile number"
	}
	if normalizePhone(req.Whatsapp) == "" {
		bad["whatsapp"] = "must be a Bangladeshi mobile number"
	}
	if !strings.Contains(req.Email, "@") {
		bad["email"] = "must be an email address"
	}
	if req.DeliveryFee < 0 || req.DeliveryFee > 1_000_000 {
		bad["delivery_fee"] = "between ৳0 and ৳10,000"
	}
	if req.FreeDeliveryOver < 0 || req.FreeDeliveryOver > 100_000_000 {
		bad["free_delivery_over"] = "between ৳0 and ৳1,000,000"
	}
	if len(bad) > 0 {
		fail(w, r, invalid(bad))
		return
	}
	// Phone is shown as +880…; WhatsApp links need bare digits.
	err := s.q.UpdateRestaurant(r.Context(), store.UpdateRestaurantParams{
		Name: req.Name, Area: req.Area, Address: req.Address,
		Phone: "+88" + normalizePhone(req.Phone), Whatsapp: "88" + normalizePhone(req.Whatsapp), Email: req.Email,
		DeliveryFee: req.DeliveryFee, FreeDeliveryOver: req.FreeDeliveryOver,
		DeliveryAreas: req.DeliveryAreas, DeliveryEta: req.DeliveryEta, PickupEta: req.PickupEta,
	})
	if err != nil {
		fail(w, r, err)
		return
	}
	s.restaurant(w, r)
}

func parseClock(v string) (pgtype.Time, bool) {
	t, err := time.Parse("15:04", v)
	return pgtype.Time{Microseconds: int64(t.Hour()*60+t.Minute()) * 60_000_000, Valid: true}, err == nil
}

// putHours replaces the whole week; a weekday that isn't listed is closed.
func (s *server) putHours(w http.ResponseWriter, r *http.Request) {
	var req []hoursJSON
	if err := decode(w, r, &req); err != nil {
		fail(w, r, err)
		return
	}
	bad := map[string]string{}
	seen := map[int16]bool{}
	rows := make([]store.InsertOpeningHoursParams, 0, len(req))
	for _, h := range req {
		opens, ok1 := parseClock(h.Opens)
		closes, ok2 := parseClock(h.Closes)
		switch {
		case h.Weekday < 0 || h.Weekday > 6 || seen[h.Weekday]:
			bad[fmt.Sprint(h.Weekday)] = "each weekday 0–6 at most once"
		case !ok1 || !ok2 || closes.Microseconds <= opens.Microseconds:
			bad[fmt.Sprint(h.Weekday)] = "closing time must be after opening time"
		}
		seen[h.Weekday] = true
		rows = append(rows, store.InsertOpeningHoursParams{Weekday: h.Weekday, Opens: opens, Closes: closes})
	}
	if len(bad) > 0 {
		fail(w, r, invalid(bad))
		return
	}
	err := pgx.BeginFunc(r.Context(), s.pool, func(tx pgx.Tx) error {
		q := s.q.WithTx(tx)
		if err := q.DeleteOpeningHours(r.Context()); err != nil {
			return err
		}
		for _, row := range rows {
			if err := q.InsertOpeningHours(r.Context(), row); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		fail(w, r, err)
		return
	}
	s.restaurant(w, r)
}

// ---- categories

func (s *server) listCategories(w http.ResponseWriter, r *http.Request) {
	rows, err := s.q.ListCategories(r.Context())
	if err != nil {
		fail(w, r, err)
		return
	}
	out := make([]map[string]any, len(rows))
	for i, c := range rows {
		out[i] = map[string]any{"id": c.ID, "slug": c.Slug, "name": c.Name, "position": c.Position}
	}
	writeJSON(w, http.StatusOK, out)
}

var nonSlug = regexp.MustCompile(`[^a-z0-9]+`)

func slugify(name string) string {
	return strings.Trim(nonSlug.ReplaceAllString(strings.ToLower(name), "-"), "-")
}

func (s *server) createCategory(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name string `json:"name"`
	}
	if err := decode(w, r, &req); err != nil {
		fail(w, r, err)
		return
	}
	name, ok := text(req.Name, 40)
	if !ok || slugify(name) == "" {
		fail(w, r, invalid(map[string]string{"name": "required, up to 40 characters, with at least one letter or digit"}))
		return
	}
	c, err := s.q.CreateCategory(r.Context(), store.CreateCategoryParams{Slug: slugify(name), Name: name})
	if isUnique(err) {
		fail(w, r, &apiError{http.StatusConflict, "name_taken", "a category with that name already exists", nil})
		return
	}
	if err != nil {
		fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"id": c.ID, "slug": c.Slug, "name": c.Name, "position": c.Position})
}

func (s *server) updateCategory(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(r)
	var req struct {
		Name     string `json:"name"`
		Position int32  `json:"position"`
	}
	if err := decode(w, r, &req); err != nil {
		fail(w, r, err)
		return
	}
	name, nameOK := text(req.Name, 40)
	if !ok || !nameOK || slugify(name) == "" || req.Position < 0 {
		fail(w, r, invalid(map[string]string{"name": "required, up to 40 characters", "position": "0 or more"}))
		return
	}
	n, err := s.q.UpdateCategory(r.Context(), store.UpdateCategoryParams{ID: id, Name: name, Slug: slugify(name), Position: req.Position})
	switch {
	case isUnique(err):
		fail(w, r, &apiError{http.StatusConflict, "name_taken", "a category with that name already exists", nil})
	case err != nil:
		fail(w, r, err)
	case n == 0:
		fail(w, r, notFoundErr("category"))
	default:
		w.WriteHeader(http.StatusNoContent)
	}
}

func (s *server) deleteCategory(w http.ResponseWriter, r *http.Request) {
	id, _ := pathID(r)
	count, err := s.q.CountCategoryItems(r.Context(), id)
	if err != nil {
		fail(w, r, err)
		return
	}
	if count > 0 {
		fail(w, r, &apiError{http.StatusConflict, "category_not_empty", "move or delete its dishes first", map[string]any{"items": count}})
		return
	}
	if n, err := s.q.DeleteCategory(r.Context(), id); err != nil {
		fail(w, r, err)
	} else if n == 0 {
		fail(w, r, notFoundErr("category"))
	} else {
		w.WriteHeader(http.StatusNoContent)
	}
}

// ---- menu items

type itemReq struct {
	CategoryID  int64    `json:"category_id"`
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Price       int64    `json:"price"`
	Tags        []string `json:"tags"`
	Image       string   `json:"image"`
	Available   bool     `json:"available"`
	Position    int32    `json:"position"`
}

func (req *itemReq) validate() map[string]string {
	bad := map[string]string{}
	var ok bool
	if req.Name, ok = text(req.Name, 60); !ok {
		bad["name"] = "required, up to 60 characters"
	}
	req.Description = strings.TrimSpace(req.Description)
	if len([]rune(req.Description)) > 200 {
		bad["description"] = "up to 200 characters"
	}
	if req.Price <= 0 || req.Price > 10_000_000 {
		bad["price"] = "between ৳0.01 and ৳100,000"
	}
	if req.Tags == nil {
		req.Tags = []string{}
	}
	for _, t := range req.Tags {
		if !slices.Contains([]string{"veg", "spicy", "popular"}, t) {
			bad["tags"] = "only veg, spicy or popular"
		}
	}
	req.Image = strings.TrimSpace(req.Image)
	if req.Image != "" && (!strings.HasPrefix(req.Image, "/") || strings.HasPrefix(req.Image, "//")) {
		bad["image"] = "must be an uploaded image path"
	}
	if req.CategoryID <= 0 {
		bad["category_id"] = "required"
	}
	return bad
}

func (s *server) itemError(w http.ResponseWriter, r *http.Request, err error) {
	var pe *pgconn.PgError
	switch {
	case isUnique(err):
		fail(w, r, &apiError{http.StatusConflict, "name_taken", "a dish with that name already exists", nil})
	case errors.As(err, &pe) && pe.Code == "23503":
		fail(w, r, invalid(map[string]string{"category_id": "no such category"}))
	default:
		fail(w, r, err)
	}
}

func imagePtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func (s *server) createItem(w http.ResponseWriter, r *http.Request) {
	var req itemReq
	if err := decode(w, r, &req); err != nil {
		fail(w, r, err)
		return
	}
	if bad := req.validate(); len(bad) > 0 {
		fail(w, r, invalid(bad))
		return
	}
	it, err := s.q.CreateMenuItem(r.Context(), store.CreateMenuItemParams{
		CategoryID: req.CategoryID, Name: req.Name, Description: req.Description, Price: req.Price,
		Tags: req.Tags, Image: imagePtr(req.Image), Available: req.Available,
	})
	if err != nil {
		s.itemError(w, r, err)
		return
	}
	writeJSON(w, http.StatusCreated, itemJSON{it.ID, it.CategoryID, it.Position, it.Name, it.Description, it.Price, it.Tags, it.Image, it.Available})
}

func (s *server) updateItem(w http.ResponseWriter, r *http.Request) {
	id, _ := pathID(r)
	var req itemReq
	if err := decode(w, r, &req); err != nil {
		fail(w, r, err)
		return
	}
	if bad := req.validate(); len(bad) > 0 {
		fail(w, r, invalid(bad))
		return
	}
	n, err := s.q.UpdateMenuItem(r.Context(), store.UpdateMenuItemParams{
		ID: id, CategoryID: req.CategoryID, Name: req.Name, Description: req.Description, Price: req.Price,
		Tags: req.Tags, Image: imagePtr(req.Image), Available: req.Available, Position: req.Position,
	})
	switch {
	case err != nil:
		s.itemError(w, r, err)
	case n == 0:
		fail(w, r, notFoundErr("dish"))
	default:
		w.WriteHeader(http.StatusNoContent)
	}
}

// deleteItem refuses dishes that appear on past orders; those keep their history and get marked sold out instead.
func (s *server) deleteItem(w http.ResponseWriter, r *http.Request) {
	id, _ := pathID(r)
	count, err := s.q.CountItemOrders(r.Context(), id)
	if err != nil {
		fail(w, r, err)
		return
	}
	if count > 0 {
		fail(w, r, &apiError{http.StatusConflict, "item_has_orders", "this dish is on past orders; mark it sold out instead", map[string]any{"orders": count}})
		return
	}
	if n, err := s.q.DeleteMenuItem(r.Context(), id); err != nil {
		fail(w, r, err)
	} else if n == 0 {
		fail(w, r, notFoundErr("dish"))
	} else {
		w.WriteHeader(http.StatusNoContent)
	}
}

// ---- orders and reservations

func (s *server) listOrders(w http.ResponseWriter, r *http.Request) {
	var status *store.OrderStatus
	if v := r.URL.Query().Get("status"); v != "" {
		st := store.OrderStatus(v)
		if !st.Valid() {
			fail(w, r, invalid(map[string]string{"status": "unknown status"}))
			return
		}
		status = &st
	}
	orders, err := s.q.ListOrders(r.Context(), status)
	if err != nil {
		fail(w, r, err)
		return
	}
	ids := make([]pgtype.UUID, len(orders))
	for i, o := range orders {
		ids[i] = o.ID
	}
	rows, err := s.q.ListOrderItemsFor(r.Context(), ids)
	if err != nil {
		fail(w, r, err)
		return
	}
	byOrder := map[pgtype.UUID][]store.OrderItem{}
	for _, row := range rows {
		byOrder[row.OrderID] = append(byOrder[row.OrderID], row)
	}
	out := make([]map[string]any, len(orders))
	for i, o := range orders {
		out[i] = orderView(o, byOrder[o.ID])
	}
	writeJSON(w, http.StatusOK, out)
}

func (s *server) patchOrder(w http.ResponseWriter, r *http.Request) {
	id, ok := parseUUID(r.PathValue("id"))
	var req struct {
		Status string `json:"status"`
	}
	if err := decode(w, r, &req); err != nil {
		fail(w, r, err)
		return
	}
	if st := store.OrderStatus(req.Status); !ok || !st.Valid() {
		fail(w, r, invalid(map[string]string{"status": "unknown status"}))
		return
	}
	n, err := s.q.UpdateOrderStatus(r.Context(), store.UpdateOrderStatusParams{ID: id, Status: store.OrderStatus(req.Status)})
	switch {
	case err != nil:
		fail(w, r, err)
	case n == 0:
		fail(w, r, notFoundErr("order"))
	default:
		s.writeOrder(w, r, id, http.StatusOK)
	}
}

func (s *server) listReservations(w http.ResponseWriter, r *http.Request) {
	rows, err := s.q.ListReservations(r.Context())
	if err != nil {
		fail(w, r, err)
		return
	}
	out := make([]map[string]any, len(rows))
	for i, res := range rows {
		out[i] = reservationView(res)
	}
	writeJSON(w, http.StatusOK, out)
}

func (s *server) patchReservation(w http.ResponseWriter, r *http.Request) {
	id, ok := parseUUID(r.PathValue("id"))
	var req struct {
		Status string `json:"status"`
	}
	if err := decode(w, r, &req); err != nil {
		fail(w, r, err)
		return
	}
	if !ok || !slices.Contains([]string{"requested", "confirmed", "declined", "cancelled"}, req.Status) {
		fail(w, r, invalid(map[string]string{"status": "unknown status"}))
		return
	}
	n, err := s.q.UpdateReservationStatus(r.Context(), store.UpdateReservationStatusParams{ID: id, Status: req.Status})
	switch {
	case err != nil:
		fail(w, r, err)
	case n == 0:
		fail(w, r, notFoundErr("reservation"))
	default:
		w.WriteHeader(http.StatusNoContent)
	}
}

// ---- image uploads, stored on local disk and served from /uploads/

const maxUpload = 5 << 20

var imageExt = map[string]string{"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}

func (s *server) upload(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, maxUpload+1<<10)
	f, _, err := r.FormFile("file")
	if err != nil {
		fail(w, r, invalid(map[string]string{"file": "an image up to 5 MB is required"}))
		return
	}
	defer f.Close()
	data, err := io.ReadAll(f)
	if err != nil || len(data) > maxUpload {
		fail(w, r, invalid(map[string]string{"file": "an image up to 5 MB is required"}))
		return
	}
	// Trust the bytes, not the filename or the client's content type.
	ext, ok := imageExt[http.DetectContentType(data)]
	if !ok {
		fail(w, r, invalid(map[string]string{"file": "must be a JPEG, PNG or WebP image"}))
		return
	}
	b := make([]byte, 16)
	rand.Read(b)
	name := hex.EncodeToString(b) + ext
	if err := os.WriteFile(filepath.Join(s.uploadDir, name), data, 0o644); err != nil {
		fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]string{"url": "/uploads/" + name})
}

// uploads serves stored files; directory paths 404 instead of listing contents.
func (s *server) uploads() http.Handler {
	files := http.StripPrefix("/uploads/", http.FileServer(http.Dir(s.uploadDir)))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/") {
			s.notFound(w, r)
			return
		}
		w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
		files.ServeHTTP(w, r)
	})
}

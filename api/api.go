package main

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/ebnsina/tavora/api/store"
)

var bdTime = mustLoc("Asia/Dhaka")

type server struct {
	pool      *pgxpool.Pool
	q         *store.Queries
	uploadDir string
	logins    *throttle
}

// apiError is the only error shape clients ever see; Code is stable, Message is for developers.
type apiError struct {
	Status  int            `json:"-"`
	Code    string         `json:"code"`
	Message string         `json:"message"`
	Details map[string]any `json:"details,omitempty"`
}

func (e *apiError) Error() string { return e.Code }

func invalid(fields map[string]string) *apiError {
	d := map[string]any{}
	for k, v := range fields {
		d[k] = v
	}
	return &apiError{http.StatusUnprocessableEntity, "validation_failed", "some fields are invalid", d}
}

var errInternal = &apiError{http.StatusInternalServerError, "internal", "something went wrong", nil}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func fail(w http.ResponseWriter, r *http.Request, err error) {
	var e *apiError
	if !errors.As(err, &e) {
		slog.Error("request failed", "path", r.URL.Path, "err", err)
		e = errInternal
	}
	writeJSON(w, e.Status, map[string]*apiError{"error": e})
}

func decode(w http.ResponseWriter, r *http.Request, v any) error {
	d := json.NewDecoder(http.MaxBytesReader(w, r.Body, 64<<10))
	d.DisallowUnknownFields()
	if err := d.Decode(v); err != nil {
		return &apiError{http.StatusBadRequest, "bad_request", "body must be valid JSON: " + err.Error(), nil}
	}
	return nil
}

func parseUUID(s string) (pgtype.UUID, bool) {
	var u pgtype.UUID
	return u, u.Scan(s) == nil
}

func text(s string, max int) (string, bool) {
	s = strings.TrimSpace(s)
	return s, s != "" && utf8.RuneCountInString(s) <= max
}

func optional(s string, max int) (*string, bool) {
	s = strings.TrimSpace(s)
	if s == "" {
		return nil, true
	}
	return &s, utf8.RuneCountInString(s) <= max
}

// ---- GET /v1/restaurant

type hoursJSON struct {
	Weekday int16  `json:"weekday"`
	Opens   string `json:"opens"`
	Closes  string `json:"closes"`
}

func (s *server) restaurant(w http.ResponseWriter, r *http.Request) {
	info, err := s.q.GetRestaurant(r.Context())
	if err != nil {
		fail(w, r, err)
		return
	}
	rows, err := s.q.ListOpeningHours(r.Context())
	if err != nil {
		fail(w, r, err)
		return
	}
	hours := make([]hoursJSON, len(rows))
	for i, h := range rows {
		hours[i] = hoursJSON{h.Weekday, clock(h.Opens), clock(h.Closes)}
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"name": info.Name, "area": info.Area, "address": info.Address,
		"phone": info.Phone, "whatsapp": info.Whatsapp, "email": info.Email,
		"delivery": map[string]any{
			"fee": info.DeliveryFee, "free_over": info.FreeDeliveryOver,
			"areas": info.DeliveryAreas, "eta": info.DeliveryEta,
		},
		"pickup_eta": info.PickupEta,
		"hours":      hours,
		"vat":        map[string]any{"rate": info.VatRate, "inclusive": info.VatInclusive, "bin": info.Bin},
		"theme":      info.Theme,
	})
}

// ---- GET /v1/menu

type itemJSON struct {
	ID          int64    `json:"id"`
	CategoryID  int64    `json:"category_id"`
	Position    int32    `json:"position"`
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Price       int64    `json:"price"`
	Tags        []string `json:"tags"`
	Image       *string  `json:"image"`
	Available   bool     `json:"available"`
}

type categoryJSON struct {
	ID    int64      `json:"id"`
	Slug  string     `json:"slug"`
	Name  string     `json:"name"`
	Items []itemJSON `json:"items"`
}

func (s *server) menu(w http.ResponseWriter, r *http.Request) {
	rows, err := s.q.ListMenu(r.Context())
	if err != nil {
		fail(w, r, err)
		return
	}
	cats := []categoryJSON{}
	for _, row := range rows {
		if len(cats) == 0 || cats[len(cats)-1].Slug != row.CategorySlug {
			cats = append(cats, categoryJSON{ID: row.CategoryID, Slug: row.CategorySlug, Name: row.CategoryName, Items: []itemJSON{}})
		}
		c := &cats[len(cats)-1]
		c.Items = append(c.Items, itemJSON{row.ID, row.CategoryID, row.Position, row.Name, row.Description, row.Price, row.Tags, row.Image, row.Available})
	}
	writeJSON(w, http.StatusOK, cats)
}

// ---- POST /v1/orders

type orderReq struct {
	ID      string `json:"id"`
	Mode    string `json:"mode"`
	Name    string `json:"name"`
	Phone   string `json:"phone"`
	Address string `json:"address"`
	Note    string `json:"note"`
	Items   []line `json:"items"`
}

func (s *server) createOrder(w http.ResponseWriter, r *http.Request) {
	var req orderReq
	if err := decode(w, r, &req); err != nil {
		fail(w, r, err)
		return
	}
	ctx := r.Context()

	bad := map[string]string{}
	id, ok := parseUUID(req.ID)
	if !ok {
		bad["id"] = "must be a UUID"
	}
	if req.Mode != "delivery" && req.Mode != "pickup" {
		bad["mode"] = "must be delivery or pickup"
	}
	name, ok := text(req.Name, 80)
	if !ok {
		bad["name"] = "required, up to 80 characters"
	}
	phone := normalizePhone(req.Phone)
	if phone == "" {
		bad["phone"] = "must be a Bangladeshi mobile number"
	}
	var address *string
	if req.Mode == "delivery" {
		a, ok := text(req.Address, 300)
		if !ok {
			bad["address"] = "required for delivery, up to 300 characters"
		}
		address = &a
	}
	note, ok := optional(req.Note, 300)
	if !ok {
		bad["note"] = "up to 300 characters"
	}
	ids := make([]int64, 0, len(req.Items))
	seen := map[int64]bool{}
	for _, l := range req.Items {
		if l.Qty < 1 || l.Qty > 50 || seen[l.ID] {
			bad["items"] = "each item once, quantity 1 to 50"
		}
		seen[l.ID] = true
		ids = append(ids, l.ID)
	}
	if len(req.Items) == 0 || len(req.Items) > 30 {
		bad["items"] = "between 1 and 30 different items"
	}
	if len(bad) > 0 {
		fail(w, r, invalid(bad))
		return
	}

	now := time.Now().In(bdTime)
	today, err := s.q.GetOpeningHours(ctx, int16(now.Weekday()))
	if errors.Is(err, pgx.ErrNoRows) || (err == nil && !isOpen(today, now.Hour()*60+now.Minute())) {
		d := map[string]any{}
		if err == nil {
			d["opens"], d["closes"] = clock(today.Opens), clock(today.Closes)
		}
		fail(w, r, &apiError{http.StatusConflict, "restaurant_closed", "orders are only taken during opening hours", d})
		return
	}
	if err != nil {
		fail(w, r, err)
		return
	}

	info, err := s.q.GetRestaurant(ctx)
	if err != nil {
		fail(w, r, err)
		return
	}
	found, err := s.q.GetMenuItems(ctx, ids)
	if err != nil {
		fail(w, r, err)
		return
	}
	items := make(map[int64]store.MenuItem, len(found))
	for _, it := range found {
		items[it.ID] = it
	}
	sub, fee, perr := priceOrder(req.Items, items, req.Mode == "delivery", info)
	if perr != nil {
		fail(w, r, perr)
		return
	}
	// ponytail: VAT on food only, not the delivery fee; confirm with the accountant if delivery is taxable.
	vat, add := vatOn(sub, info.VatRate, info.VatInclusive)

	status := http.StatusOK
	err = pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		q := s.q.WithTx(tx)
		n, err := q.InsertOrder(ctx, store.InsertOrderParams{
			ID: id, Mode: store.OrderMode(req.Mode), CustomerName: name, Phone: &phone,
			Address: address, Note: note, Subtotal: sub, DeliveryFee: fee, Total: sub + fee + add,
			Vat: vat, VatRate: info.VatRate, VatInclusive: info.VatInclusive,
		})
		if err != nil || n == 0 {
			return err // n == 0: a retry of an order we already saved
		}
		status = http.StatusCreated
		for _, l := range req.Items {
			it := items[l.ID]
			if err := q.InsertOrderItem(ctx, store.InsertOrderItemParams{
				OrderID: id, MenuItemID: it.ID, Name: it.Name, UnitPrice: it.Price, Qty: int32(l.Qty),
			}); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		fail(w, r, err)
		return
	}
	s.writeOrder(w, r, id, status)
}

func (s *server) writeOrder(w http.ResponseWriter, r *http.Request, id pgtype.UUID, status int) {
	o, err := s.q.GetOrder(r.Context(), id)
	if err != nil {
		fail(w, r, err)
		return
	}
	rows, err := s.q.ListOrderItems(r.Context(), id)
	if err != nil {
		fail(w, r, err)
		return
	}
	writeJSON(w, status, orderView(o, rows))
}

type lineJSON struct {
	ID        int64  `json:"id"`
	Name      string `json:"name"`
	UnitPrice int64  `json:"unit_price"`
	Qty       int32  `json:"qty"`
	Amount    int64  `json:"amount"`
	Sent      int32   `json:"sent"`
	Note      *string `json:"note"`
}

func orderView(o store.Order, rows []store.OrderItem) map[string]any {
	lines := make([]lineJSON, len(rows))
	for i, l := range rows {
		lines[i] = lineJSON{l.MenuItemID, l.Name, l.UnitPrice, l.Qty, l.UnitPrice * int64(l.Qty), l.SentQty, l.Note}
	}
	return map[string]any{
		"id": o.ID.String(), "number": o.Number, "mode": o.Mode, "status": o.Status, "payment": o.Payment,
		"name": o.CustomerName, "phone": o.Phone, "address": o.Address, "note": o.Note,
		"items": lines, "subtotal": o.Subtotal, "delivery_fee": o.DeliveryFee, "total": o.Total,
		"vat": o.Vat, "vat_rate": o.VatRate, "vat_inclusive": o.VatInclusive,
		"created_at": o.CreatedAt.Time,
	}
}

func reservationView(res store.Reservation) map[string]any {
	local := res.StartsAt.Time.In(bdTime)
	return map[string]any{
		"id": res.ID.String(), "name": res.CustomerName, "phone": res.Phone, "guests": res.Guests,
		"date": local.Format("2006-01-02"), "time": local.Format("15:04"), "note": res.Note,
		"status": res.Status, "created_at": res.CreatedAt.Time,
	}
}

// ---- POST /v1/reservations

type reservationReq struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Phone  string `json:"phone"`
	Guests int    `json:"guests"`
	Date   string `json:"date"` // YYYY-MM-DD, restaurant local time
	Time   string `json:"time"` // HH:MM
	Note   string `json:"note"`
}

func (s *server) createReservation(w http.ResponseWriter, r *http.Request) {
	var req reservationReq
	if err := decode(w, r, &req); err != nil {
		fail(w, r, err)
		return
	}
	ctx := r.Context()

	bad := map[string]string{}
	id, ok := parseUUID(req.ID)
	if !ok {
		bad["id"] = "must be a UUID"
	}
	name, ok := text(req.Name, 80)
	if !ok {
		bad["name"] = "required, up to 80 characters"
	}
	phone := normalizePhone(req.Phone)
	if phone == "" {
		bad["phone"] = "must be a Bangladeshi mobile number"
	}
	if req.Guests < 1 || req.Guests > 12 {
		bad["guests"] = "between 1 and 12"
	}
	note, ok := optional(req.Note, 300)
	if !ok {
		bad["note"] = "up to 300 characters"
	}
	at, err := time.ParseInLocation("2006-01-02 15:04", req.Date+" "+req.Time, bdTime)
	if err != nil {
		bad["date"] = "date must be YYYY-MM-DD and time HH:MM"
	}
	if len(bad) > 0 {
		fail(w, r, invalid(bad))
		return
	}

	now := time.Now()
	if !at.After(now) || at.After(now.AddDate(0, 0, 60)) {
		fail(w, r, invalid(map[string]string{"date": "must be in the next 60 days"}))
		return
	}
	hours, err := s.q.GetOpeningHours(ctx, int16(at.Weekday()))
	if errors.Is(err, pgx.ErrNoRows) || (err == nil && !slotOK(hours, at.Hour()*60+at.Minute())) {
		fail(w, r, &apiError{http.StatusUnprocessableEntity, "outside_opening_hours", "no table can be booked at that time", nil})
		return
	}
	if err != nil {
		fail(w, r, err)
		return
	}

	status := http.StatusOK
	n, err := s.q.InsertReservation(ctx, store.InsertReservationParams{
		ID: id, CustomerName: name, Phone: phone, Guests: int16(req.Guests),
		StartsAt: pgtype.Timestamptz{Time: at, Valid: true}, Note: note,
	})
	if err != nil {
		fail(w, r, err)
		return
	}
	if n == 1 {
		status = http.StatusCreated
	}
	res, err := s.q.GetReservation(ctx, id)
	if err != nil {
		fail(w, r, err)
		return
	}
	writeJSON(w, status, reservationView(res))
}

func (s *server) notFound(w http.ResponseWriter, r *http.Request) {
	fail(w, r, &apiError{http.StatusNotFound, "not_found", "no such endpoint", nil})
}

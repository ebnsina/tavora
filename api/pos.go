package main

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"slices"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/ebnsina/tavora/api/store"
)

// Every POS write carries an id made on the device, so a retry after a dropped connection never
// doubles a ticket, a kitchen send or a payment. That's what lets the POS queue work while offline.

var (
	errClosed = &apiError{http.StatusConflict, "order_closed", "this ticket is already paid or voided", nil}
	errBusy   = &apiError{http.StatusConflict, "table_busy", "that table already has an open ticket", nil}
)

type kitchenLine struct {
	Name string  `json:"name"`
	Qty  int32   `json:"qty"`
	Note *string `json:"note,omitempty"`
}

// posView is an order plus what the till needs: what's been sent, what's been paid, what's left.
func (s *server) posView(ctx context.Context, q *store.Queries, id pgtype.UUID) (map[string]any, error) {
	o, err := q.GetOrder(ctx, id)
	if err != nil {
		return nil, err
	}
	items, err := q.ListOrderItems(ctx, id)
	if err != nil {
		return nil, err
	}
	pays, err := q.ListPayments(ctx, id)
	if err != nil {
		return nil, err
	}
	v := orderView(o, items)
	// Names of whoever opened, voided or took payment, for the order page and the bill.
	ids := []int64{}
	for _, by := range []*int64{o.CreatedBy, o.VoidedBy} {
		if by != nil {
			ids = append(ids, *by)
		}
	}
	for _, p := range pays {
		if p.TakenBy != nil {
			ids = append(ids, *p.TakenBy)
		}
	}
	names := map[int64]string{}
	if len(ids) > 0 {
		rows, err := q.AdminNames(ctx, ids)
		if err != nil {
			return nil, err
		}
		for _, n := range rows {
			names[n.ID] = n.Name
		}
	}
	name := func(id *int64) any {
		if id == nil {
			return nil
		}
		return names[*id]
	}
	var paid int64
	payJSON := make([]map[string]any, len(pays))
	for i, p := range pays {
		paid += p.Amount
		payJSON[i] = map[string]any{"id": p.ID.String(), "method": p.Method, "amount": p.Amount, "tip": p.Tip, "reference": p.Reference, "created_at": p.CreatedAt.Time, "taken_by": name(p.TakenBy)}
	}
	v["payments"], v["paid"], v["due"] = payJSON, paid, o.Total-paid
	v["source"], v["table_id"], v["discount"] = o.Source, o.TableID, o.Discount
	v["created_by"], v["voided_by"], v["table"] = name(o.CreatedBy), name(o.VoidedBy), nil
	if o.TableID != nil {
		if t, err := q.TableName(ctx, *o.TableID); err == nil {
			v["table"] = t
		}
	}
	return v, nil
}

func (s *server) writePos(w http.ResponseWriter, r *http.Request, id pgtype.UUID, status int) {
	v, err := s.posView(r.Context(), s.q, id)
	if errors.Is(err, pgx.ErrNoRows) {
		fail(w, r, notFoundErr("ticket"))
		return
	}
	if err != nil {
		fail(w, r, err)
		return
	}
	writeJSON(w, status, v)
}

func (s *server) getPosOrder(w http.ResponseWriter, r *http.Request) {
	id, ok := parseUUID(r.PathValue("id"))
	if !ok {
		fail(w, r, notFoundErr("ticket"))
		return
	}
	s.writePos(w, r, id, http.StatusOK)
}

// ---- PUT /v1/pos/orders/{id}: create the ticket or replace its lines with the device's current list.

type posReq struct {
	Mode     string `json:"mode"` // dine_in or pickup (takeaway)
	TableID  *int64 `json:"table_id"`
	Name     string `json:"name"`
	Phone    string `json:"phone"`
	Note     string `json:"note"`
	Discount int64  `json:"discount"`
	Items    []line `json:"items"`
}

func (s *server) putPosOrder(w http.ResponseWriter, r *http.Request) {
	id, ok := parseUUID(r.PathValue("id"))
	var req posReq
	if err := decode(w, r, &req); err != nil {
		fail(w, r, err)
		return
	}
	bad := map[string]string{}
	if !ok {
		bad["id"] = "must be a UUID"
	}
	if req.Mode != "dine_in" && req.Mode != "pickup" {
		bad["mode"] = "dine_in or pickup"
	}
	if req.Mode == "dine_in" && req.TableID == nil {
		bad["table_id"] = "pick a table"
	}
	if req.Mode == "pickup" {
		req.TableID = nil
	}
	seen := map[int64]bool{}
	notes := map[int64]*string{}
	for _, l := range req.Items {
		if l.Qty < 1 || l.Qty > 99 || seen[l.ID] {
			bad["items"] = "each dish once, quantity 1 to 99"
		}
		seen[l.ID] = true
		n, ok := optional(l.Note, 100)
		if !ok {
			bad["items"] = "dish notes up to 100 characters"
		}
		notes[l.ID] = n
	}
	var phone *string
	if p := strings.TrimSpace(req.Phone); p != "" {
		if n := normalizePhone(p); n == "" {
			bad["phone"] = "must be a Bangladeshi mobile number"
		} else {
			phone = &n
		}
	}
	note, noteOK := optional(req.Note, 300)
	if !noteOK {
		bad["note"] = "up to 300 characters"
	}
	name := strings.TrimSpace(req.Name)
	if len([]rune(name)) > 80 {
		bad["name"] = "up to 80 characters"
	}
	if len(bad) > 0 {
		fail(w, r, invalid(bad))
		return
	}

	ctx := r.Context()
	actorID := actor(r).ID
	err := pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		q := s.q.WithTx(tx)
		existing, err := q.GetOrderForUpdate(ctx, id)
		isNew := errors.Is(err, pgx.ErrNoRows)
		if err != nil && !isNew {
			return err
		}
		if !isNew && existing.Status != "open" {
			return errClosed
		}

		// Lines already on the ticket keep the price they were rung up at.
		old := map[int64]store.OrderItem{}
		if !isNew {
			rows, err := q.ListOrderItems(ctx, id)
			if err != nil {
				return err
			}
			for _, it := range rows {
				old[it.MenuItemID] = it
			}
		}
		for mid, it := range old {
			want := int32(0)
			for _, l := range req.Items {
				if l.ID == mid {
					want = int32(l.Qty)
				}
			}
			if want < it.SentQty {
				return &apiError{http.StatusConflict, "already_sent", "the kitchen already has some of this dish, so it can't be reduced", map[string]any{"name": it.Name, "sent": it.SentQty}}
			}
		}
		ids := make([]int64, len(req.Items))
		for i, l := range req.Items {
			ids[i] = l.ID
		}
		found, err := q.GetMenuItems(ctx, ids)
		if err != nil {
			return err
		}
		menu := map[int64]store.MenuItem{}
		for _, m := range found {
			menu[m.ID] = m
		}

		var sub int64
		rows := make([]store.InsertPosItemParams, 0, len(req.Items))
		for _, l := range req.Items {
			prev, had := old[l.ID]
			m, ok := menu[l.ID]
			switch {
			case had:
				rows = append(rows, store.InsertPosItemParams{OrderID: id, MenuItemID: l.ID, Name: prev.Name, UnitPrice: prev.UnitPrice, Qty: int32(l.Qty), SentQty: prev.SentQty, Note: notes[l.ID]})
			case !ok:
				return &apiError{http.StatusUnprocessableEntity, "item_not_found", "a menu item no longer exists", map[string]any{"id": l.ID}}
			case !m.Available:
				return &apiError{http.StatusConflict, "item_unavailable", "a menu item is sold out", map[string]any{"id": l.ID, "name": m.Name}}
			default:
				rows = append(rows, store.InsertPosItemParams{OrderID: id, MenuItemID: l.ID, Name: m.Name, UnitPrice: m.Price, Qty: int32(l.Qty), Note: notes[l.ID]})
			}
			sub += rows[len(rows)-1].UnitPrice * int64(l.Qty)
		}
		if req.Discount < 0 || req.Discount > sub {
			return invalid(map[string]string{"discount": "between ৳0 and the bill amount"})
		}
		if name == "" {
			name = "Walk-in"
			if req.TableID != nil {
				name = "Table"
			}
		}
		mode := store.OrderMode(req.Mode)
		if isNew {
			err = q.InsertPosOrder(ctx, store.InsertPosOrderParams{ID: id, Mode: mode, TableID: req.TableID, CustomerName: name, Phone: phone, Note: note, Subtotal: sub, Discount: req.Discount, Total: sub - req.Discount, CreatedBy: &actorID})
		} else {
			err = q.UpdatePosOrder(ctx, store.UpdatePosOrderParams{ID: id, Mode: mode, TableID: req.TableID, CustomerName: name, Phone: phone, Note: note, Subtotal: sub, Discount: req.Discount, Total: sub - req.Discount})
		}
		if isUnique(err) {
			return errBusy
		}
		if err != nil {
			return err
		}
		if err := q.DeleteOrderItems(ctx, id); err != nil {
			return err
		}
		for _, row := range rows {
			if err := q.InsertPosItem(ctx, row); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		fail(w, r, err)
		return
	}
	s.writePos(w, r, id, http.StatusOK)
}

// ---- POST /v1/pos/orders/{id}/kitchen: send whatever the kitchen doesn't have yet.

func (s *server) sendToKitchen(w http.ResponseWriter, r *http.Request) {
	id, ok := parseUUID(r.PathValue("id"))
	var req struct {
		TicketID string `json:"ticket_id"`
	}
	if err := decode(w, r, &req); err != nil {
		fail(w, r, err)
		return
	}
	ticket, tok := parseUUID(req.TicketID)
	if !ok || !tok {
		fail(w, r, invalid(map[string]string{"ticket_id": "must be a UUID"}))
		return
	}
	ctx := r.Context()
	err := pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		q := s.q.WithTx(tx)
		o, err := q.GetOrderForUpdate(ctx, id)
		if errors.Is(err, pgx.ErrNoRows) {
			return notFoundErr("ticket")
		}
		if err != nil {
			return err
		}
		if done, err := q.KitchenTicketExists(ctx, ticket); err != nil || done {
			return err // a retry of a send that already went through
		}
		if o.Status != "open" {
			return errClosed
		}
		items, err := q.ListOrderItems(ctx, id)
		if err != nil {
			return err
		}
		lines := []kitchenLine{}
		for _, it := range items {
			if it.Qty > it.SentQty {
				lines = append(lines, kitchenLine{it.Name, it.Qty - it.SentQty, it.Note})
			}
		}
		if len(lines) == 0 {
			return &apiError{http.StatusConflict, "nothing_to_send", "the kitchen already has everything on this ticket", nil}
		}
		data, _ := json.Marshal(lines)
		if _, err := q.InsertKitchenTicket(ctx, store.InsertKitchenTicketParams{ID: ticket, OrderID: id, Lines: data}); err != nil {
			return err
		}
		return q.MarkAllSent(ctx, id)
	})
	if err != nil {
		fail(w, r, err)
		return
	}
	s.writePos(w, r, id, http.StatusOK)
}

// ---- POST /v1/pos/orders/{id}/payments: record one payment; the ticket closes once it's fully paid.

func (s *server) addPayment(w http.ResponseWriter, r *http.Request) {
	id, ok := parseUUID(r.PathValue("id"))
	var req struct {
		ID        string `json:"id"`
		Method    string `json:"method"`
		Amount    int64  `json:"amount"`
		Tip       int64  `json:"tip"`
		Reference string `json:"reference"`
	}
	if err := decode(w, r, &req); err != nil {
		fail(w, r, err)
		return
	}
	payID, pok := parseUUID(req.ID)
	bad := map[string]string{}
	if !ok || !pok {
		bad["id"] = "must be a UUID"
	}
	method := store.PayMethod(req.Method)
	if !method.Valid() {
		bad["method"] = "cash, card, bkash or nagad"
	}
	if req.Amount <= 0 {
		bad["amount"] = "more than ৳0"
	}
	if req.Tip < 0 || req.Tip > 10_000_000 {
		bad["tip"] = "between ৳0 and ৳100,000"
	}
	ref, refOK := optional(req.Reference, 60)
	if !refOK {
		bad["reference"] = "up to 60 characters"
	}
	if (method == "bkash" || method == "nagad") && ref == nil {
		bad["reference"] = "enter the transaction ID from the customer's phone"
	}
	if len(bad) > 0 {
		fail(w, r, invalid(bad))
		return
	}
	ctx := r.Context()
	by := actor(r).ID
	err := pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		q := s.q.WithTx(tx)
		o, err := q.GetOrderForUpdate(ctx, id)
		if errors.Is(err, pgx.ErrNoRows) {
			return notFoundErr("ticket")
		}
		if err != nil {
			return err
		}
		pays, err := q.ListPayments(ctx, id)
		if err != nil {
			return err
		}
		if slices.ContainsFunc(pays, func(p store.Payment) bool { return p.ID == payID }) {
			return nil // already recorded
		}
		if o.Status != "open" {
			return errClosed
		}
		var paid int64
		for _, p := range pays {
			paid += p.Amount
		}
		if due := o.Total - paid; req.Amount > due {
			return &apiError{http.StatusUnprocessableEntity, "overpayment", "that's more than what's left to pay", map[string]any{"due": due}}
		}
		if _, err := q.InsertPayment(ctx, store.InsertPaymentParams{ID: payID, OrderID: id, Method: method, Amount: req.Amount, Tip: req.Tip, Reference: ref, TakenBy: &by}); err != nil {
			return err
		}
		if paid+req.Amount >= o.Total {
			return q.CloseOrder(ctx, store.CloseOrderParams{Status: "completed", ID: id})
		}
		return nil
	})
	if err != nil {
		fail(w, r, err)
		return
	}
	s.writePos(w, r, id, http.StatusOK)
}

// ---- POST /v1/pos/orders/{id}/void: cancel a ticket nobody has paid anything on.

func (s *server) voidOrder(w http.ResponseWriter, r *http.Request) {
	id, ok := parseUUID(r.PathValue("id"))
	if !ok {
		fail(w, r, notFoundErr("ticket"))
		return
	}
	ctx := r.Context()
	err := pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		q := s.q.WithTx(tx)
		o, err := q.GetOrderForUpdate(ctx, id)
		if errors.Is(err, pgx.ErrNoRows) {
			return notFoundErr("ticket")
		}
		if err != nil || o.Status == "cancelled" {
			return err
		}
		if o.Status != "open" {
			return errClosed
		}
		if paid, err := q.PaidTotal(ctx, id); err != nil || paid > 0 {
			if err != nil {
				return err
			}
			return &apiError{http.StatusConflict, "has_payments", "money was already taken on this ticket, so it can't be voided", nil}
		}
		by := actor(r).ID
		return q.CloseOrder(ctx, store.CloseOrderParams{Status: "cancelled", ID: id, VoidedBy: &by})
	})
	if err != nil {
		fail(w, r, err)
		return
	}
	s.writePos(w, r, id, http.StatusOK)
}

// ---- GET /v1/pos/floor: every table with its open ticket, plus open takeaway tickets.

func (s *server) floor(w http.ResponseWriter, r *http.Request) {
	tables, err := s.q.ListTables(r.Context())
	if err != nil {
		fail(w, r, err)
		return
	}
	open, err := s.q.OpenTickets(r.Context())
	if err != nil {
		fail(w, r, err)
		return
	}
	ticket := func(o store.OpenTicketsRow) map[string]any {
		return map[string]any{
			"id": o.ID.String(), "number": o.Number, "mode": o.Mode, "name": o.CustomerName, "total": o.Total,
			"paid": o.Paid, "unsent": o.Unsent, "created_at": o.CreatedAt.Time, "table_id": o.TableID,
		}
	}
	byTable := map[int64]map[string]any{}
	counter := []map[string]any{}
	for _, o := range open {
		if o.TableID != nil {
			byTable[*o.TableID] = ticket(o)
		} else {
			counter = append(counter, ticket(o))
		}
	}
	out := make([]map[string]any, len(tables))
	for i, t := range tables {
		out[i] = map[string]any{"id": t.ID, "name": t.Name, "seats": t.Seats, "area": t.Area, "ticket": byTable[t.ID]}
	}
	writeJSON(w, http.StatusOK, map[string]any{"tables": out, "counter": counter})
}

// ---- Kitchen display

func (s *server) kitchen(w http.ResponseWriter, r *http.Request) {
	rows, err := s.q.KitchenBoard(r.Context())
	if err != nil {
		fail(w, r, err)
		return
	}
	out := make([]map[string]any, len(rows))
	for i, k := range rows {
		var lines []kitchenLine
		json.Unmarshal(k.Lines, &lines)
		out[i] = map[string]any{
			"id": k.ID.String(), "order_id": k.OrderID.String(), "number": k.Number, "mode": k.Mode,
			"source": k.Source, "table": k.TableName, "name": k.CustomerName, "lines": lines,
			"created_at": k.CreatedAt.Time, "done": k.DoneAt.Valid,
		}
	}
	writeJSON(w, http.StatusOK, out)
}

func (s *server) ticketDone(w http.ResponseWriter, r *http.Request) {
	id, ok := parseUUID(r.PathValue("id"))
	var req struct {
		Done bool `json:"done"`
	}
	if err := decode(w, r, &req); err != nil {
		fail(w, r, err)
		return
	}
	if !ok {
		fail(w, r, notFoundErr("kitchen ticket"))
		return
	}
	n, err := s.q.SetTicketDone(r.Context(), store.SetTicketDoneParams{Done: req.Done, ID: id})
	switch {
	case err != nil:
		fail(w, r, err)
	case n == 0:
		fail(w, r, notFoundErr("kitchen ticket"))
	default:
		w.WriteHeader(http.StatusNoContent)
	}
}

// sendOnlineToKitchen puts an accepted online order on the kitchen board, once.
func sendOnlineToKitchen(ctx context.Context, q *store.Queries, id pgtype.UUID) error {
	n, err := q.CountKitchenTickets(ctx, id)
	if err != nil || n > 0 {
		return err
	}
	items, err := q.ListOrderItems(ctx, id)
	if err != nil {
		return err
	}
	lines := make([]kitchenLine, len(items))
	for i, it := range items {
		lines[i] = kitchenLine{it.Name, it.Qty, it.Note}
	}
	data, _ := json.Marshal(lines)
	if _, err := q.InsertKitchenTicket(ctx, store.InsertKitchenTicketParams{ID: newUUID(), OrderID: id, Lines: data}); err != nil {
		return err
	}
	return q.MarkAllSent(ctx, id)
}

// ---- Tables (dashboard)

type tableReq struct {
	Name  string `json:"name"`
	Seats int16  `json:"seats"`
	Area  string `json:"area"`
}

func (t *tableReq) validate() map[string]string {
	bad := map[string]string{}
	var ok bool
	if t.Name, ok = text(t.Name, 20); !ok {
		bad["name"] = "required, up to 20 characters"
	}
	if t.Seats < 1 || t.Seats > 30 {
		bad["seats"] = "between 1 and 30"
	}
	t.Area = strings.TrimSpace(t.Area)
	if len([]rune(t.Area)) > 30 {
		bad["area"] = "up to 30 characters"
	}
	return bad
}

func (s *server) listTables(w http.ResponseWriter, r *http.Request) {
	rows, err := s.q.ListTables(r.Context())
	if err != nil {
		fail(w, r, err)
		return
	}
	out := make([]map[string]any, len(rows))
	for i, t := range rows {
		out[i] = map[string]any{"id": t.ID, "name": t.Name, "seats": t.Seats, "area": t.Area}
	}
	writeJSON(w, http.StatusOK, out)
}

func (s *server) createTable(w http.ResponseWriter, r *http.Request) {
	var req tableReq
	if err := decode(w, r, &req); err != nil {
		fail(w, r, err)
		return
	}
	if bad := req.validate(); len(bad) > 0 {
		fail(w, r, invalid(bad))
		return
	}
	t, err := s.q.CreateTable(r.Context(), store.CreateTableParams{Name: req.Name, Seats: req.Seats, Area: req.Area})
	if isUnique(err) {
		fail(w, r, &apiError{http.StatusConflict, "name_taken", "a table with that name already exists", nil})
		return
	}
	if err != nil {
		fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"id": t.ID, "name": t.Name, "seats": t.Seats, "area": t.Area})
}

func (s *server) updateTable(w http.ResponseWriter, r *http.Request) {
	id, _ := pathID(r)
	var req tableReq
	if err := decode(w, r, &req); err != nil {
		fail(w, r, err)
		return
	}
	if bad := req.validate(); len(bad) > 0 {
		fail(w, r, invalid(bad))
		return
	}
	n, err := s.q.UpdateTable(r.Context(), store.UpdateTableParams{ID: id, Name: req.Name, Seats: req.Seats, Area: req.Area})
	switch {
	case isUnique(err):
		fail(w, r, &apiError{http.StatusConflict, "name_taken", "a table with that name already exists", nil})
	case err != nil:
		fail(w, r, err)
	case n == 0:
		fail(w, r, notFoundErr("table"))
	default:
		w.WriteHeader(http.StatusNoContent)
	}
}

// deleteTable keeps tables that past tickets point to, so old bills still show where people sat.
func (s *server) deleteTable(w http.ResponseWriter, r *http.Request) {
	id, _ := pathID(r)
	n, err := s.q.DeleteTable(r.Context(), id)
	switch {
	case err != nil:
		fail(w, r, err)
	case n == 0:
		fail(w, r, &apiError{http.StatusConflict, "table_in_use", "this table has tickets on record; rename it instead", nil})
	default:
		w.WriteHeader(http.StatusNoContent)
	}
}

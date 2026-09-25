package main

import (
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
)

// GET /v1/admin/alerts: what's waiting for a reply, polled by every dashboard and POS screen.
func (s *server) alerts(w http.ResponseWriter, r *http.Request) {
	a, err := s.q.Alerts(r.Context())
	if err != nil {
		fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"new_orders": a.NewOrders, "waiting_bookings": a.WaitingBookings})
}

// GET /v1/admin/reports/day?date=YYYY-MM-DD: the closing report for one Bangladesh day (today if omitted).
func (s *server) dayReport(w http.ResponseWriter, r *http.Request) {
	date := r.URL.Query().Get("date")
	if date == "" {
		date = time.Now().In(bdTime).Format("2006-01-02")
	}
	t, err := time.ParseInLocation("2006-01-02", date, bdTime)
	if err != nil {
		fail(w, r, invalid(map[string]string{"date": "YYYY-MM-DD"}))
		return
	}
	day := pgtype.Date{Time: t, Valid: true}
	ctx := r.Context()
	pays, err := s.q.DayPayments(ctx, day)
	if err != nil {
		fail(w, r, err)
		return
	}
	staff, err := s.q.DayByStaff(ctx, day)
	if err != nil {
		fail(w, r, err)
		return
	}
	orders, err := s.q.DayOrders(ctx, day)
	if err != nil {
		fail(w, r, err)
		return
	}
	voids, err := s.q.DayVoids(ctx, day)
	if err != nil {
		fail(w, r, err)
		return
	}

	methods := make([]map[string]any, len(pays))
	var cash, cashTips int64
	for i, p := range pays {
		methods[i] = map[string]any{"method": p.Method, "count": p.Count, "amount": p.Amount, "tips": p.Tips}
		if p.Method == "cash" {
			cash, cashTips = p.Amount, p.Tips
		}
	}
	people := make([]map[string]any, len(staff))
	for i, st := range staff {
		people[i] = map[string]any{"name": st.Name, "count": st.Count, "amount": st.Amount, "tips": st.Tips}
	}
	voided := make([]map[string]any, len(voids))
	for i, v := range voids {
		voided[i] = map[string]any{"id": v.ID.String(), "number": v.Number, "total": v.Total, "name": v.CustomerName, "created_at": v.CreatedAt.Time, "voided_by": v.VoidedBy}
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"date": date, "methods": methods, "staff": people, "voids": voided,
		"online": map[string]any{"count": orders.OnlineCount, "cash": orders.OnlineCash},
		"discounts": map[string]any{"count": orders.DiscountCount, "amount": orders.Discounts},
		"open": map[string]any{"count": orders.OpenCount, "total": orders.OpenTotal},
		"vat":  orders.Vat,
		// Till cash plus cash tips plus cash collected for online orders.
		"drawer": cash + cashTips + orders.OnlineCash,
	})
}

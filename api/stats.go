package main

import (
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgtype"

	"github.com/ebnsina/tavora/api/store"
)

func ts(t time.Time) pgtype.Timestamptz { return pgtype.Timestamptz{Time: t, Valid: true} }

// statsRange reads ?from=&to= as inclusive Bangladesh dates; it defaults to the last 7 days.
func statsRange(r *http.Request) (from, to time.Time, ok bool) {
	today := time.Now().In(bdTime)
	today = time.Date(today.Year(), today.Month(), today.Day(), 0, 0, 0, 0, bdTime)
	from, to = today.AddDate(0, 0, -6), today
	var err error
	if v := r.URL.Query().Get("from"); v != "" {
		if from, err = time.ParseInLocation("2006-01-02", v, bdTime); err != nil {
			return from, to, false
		}
	}
	if v := r.URL.Query().Get("to"); v != "" {
		if to, err = time.ParseInLocation("2006-01-02", v, bdTime); err != nil {
			return from, to, false
		}
	}
	return from, to, !to.Before(from) && to.Sub(from) <= 366*24*time.Hour
}

// GET /v1/admin/stats: totals with the same-length previous period for comparison, one row per day, top dishes.
func (s *server) stats(w http.ResponseWriter, r *http.Request) {
	from, to, ok := statsRange(r)
	if !ok {
		fail(w, r, invalid(map[string]string{"from": "from and to are YYYY-MM-DD, from before to, up to a year apart"}))
		return
	}
	ctx := r.Context()
	until := to.AddDate(0, 0, 1)
	span := until.Sub(from)
	cur := store.PeriodTotalsParams{Since: ts(from), Until: ts(until)}

	totals, err := s.q.PeriodTotals(ctx, cur)
	if err != nil {
		fail(w, r, err)
		return
	}
	prev, err := s.q.PeriodTotals(ctx, store.PeriodTotalsParams{Since: ts(from.Add(-span)), Until: ts(from)})
	if err != nil {
		fail(w, r, err)
		return
	}
	rows, err := s.q.DailySales(ctx, store.DailySalesParams{Since: ts(from), Until: ts(until)})
	if err != nil {
		fail(w, r, err)
		return
	}
	top, err := s.q.TopItems(ctx, store.TopItemsParams{Since: ts(from), Until: ts(until)})
	if err != nil {
		fail(w, r, err)
		return
	}
	open, err := s.q.OpenOrderCounts(ctx)
	if err != nil {
		fail(w, r, err)
		return
	}
	upcoming, err := s.q.UpcomingBookings(ctx)
	if err != nil {
		fail(w, r, err)
		return
	}

	// Every day in the range appears, including days with no orders, so charts don't skip dates.
	byDay := map[string]store.DailySalesRow{}
	for _, row := range rows {
		byDay[row.Day.Time.Format("2006-01-02")] = row
	}
	type dayJSON struct {
		Date    string `json:"date"`
		Orders  int64  `json:"orders"`
		Revenue int64  `json:"revenue"`
	}
	days := []dayJSON{}
	for d := from; d.Before(until); d = d.AddDate(0, 0, 1) {
		key := d.Format("2006-01-02")
		days = append(days, dayJSON{key, byDay[key].Orders, byDay[key].Revenue})
	}
	openBy := map[string]int64{}
	for _, o := range open {
		openBy[string(o.Status)] = o.N
	}
	topJSON := make([]map[string]any, len(top))
	for i, t := range top {
		topJSON[i] = map[string]any{"name": t.Name, "qty": t.Qty, "revenue": t.Revenue}
	}
	bookings := make([]map[string]any, len(upcoming))
	for i, b := range upcoming {
		bookings[i] = reservationView(b)
	}
	period := func(p store.PeriodTotalsRow) map[string]any {
		return map[string]any{"orders": p.Orders, "revenue": p.Revenue, "cancelled": p.Cancelled, "delivery": p.Delivery, "pickup": p.Pickup, "dine_in": p.DineIn}
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"from": from.Format("2006-01-02"), "to": to.Format("2006-01-02"),
		"totals": period(totals), "previous": period(prev),
		"days": days, "top_items": topJSON, "open": openBy, "upcoming_bookings": bookings,
	})
}

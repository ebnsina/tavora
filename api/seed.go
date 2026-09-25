package main

import (
	"context"
	"crypto/rand"
	"fmt"
	"os"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/ebnsina/tavora/api/store"
)

func newUUID() pgtype.UUID {
	var u pgtype.UUID
	rand.Read(u.Bytes[:])
	u.Bytes[6] = u.Bytes[6]&0x0f | 0x40
	u.Bytes[8] = u.Bytes[8]&0x3f | 0x80
	u.Valid = true
	return u
}

// seedDemo is the `seed-demo` command: sample orders and table requests so the dashboard isn't empty in development.
// Every name ends in "(demo)" so real data can never be mistaken for it.
func seedDemo(ctx context.Context, pool *pgxpool.Pool, q *store.Queries) error {
	info, err := q.GetRestaurant(ctx)
	if err != nil {
		return err
	}
	menu, err := q.ListMenu(ctx)
	if err != nil {
		return err
	}
	byName := map[string]store.ListMenuRow{}
	for _, m := range menu {
		byName[m.Name] = m
	}
	type line struct {
		name string
		qty  int32
	}
	orders := []struct {
		mode    store.OrderMode
		status  store.OrderStatus
		name    string
		phone   string
		address string
		ago     time.Duration
		lines   []line
	}{
		{"delivery", "new", "Rahim Uddin (demo)", "01712345678", "House 5, Road 3, Uposhohor", 4 * time.Minute, []line{{"Classic beef burger", 2}, {"Masala fries", 1}}},
		{"pickup", "new", "Nusrat Jahan (demo)", "01812345678", "", 9 * time.Minute, []line{{"Fried chicken (2 pcs)", 2}, {"Borhani", 2}}},
		{"delivery", "preparing", "Karim Ahmed (demo)", "01912345678", "Flat 3B, Shaheb Bazar", 25 * time.Minute, []line{{"Mutton kacchi biryani", 3}, {"Firni", 3}}},
		{"delivery", "out_for_delivery", "Tania Akter (demo)", "01612345678", "Laxmipur More, near the mosque", 48 * time.Minute, []line{{"Crispy chicken burger", 1}, {"Loaded cheese fries", 1}}},
		{"pickup", "completed", "Sajid Hasan (demo)", "01512345678", "", 3 * time.Hour, []line{{"Chicken shawarma", 4}}},
	}
	return pgx.BeginFunc(ctx, pool, func(tx pgx.Tx) error {
		tq := q.WithTx(tx)
		for _, o := range orders {
			var sub int64
			for _, l := range o.lines {
				sub += byName[l.name].Price * int64(l.qty)
			}
			fee := int64(0)
			var addr *string
			if o.mode == "delivery" {
				addr = &o.address
				if sub < info.FreeDeliveryOver {
					fee = info.DeliveryFee
				}
			}
			id := newUUID()
			if _, err := tq.InsertOrder(ctx, store.InsertOrderParams{
				ID: id, Mode: o.mode, CustomerName: o.name, Phone: o.phone, Address: addr,
				Subtotal: sub, DeliveryFee: fee, Total: sub + fee,
			}); err != nil {
				return err
			}
			for _, l := range o.lines {
				m, ok := byName[l.name]
				if !ok {
					return fmt.Errorf("menu item %q not found; was the menu edited?", l.name)
				}
				if err := tq.InsertOrderItem(ctx, store.InsertOrderItemParams{OrderID: id, MenuItemID: m.ID, Name: m.Name, UnitPrice: m.Price, Qty: l.qty}); err != nil {
					return err
				}
			}
			if _, err := tx.Exec(ctx, "update orders set status = $2, created_at = now() - $3::interval where id = $1", id, o.status, o.ago.String()); err != nil {
				return err
			}
		}
		today := time.Now().In(bdTime)
		for i, res := range []struct {
			name   string
			guests int16
			days   int
			hour   int
			status string
		}{
			{"Farhana Islam (demo)", 4, 1, 20, "requested"},
			{"Imran Hossain (demo)", 2, 1, 21, "confirmed"},
			{"Mitu Rahman (demo)", 8, 2, 19, "requested"},
		} {
			at := time.Date(today.Year(), today.Month(), today.Day()+res.days, res.hour, 0, 0, 0, bdTime)
			id := newUUID()
			note := "Birthday, please keep a cake plate ready"
			var notePtr *string
			if i == 2 {
				notePtr = &note
			}
			if _, err := tq.InsertReservation(ctx, store.InsertReservationParams{
				ID: id, CustomerName: res.name, Phone: "0171000000" + fmt.Sprint(i), Guests: res.guests,
				StartsAt: pgtype.Timestamptz{Time: at, Valid: true}, Note: notePtr,
			}); err != nil {
				return err
			}
			if _, err := tq.UpdateReservationStatus(ctx, store.UpdateReservationStatusParams{ID: id, Status: res.status}); err != nil {
				return err
			}
		}
		fmt.Fprintln(os.Stderr, "Added 5 demo orders and 3 demo table requests")
		return nil
	})
}

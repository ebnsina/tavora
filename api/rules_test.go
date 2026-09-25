package main

import (
	"testing"

	"github.com/jackc/pgx/v5/pgtype"

	"github.com/ebnsina/tavora/api/store"
)

func hm(h, m int) pgtype.Time {
	return pgtype.Time{Microseconds: int64(h*60+m) * 60_000_000, Valid: true}
}

func TestNormalizePhone(t *testing.T) {
	for in, want := range map[string]string{
		"01712345678":     "01712345678",
		"+8801712345678":  "01712345678",
		"880 1712-345678": "01712345678",
		"01212345678":     "",
		"12345":           "",
	} {
		if got := normalizePhone(in); got != want {
			t.Errorf("normalizePhone(%q) = %q, want %q", in, got, want)
		}
	}
}

func TestPriceOrder(t *testing.T) {
	r := store.Restaurant{DeliveryFee: 6000, FreeDeliveryOver: 150000}
	items := map[int64]store.MenuItem{
		1: {ID: 1, Price: 45000, Available: true},
		2: {ID: 2, Price: 35000, Available: true},
		3: {ID: 3, Price: 9000, Available: false},
	}
	if sub, fee, err := priceOrder([]line{{1, 1}, {2, 2}}, items, true, r); err != nil || sub != 115000 || fee != 6000 {
		t.Fatalf("delivery under threshold: sub=%d fee=%d err=%v", sub, fee, err)
	}
	if _, fee, _ := priceOrder([]line{{1, 4}}, items, true, r); fee != 0 {
		t.Fatalf("free delivery over ৳1,500: fee=%d", fee)
	}
	if _, fee, _ := priceOrder([]line{{1, 1}}, items, false, r); fee != 0 {
		t.Fatalf("pickup has no fee: fee=%d", fee)
	}
	if _, _, err := priceOrder([]line{{3, 1}}, items, false, r); err == nil || err.Code != "item_unavailable" {
		t.Fatalf("sold-out item accepted: %v", err)
	}
	if _, _, err := priceOrder([]line{{9, 1}}, items, false, r); err == nil || err.Code != "item_not_found" {
		t.Fatalf("unknown item accepted: %v", err)
	}
}

func TestHours(t *testing.T) {
	fri := store.OpeningHour{Weekday: 5, Opens: hm(14, 0), Closes: hm(23, 30)}
	for m, want := range map[int]bool{13*60 + 59: false, 14 * 60: true, 23*60 + 29: true, 23*60 + 30: false} {
		if isOpen(fri, m) != want {
			t.Errorf("isOpen(%d) != %v", m, want)
		}
	}
	for m, want := range map[int]bool{14 * 60: true, 22*60 + 30: true, 23 * 60: false, 20*60 + 15: false, 13*60 + 30: false} {
		if slotOK(fri, m) != want {
			t.Errorf("slotOK(%d) != %v", m, want)
		}
	}
	if clock(hm(9, 5)) != "09:05" {
		t.Errorf("clock = %q", clock(hm(9, 5)))
	}
}

package main

import (
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgtype"

	"github.com/ebnsina/tavora/api/store"
)

var phoneRe = regexp.MustCompile(`^(?:\+?880|0)(1[3-9]\d{8})$`)

// normalizePhone returns the 11-digit local form (01XXXXXXXXX), or "" if it is not a Bangladeshi mobile.
func normalizePhone(s string) string {
	m := phoneRe.FindStringSubmatch(strings.NewReplacer(" ", "", "-", "").Replace(strings.TrimSpace(s)))
	if m == nil {
		return ""
	}
	return "0" + m[1]
}

type line struct {
	ID   int64  `json:"id"`
	Qty  int    `json:"qty"`
	Note string `json:"note"` // POS only: an instruction for the cook
}

// priceOrder recomputes every amount from database prices; client-sent totals are never trusted.
func priceOrder(lines []line, items map[int64]store.MenuItem, delivery bool, r store.Restaurant) (sub, fee int64, err *apiError) {
	for _, l := range lines {
		item, ok := items[l.ID]
		if !ok {
			return 0, 0, &apiError{http.StatusUnprocessableEntity, "item_not_found", "a menu item no longer exists", map[string]any{"id": l.ID}}
		}
		if !item.Available {
			return 0, 0, &apiError{http.StatusConflict, "item_unavailable", "a menu item is sold out", map[string]any{"id": l.ID, "name": item.Name}}
		}
		sub += item.Price * int64(l.Qty)
	}
	if delivery && sub < r.FreeDeliveryOver {
		fee = r.DeliveryFee
	}
	return sub, fee, nil
}

// vatOn returns the VAT in `base` and how much it adds to the bill: nothing when prices already include it.
// Half-up rounding to the poisha.
func vatOn(base int64, rate int32, inclusive bool) (vat, add int64) {
	if rate <= 0 || base <= 0 {
		return 0, 0
	}
	r := int64(rate)
	if inclusive {
		return (base*r + (10000+r)/2) / (10000 + r), 0
	}
	vat = (base*r + 5000) / 10000
	return vat, vat
}

func minutes(t pgtype.Time) int { return int(t.Microseconds / 60_000_000) }

func clock(t pgtype.Time) string {
	return time.Time{}.Add(time.Duration(t.Microseconds) * time.Microsecond).Format("15:04")
}

// isOpen reports whether minute-of-day m falls inside today's hours.
func isOpen(h store.OpeningHour, m int) bool { return m >= minutes(h.Opens) && m < minutes(h.Closes) }

// slotOK: bookings start on the hour or half hour, and no later than an hour before closing.
func slotOK(h store.OpeningHour, m int) bool {
	return m%30 == 0 && m >= minutes(h.Opens) && m <= minutes(h.Closes)-60
}

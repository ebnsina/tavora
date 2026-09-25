package main

import (
	"context"
	"crypto/rand"
	"crypto/subtle"
	"errors"
	"fmt"
	"log/slog"
	"math/big"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/ebnsina/tavora/api/store"
)

// Sign-in for the customer phone app: a 6-digit code by text message, no passwords.
const (
	codeTTL          = 5 * time.Minute
	maxCodeTries     = 5
	maxSendsPerPhone = 3
	// ponytail: one global cap on texts per 15 minutes to bound SMS cost; per-IP limits if it gets abused.
	maxSendsTotal = 60
)

type smsSender func(ctx context.Context, phone, text string) error

// newSMS picks how sign-in codes are sent. "log" prints them to the server log, for local use only.
func newSMS(provider string) (smsSender, error) {
	switch provider {
	case "log":
		return func(_ context.Context, phone, text string) error {
			slog.Info("sms not sent (SMS_PROVIDER=log)", "phone", phone, "text", text)
			return nil
		}, nil
	}
	return nil, fmt.Errorf("unknown SMS_PROVIDER %q (supported: log)", provider)
}

func hashCode(phone, code string) []byte { return hashToken(phone + ":" + code) }

func newCode() string {
	n, _ := rand.Int(rand.Reader, big.NewInt(1_000_000))
	return fmt.Sprintf("%06d", n.Int64())
}

var errPhone = invalid(map[string]string{"phone": "must be a Bangladeshi mobile number"})

func (s *server) sendCode(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Phone string `json:"phone"`
	}
	if err := decode(w, r, &req); err != nil {
		fail(w, r, err)
		return
	}
	phone := normalizePhone(req.Phone)
	if phone == "" {
		fail(w, r, errPhone)
		return
	}
	if s.logins.count("sms:"+phone) >= maxSendsPerPhone || s.logins.count("sms") >= maxSendsTotal {
		fail(w, r, &apiError{http.StatusTooManyRequests, "too_many_attempts", "too many codes sent, try again in 15 minutes", nil})
		return
	}
	code := newCode()
	if err := s.q.UpsertOtp(r.Context(), store.UpsertOtpParams{
		Phone: phone, CodeHash: hashCode(phone, code), ExpiresAt: pgtype.Timestamptz{Time: time.Now().Add(codeTTL), Valid: true},
	}); err != nil {
		fail(w, r, err)
		return
	}
	s.logins.fail("sms:" + phone)
	s.logins.fail("sms")
	if err := s.sms(r.Context(), phone, fmt.Sprintf("Your Tavora code is %s. It works for 5 minutes.", code)); err != nil {
		fail(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *server) verifyCode(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Phone string `json:"phone"`
		Code  string `json:"code"`
	}
	if err := decode(w, r, &req); err != nil {
		fail(w, r, err)
		return
	}
	phone := normalizePhone(req.Phone)
	if phone == "" {
		fail(w, r, errPhone)
		return
	}
	ctx := r.Context()
	otp, err := s.q.GetOtp(ctx, phone)
	if errors.Is(err, pgx.ErrNoRows) || (err == nil && time.Now().After(otp.ExpiresAt.Time)) {
		fail(w, r, &apiError{http.StatusUnauthorized, "code_expired", "no live code for this phone, ask for a new one", nil})
		return
	}
	if err != nil {
		fail(w, r, err)
		return
	}
	if otp.Attempts >= maxCodeTries {
		fail(w, r, &apiError{http.StatusTooManyRequests, "too_many_attempts", "too many wrong codes, ask for a new one", nil})
		return
	}
	if subtle.ConstantTimeCompare(otp.CodeHash, hashCode(phone, req.Code)) != 1 {
		if err := s.q.BumpOtpAttempts(ctx, phone); err != nil {
			fail(w, r, err)
			return
		}
		fail(w, r, &apiError{http.StatusUnauthorized, "code_wrong", "that code doesn't match", nil})
		return
	}

	var c store.Customer
	token, expires := newToken(), time.Now().Add(sessionTTL)
	err = pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		q := s.q.WithTx(tx)
		if err := q.DeleteOtp(ctx, phone); err != nil {
			return err
		}
		if c, err = q.UpsertCustomer(ctx, phone); err != nil {
			return err
		}
		return q.CreateCustomerSession(ctx, store.CreateCustomerSessionParams{
			TokenHash: hashToken(token), CustomerID: c.ID, ExpiresAt: pgtype.Timestamptz{Time: expires, Valid: true},
		})
	})
	if err != nil {
		fail(w, r, err)
		return
	}
	s.q.DeleteExpiredCustomerSessions(ctx)
	writeJSON(w, http.StatusOK, map[string]any{"token": token, "expires_at": expires, "customer": customerView(c)})
}

func customerView(c store.Customer) map[string]any {
	return map[string]any{"id": c.ID, "phone": c.Phone, "name": c.Name, "address": c.Address}
}

// customer returns the signed-in customer, or ok=false for guests and expired tokens.
func (s *server) customer(r *http.Request) (store.Customer, bool, error) {
	token := bearer(r)
	if token == "" {
		return store.Customer{}, false, nil
	}
	c, err := s.q.GetSessionCustomer(r.Context(), hashToken(token))
	if errors.Is(err, pgx.ErrNoRows) {
		return c, false, nil
	}
	return c, err == nil, err
}

// GET /v1/me: the customer and their last 20 orders.
func (s *server) customerMe(w http.ResponseWriter, r *http.Request) {
	c, ok, err := s.customer(r)
	if err != nil {
		fail(w, r, err)
		return
	}
	if !ok {
		fail(w, r, errUnauthorized)
		return
	}
	orders, err := s.q.ListCustomerOrders(r.Context(), &c.ID)
	if err != nil {
		fail(w, r, err)
		return
	}
	out := make([]map[string]any, len(orders))
	for i, o := range orders {
		// ponytail: one items query per order (20 max); join them if this list grows.
		rows, err := s.q.ListOrderItems(r.Context(), o.ID)
		if err != nil {
			fail(w, r, err)
			return
		}
		out[i] = orderView(o, rows)
	}
	writeJSON(w, http.StatusOK, map[string]any{"customer": customerView(c), "orders": out})
}

func (s *server) customerLogout(w http.ResponseWriter, r *http.Request) {
	if err := s.q.DeleteCustomerSession(r.Context(), hashToken(bearer(r))); err != nil {
		fail(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

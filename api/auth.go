package main

import (
	"bufio"
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/term"

	"github.com/ebnsina/tavora/api/store"
)

const sessionTTL = 30 * 24 * time.Hour

type adminKey struct{}

var errUnauthorized = &apiError{http.StatusUnauthorized, "unauthorized", "sign in required", nil}

func hashToken(t string) []byte {
	h := sha256.Sum256([]byte(t))
	return h[:]
}

// Compared against when the email is unknown, so response time doesn't reveal which emails exist.
var dummyHash, _ = bcrypt.GenerateFromPassword([]byte("not-a-real-password"), bcrypt.DefaultCost)

// ponytail: in-memory per-email lockout, resets on restart and isn't shared; move to Postgres if the API runs as several instances.
type throttle struct {
	mu    sync.Mutex
	fails map[string][]time.Time
}

const maxFails, failWindow = 5, 15 * time.Minute

func (t *throttle) count(key string) int {
	t.mu.Lock()
	defer t.mu.Unlock()
	recent := t.fails[key][:0]
	for _, at := range t.fails[key] {
		if time.Since(at) < failWindow {
			recent = append(recent, at)
		}
	}
	t.fails[key] = recent
	return len(recent)
}

func (t *throttle) blocked(key string) bool { return t.count(key) >= maxFails }

func (t *throttle) fail(key string) {
	t.mu.Lock()
	defer t.mu.Unlock()
	t.fails[key] = append(t.fails[key], time.Now())
}

func (s *server) login(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := decode(w, r, &req); err != nil {
		fail(w, r, err)
		return
	}
	email := strings.ToLower(strings.TrimSpace(req.Email))
	if s.logins.blocked(email) {
		fail(w, r, &apiError{http.StatusTooManyRequests, "too_many_attempts", "too many failed sign-ins, try again in 15 minutes", nil})
		return
	}
	a, err := s.q.GetAdminByEmail(r.Context(), &email)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		fail(w, r, err)
		return
	}
	hash := dummyHash
	if err == nil {
		hash = []byte(a.PasswordHash)
	}
	if bcrypt.CompareHashAndPassword(hash, []byte(req.Password)) != nil || err != nil {
		s.logins.fail(email)
		fail(w, r, &apiError{http.StatusUnauthorized, "invalid_credentials", "email or password is wrong", nil})
		return
	}

	s.startSession(w, r, a.ID, a.Email, a.Name, a.Role)
}

func (s *server) startSession(w http.ResponseWriter, r *http.Request, id int64, email *string, name, role string) {
	raw := make([]byte, 32)
	rand.Read(raw)
	token := base64.RawURLEncoding.EncodeToString(raw)
	expires := time.Now().Add(sessionTTL)
	if err := s.q.CreateSession(r.Context(), store.CreateSessionParams{
		TokenHash: hashToken(token), AdminID: id, ExpiresAt: pgtype.Timestamptz{Time: expires, Valid: true},
	}); err != nil {
		fail(w, r, err)
		return
	}
	s.q.DeleteExpiredSessions(r.Context())
	writeJSON(w, http.StatusOK, map[string]any{
		"token": token, "expires_at": expires,
		"admin": map[string]any{"id": id, "email": email, "name": name, "role": role},
	})
}

// ponytail: one shared counter for all PIN attempts (the API sees the web server, not the tablet);
// 20 misses per 15 minutes against 6-digit PINs. Tie PINs to signed-in devices if this is ever abused.
const pinKey, maxPinFails = "pin", 20

var errPinFormat = invalid(map[string]string{"pin": "6 digits"})

func validPin(pin string) bool {
	if len(pin) != 6 {
		return false
	}
	for _, c := range pin {
		if c < '0' || c > '9' {
			return false
		}
	}
	return true
}

// staffWithPin finds the staff member whose PIN this is; bcrypt means checking each one.
func (s *server) staffWithPin(ctx context.Context, pin string, skip int64) (*store.ListStaffRow, error) {
	staff, err := s.q.ListStaff(ctx)
	if err != nil {
		return nil, err
	}
	for i, st := range staff {
		if st.ID != skip && bcrypt.CompareHashAndPassword([]byte(st.PasswordHash), []byte(pin)) == nil {
			return &staff[i], nil
		}
	}
	return nil, nil
}

func (s *server) pinLogin(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Pin string `json:"pin"`
	}
	if err := decode(w, r, &req); err != nil {
		fail(w, r, err)
		return
	}
	if !validPin(req.Pin) {
		fail(w, r, errPinFormat)
		return
	}
	if s.logins.count(pinKey) >= maxPinFails {
		fail(w, r, &apiError{http.StatusTooManyRequests, "too_many_attempts", "too many wrong PINs, try again in 15 minutes", nil})
		return
	}
	st, err := s.staffWithPin(r.Context(), req.Pin, 0)
	if err != nil {
		fail(w, r, err)
		return
	}
	if st == nil {
		s.logins.fail(pinKey)
		fail(w, r, &apiError{http.StatusUnauthorized, "wrong_pin", "that PIN doesn't match anyone", nil})
		return
	}
	s.startSession(w, r, st.ID, nil, st.Name, "staff")
}

func bearer(r *http.Request) string {
	return strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer ")
}

func (s *server) logout(w http.ResponseWriter, r *http.Request) {
	if err := s.q.DeleteSession(r.Context(), hashToken(bearer(r))); err != nil {
		fail(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *server) me(w http.ResponseWriter, r *http.Request) {
	a := r.Context().Value(adminKey{}).(store.GetSessionAdminRow)
	writeJSON(w, http.StatusOK, map[string]any{"id": a.ID, "email": a.Email, "name": a.Name, "role": a.Role})
}

func actor(r *http.Request) store.GetSessionAdminRow {
	return r.Context().Value(adminKey{}).(store.GetSessionAdminRow)
}

var errOwnerOnly = &apiError{http.StatusForbidden, "owner_only", "only the owner can do this", nil}

// requireOwner is requireAdmin plus: staff accounts are turned away.
func (s *server) requireOwner(next http.HandlerFunc) http.HandlerFunc {
	return s.requireAdmin(func(w http.ResponseWriter, r *http.Request) {
		if actor(r).Role != "owner" {
			fail(w, r, errOwnerOnly)
			return
		}
		next(w, r)
	})
}

// ---- Staff (owner only)

func (s *server) listStaff(w http.ResponseWriter, r *http.Request) {
	rows, err := s.q.ListStaff(r.Context())
	if err != nil {
		fail(w, r, err)
		return
	}
	out := make([]map[string]any, len(rows))
	for i, st := range rows {
		out[i] = map[string]any{"id": st.ID, "name": st.Name, "created_at": st.CreatedAt.Time}
	}
	writeJSON(w, http.StatusOK, out)
}

type staffReq struct {
	Name string `json:"name"`
	Pin  string `json:"pin"`
}

// saveStaff creates (id 0) or updates a staff member; an empty PIN on update keeps the old one.
func (s *server) saveStaff(w http.ResponseWriter, r *http.Request, id int64) {
	var req staffReq
	if err := decode(w, r, &req); err != nil {
		fail(w, r, err)
		return
	}
	name, ok := text(req.Name, 40)
	bad := map[string]string{}
	if !ok {
		bad["name"] = "required, up to 40 characters"
	}
	if (id == 0 || req.Pin != "") && !validPin(req.Pin) {
		bad["pin"] = "6 digits"
	}
	if len(bad) > 0 {
		fail(w, r, invalid(bad))
		return
	}
	var hash *string
	if req.Pin != "" {
		// PINs identify the person at sign-in, so two people can't share one.
		taken, err := s.staffWithPin(r.Context(), req.Pin, id)
		if err != nil {
			fail(w, r, err)
			return
		}
		if taken != nil {
			fail(w, r, invalid(map[string]string{"pin": "already used by someone else"}))
			return
		}
		h, err := bcrypt.GenerateFromPassword([]byte(req.Pin), bcrypt.DefaultCost)
		if err != nil {
			fail(w, r, err)
			return
		}
		hs := string(h)
		hash = &hs
	}
	if id == 0 {
		newID, err := s.q.CreateStaff(r.Context(), store.CreateStaffParams{Name: name, PasswordHash: *hash})
		if err != nil {
			fail(w, r, err)
			return
		}
		writeJSON(w, http.StatusCreated, map[string]any{"id": newID, "name": name})
		return
	}
	n, err := s.q.UpdateStaff(r.Context(), store.UpdateStaffParams{ID: id, Name: name, PinHash: hash})
	switch {
	case err != nil:
		fail(w, r, err)
	case n == 0:
		fail(w, r, notFoundErr("staff member"))
	default:
		w.WriteHeader(http.StatusNoContent)
	}
}

func (s *server) createStaff(w http.ResponseWriter, r *http.Request) { s.saveStaff(w, r, 0) }

func (s *server) updateStaff(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || id <= 0 {
		fail(w, r, notFoundErr("staff member"))
		return
	}
	s.saveStaff(w, r, id)
}

// Removing someone signs them out everywhere (sessions cascade); their past sales keep a blank name.
func (s *server) deleteStaff(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		fail(w, r, notFoundErr("staff member"))
		return
	}
	n, err := s.q.DeleteStaff(r.Context(), id)
	switch {
	case err != nil:
		fail(w, r, err)
	case n == 0:
		fail(w, r, notFoundErr("staff member"))
	default:
		w.WriteHeader(http.StatusNoContent)
	}
}

// requireAdmin lets a request through only with a live session token.
func (s *server) requireAdmin(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		token := bearer(r)
		if token == "" {
			fail(w, r, errUnauthorized)
			return
		}
		a, err := s.q.GetSessionAdmin(r.Context(), hashToken(token))
		if errors.Is(err, pgx.ErrNoRows) {
			fail(w, r, errUnauthorized)
			return
		}
		if err != nil {
			fail(w, r, err)
			return
		}
		next(w, r.WithContext(context.WithValue(r.Context(), adminKey{}, a)))
	}
}

// createAdmin is the `create-admin <email> <name>` command; the password is typed, never passed as an argument.
func createAdmin(ctx context.Context, q *store.Queries, args []string) error {
	if len(args) != 2 {
		return errors.New("usage: tavora-api create-admin <email> <name>")
	}
	email, name := strings.ToLower(strings.TrimSpace(args[0])), strings.TrimSpace(args[1])
	if !strings.Contains(email, "@") || name == "" {
		return errors.New("a valid email and a name are required")
	}
	pw, again, err := readPasswordTwice()
	if err != nil {
		return err
	}
	if len(pw) < 10 || string(pw) != string(again) {
		return errors.New("passwords must match and be at least 10 characters")
	}
	hash, err := bcrypt.GenerateFromPassword(pw, 12)
	if err != nil {
		return err
	}
	id, err := q.CreateAdmin(ctx, store.CreateAdminParams{Email: &email, Name: name, PasswordHash: string(hash)})
	if err != nil {
		return err
	}
	fmt.Fprintf(os.Stderr, "Created admin #%d (%s)\n", id, email)
	return nil
}

// readPasswordTwice prompts without echo on a terminal, or reads two lines when input is piped (scripted setup).
func readPasswordTwice() ([]byte, []byte, error) {
	fd := int(os.Stdin.Fd())
	if !term.IsTerminal(fd) {
		sc := bufio.NewScanner(os.Stdin)
		var lines [][]byte
		for len(lines) < 2 && sc.Scan() {
			lines = append(lines, []byte(sc.Text()))
		}
		if len(lines) < 2 {
			return nil, nil, errors.New("pipe the password twice, one per line")
		}
		return lines[0], lines[1], nil
	}
	fmt.Fprint(os.Stderr, "Password (10+ characters): ")
	pw, err := term.ReadPassword(fd)
	fmt.Fprintln(os.Stderr)
	if err != nil {
		return nil, nil, err
	}
	fmt.Fprint(os.Stderr, "Repeat password: ")
	again, err := term.ReadPassword(fd)
	fmt.Fprintln(os.Stderr)
	return pw, again, err
}

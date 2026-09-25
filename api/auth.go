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

func (t *throttle) blocked(key string) bool {
	t.mu.Lock()
	defer t.mu.Unlock()
	recent := t.fails[key][:0]
	for _, at := range t.fails[key] {
		if time.Since(at) < failWindow {
			recent = append(recent, at)
		}
	}
	t.fails[key] = recent
	return len(recent) >= maxFails
}

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
	a, err := s.q.GetAdminByEmail(r.Context(), email)
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

	raw := make([]byte, 32)
	rand.Read(raw)
	token := base64.RawURLEncoding.EncodeToString(raw)
	expires := time.Now().Add(sessionTTL)
	if err := s.q.CreateSession(r.Context(), store.CreateSessionParams{
		TokenHash: hashToken(token), AdminID: a.ID, ExpiresAt: pgtype.Timestamptz{Time: expires, Valid: true},
	}); err != nil {
		fail(w, r, err)
		return
	}
	s.q.DeleteExpiredSessions(r.Context())
	writeJSON(w, http.StatusOK, map[string]any{
		"token": token, "expires_at": expires,
		"admin": map[string]any{"id": a.ID, "email": a.Email, "name": a.Name},
	})
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
	writeJSON(w, http.StatusOK, map[string]any{"id": a.ID, "email": a.Email, "name": a.Name})
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
	id, err := q.CreateAdmin(ctx, store.CreateAdminParams{Email: email, Name: name, PasswordHash: string(hash)})
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

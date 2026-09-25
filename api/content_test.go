package main

import (
	"encoding/json"
	"os"
	"regexp"
	"testing"
	"time"
)

// The seed in the migration must itself pass validation, or the dashboard could never re-save it.
func TestSeedContentIsValid(t *testing.T) {
	sql, err := os.ReadFile("db/migrations/00003_cms.sql")
	if err != nil {
		t.Fatal(err)
	}
	m := regexp.MustCompile(`(?s)\$json\$(.*)\$json\$`).FindSubmatch(sql)
	var c SiteContent
	if err := json.Unmarshal(m[1], &c); err != nil {
		t.Fatal(err)
	}
	if bad := c.validate(); len(bad) > 0 {
		t.Fatalf("seed content invalid: %v", bad)
	}

	c.Slogans = []string{"only one"}
	c.Ticker[0].Icon = "spaceship"
	c.SEO.URL = "javascript:alert(1)"
	c.Hero.Tagline = "  "
	bad := c.validate()
	for _, k := range []string{"slogans", "ticker.0.icon", "seo.url", "hero.tagline"} {
		if bad[k] == "" {
			t.Errorf("expected %s to be rejected, got %v", k, bad)
		}
	}
}

func TestThrottle(t *testing.T) {
	th := &throttle{fails: map[string][]time.Time{}}
	for range maxFails {
		if th.blocked("a@x.com") {
			t.Fatal("blocked too early")
		}
		th.fail("a@x.com")
	}
	if !th.blocked("a@x.com") || th.blocked("b@x.com") {
		t.Fatal("lockout should apply per email only")
	}
}

func TestSlugify(t *testing.T) {
	for in, want := range map[string]string{"Biryani & Rice": "biryani-rice", "  Fast food!! ": "fast-food", "কাচ্চি": ""} {
		if got := slugify(in); got != want {
			t.Errorf("slugify(%q) = %q, want %q", in, got, want)
		}
	}
}

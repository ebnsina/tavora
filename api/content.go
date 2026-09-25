package main

import (
	"fmt"
	"net/url"
	"strings"
	"unicode/utf8"
)

// SiteContent is every piece of marketing copy on the website. The web app renders it as-is.
type SiteContent struct {
	SEO struct {
		URL   string `json:"url"`
		Image string `json:"image"`
	} `json:"seo"`
	Hero struct {
		Tagline     string `json:"tagline"`
		Description string `json:"description"`
	} `json:"hero"`
	Marquee string   `json:"marquee"`
	Slogans []string `json:"slogans"`
	Story   struct {
		Title      string   `json:"title"`
		Paragraphs []string `json:"paragraphs"`
		Image      string   `json:"image"`
		Stickers   []string `json:"stickers"`
	} `json:"story"`
	Menu    titled `json:"menu"`
	Booking titled `json:"booking"`
	Tawa    string `json:"tawa"`
	Reviews struct {
		Title string `json:"title"`
		Items []struct {
			Text string `json:"text"`
			By   string `json:"by"`
		} `json:"items"`
	} `json:"reviews"`
	Ticker []struct {
		Label string `json:"label"`
		Icon  string `json:"icon"`
	} `json:"ticker"`
	Call struct {
		Kicker  string   `json:"kicker"`
		Title   string   `json:"title"`
		Slogan  []string `json:"slogan"`
		SignTop string   `json:"sign_top"`
		SignBig string   `json:"sign_big"`
	} `json:"call"`
	Social struct {
		Facebook  string `json:"facebook"`
		Instagram string `json:"instagram"`
	} `json:"social"`
}

type titled struct {
	Title    string `json:"title"`
	Subtitle string `json:"subtitle"`
}

// Icons the web app knows how to draw for ticker items.
var tickerIcons = map[string]bool{
	"burger": true, "rice": true, "soup": true, "chicken": true, "sandwich": true, "fries": true,
	"drink": true, "pizza": true, "noodles": true, "coffee": true, "cake": true, "icecream": true,
}

// validate trims every field in place and returns field path → problem for anything unusable.
func (c *SiteContent) validate() map[string]string {
	bad := map[string]string{}
	str := func(path string, s *string, max int, optional bool) {
		*s = strings.TrimSpace(*s)
		switch n := utf8.RuneCountInString(*s); {
		case n == 0 && !optional:
			bad[path] = "required"
		case n > max:
			bad[path] = fmt.Sprintf("up to %d characters", max)
		}
	}
	list := func(path string, xs []string, min, max, each int) {
		switch {
		case min == max && len(xs) != min:
			bad[path] = fmt.Sprintf("exactly %d entries", min)
		case len(xs) < min || len(xs) > max:
			bad[path] = fmt.Sprintf("between %d and %d entries", min, max)
		}
		for i := range xs {
			str(fmt.Sprintf("%s.%d", path, i), &xs[i], each, false)
		}
	}
	link := func(path string, s *string, optional bool) {
		str(path, s, 300, optional)
		if *s == "" {
			return
		}
		if strings.HasPrefix(*s, "/") && !strings.HasPrefix(*s, "//") {
			return
		}
		if u, err := url.Parse(*s); err != nil || (u.Scheme != "https" && u.Scheme != "http") || u.Host == "" {
			bad[path] = "must be a full https:// link or a /path"
		}
	}

	link("seo.url", &c.SEO.URL, false)
	link("seo.image", &c.SEO.Image, false)
	str("hero.tagline", &c.Hero.Tagline, 60, false)
	str("hero.description", &c.Hero.Description, 300, false)
	str("marquee", &c.Marquee, 120, false)
	list("slogans", c.Slogans, 2, 2, 40)
	str("story.title", &c.Story.Title, 60, false)
	list("story.paragraphs", c.Story.Paragraphs, 1, 4, 400)
	link("story.image", &c.Story.Image, false)
	list("story.stickers", c.Story.Stickers, 3, 3, 16)
	str("menu.title", &c.Menu.Title, 40, false)
	str("menu.subtitle", &c.Menu.Subtitle, 120, false)
	str("booking.title", &c.Booking.Title, 40, false)
	str("booking.subtitle", &c.Booking.Subtitle, 120, false)
	str("tawa", &c.Tawa, 40, false)
	str("reviews.title", &c.Reviews.Title, 40, false)
	if len(c.Reviews.Items) > 12 {
		bad["reviews.items"] = "up to 12 reviews"
	}
	for i := range c.Reviews.Items {
		str(fmt.Sprintf("reviews.items.%d.text", i), &c.Reviews.Items[i].Text, 200, false)
		str(fmt.Sprintf("reviews.items.%d.by", i), &c.Reviews.Items[i].By, 40, false)
	}
	if len(c.Ticker) < 3 || len(c.Ticker) > 12 {
		bad["ticker"] = "between 3 and 12 entries"
	}
	for i := range c.Ticker {
		str(fmt.Sprintf("ticker.%d.label", i), &c.Ticker[i].Label, 24, false)
		if !tickerIcons[c.Ticker[i].Icon] {
			bad[fmt.Sprintf("ticker.%d.icon", i)] = "unknown icon"
		}
	}
	str("call.kicker", &c.Call.Kicker, 40, false)
	str("call.title", &c.Call.Title, 40, false)
	list("call.slogan", c.Call.Slogan, 3, 3, 10)
	str("call.sign_top", &c.Call.SignTop, 20, false)
	str("call.sign_big", &c.Call.SignBig, 12, false)
	link("social.facebook", &c.Social.Facebook, true)
	link("social.instagram", &c.Social.Instagram, true)
	return bad
}

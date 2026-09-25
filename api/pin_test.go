package main

import "testing"

func TestValidPin(t *testing.T) {
	for pin, want := range map[string]bool{"123456": true, "000000": true, "12345": false, "1234567": false, "12a456": false, "١٢٣٤٥٦": false, "": false} {
		if validPin(pin) != want {
			t.Errorf("validPin(%q) = %v, want %v", pin, !want, want)
		}
	}
}

func TestVatOn(t *testing.T) {
	cases := []struct {
		base      int64
		rate      int32
		inclusive bool
		vat, add  int64
	}{
		{100000, 500, false, 5000, 5000}, // ৳1,000 + 5% = ৳50 on top
		{105000, 500, true, 5000, 0},     // ৳1,050 incl. 5% holds ৳50
		{35000, 1500, false, 5250, 5250},
		{33333, 750, false, 2500, 2500}, // 2499.975 rounds up
		{100000, 0, false, 0, 0},
		{0, 500, false, 0, 0},
	}
	for _, c := range cases {
		if vat, add := vatOn(c.base, c.rate, c.inclusive); vat != c.vat || add != c.add {
			t.Errorf("vatOn(%d, %d, %v) = %d, %d; want %d, %d", c.base, c.rate, c.inclusive, vat, add, c.vat, c.add)
		}
	}
}

func TestContrast(t *testing.T) {
	if c := contrast("#000000", "#ffffff"); c < 20.9 || c > 21.1 {
		t.Errorf("black/white = %.2f, want 21", c)
	}
	if contrast("#d5161a", "#fff9e7") < 4.5 {
		t.Error("the default red must pass on cream")
	}
	if contrast("#f4b400", "#fff9e7") >= 4.5 {
		t.Error("mustard is too light for cream text and must fail")
	}
}

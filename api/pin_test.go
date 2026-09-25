package main

import "testing"

func TestValidPin(t *testing.T) {
	for pin, want := range map[string]bool{"123456": true, "000000": true, "12345": false, "1234567": false, "12a456": false, "١٢٣٤٥٦": false, "": false} {
		if validPin(pin) != want {
			t.Errorf("validPin(%q) = %v, want %v", pin, !want, want)
		}
	}
}

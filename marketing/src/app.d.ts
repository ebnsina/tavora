declare global {
	namespace App {
		interface Locals {
			// API session token of the signed-in admin, read from the cookie.
			token?: string;
		}
	}
}

export {};

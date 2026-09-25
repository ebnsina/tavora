import { api, type Restaurant } from '$lib/api';

const fallback = '#d5161a';

// The brand colour for every page. If the API is down the error page still renders, in the default red.
export async function load({ fetch }) {
	try {
		const r = await api<Restaurant>('/v1/restaurant', undefined, fetch);
		return { theme: /^#[0-9a-f]{6}$/.test(r.theme) ? r.theme : fallback };
	} catch {
		return { theme: fallback };
	}
}

import { error } from '@sveltejs/kit';
import { api, type Category, type Restaurant, type SiteContent } from '$lib/api';

export async function load({ fetch }) {
	try {
		const [restaurant, menu, site] = await Promise.all([
			api<Restaurant>('/v1/restaurant', undefined, fetch),
			api<Category[]>('/v1/menu', undefined, fetch),
			api<SiteContent>('/v1/site', undefined, fetch)
		]);
		return { restaurant, menu, site };
	} catch (e) {
		console.error('api unavailable', e);
		error(503, "We're having trouble loading the menu. Please try again in a minute.");
	}
}

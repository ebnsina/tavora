import { error } from '@sveltejs/kit';
import { api, type Category, type Restaurant } from '$lib/api';

export async function load({ fetch }) {
	try {
		const [restaurant, menu] = await Promise.all([
			api<Restaurant>('/v1/restaurant', undefined, fetch),
			api<Category[]>('/v1/menu', undefined, fetch)
		]);
		return { restaurant, menu };
	} catch (e) {
		console.error('api unavailable', e);
		error(503, "We're having trouble loading the menu. Please try again in a minute.");
	}
}

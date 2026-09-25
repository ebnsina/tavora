import { redirect } from '@sveltejs/kit';
import { api, type Category } from '$lib/api';
import { adminApi } from '$lib/server/admin';

// The POS breaks out of the dashboard layout, so it repeats the sign-in check here.
export async function load(event) {
	if (!event.locals.token) redirect(303, '/admin/login');
	const [admin, menu] = await Promise.all([
		adminApi<{ name: string }>(event, '/v1/admin/me'),
		api<Category[]>('/v1/menu', undefined, event.fetch)
	]);
	return { admin, menu };
}

import { redirect } from '@sveltejs/kit';
import { adminApi } from '$lib/server/admin';

export async function load(event) {
	if (event.url.pathname === '/admin/login') return { admin: null };
	if (!event.locals.token) redirect(303, '/admin/login');
	return {
		admin: await adminApi<{ id: number; email: string; name: string }>(event, '/v1/admin/me')
	};
}

import { redirect } from '@sveltejs/kit';
import { ADMIN_COOKIE, adminApi } from '$lib/server/admin';

export const load = () => redirect(303, '/admin');

export const actions = {
	default: async (event) => {
		await adminApi(event, '/v1/admin/logout', { method: 'POST' }).catch(() => {});
		event.cookies.delete(ADMIN_COOKIE, { path: '/admin' });
		redirect(303, '/admin/login');
	}
};

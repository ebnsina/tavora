import { redirect } from '@sveltejs/kit';
import { adminApi } from '$lib/server/admin';

export type Me = { id: number; email: string | null; name: string; role: 'owner' | 'staff' };

// Staff see the till, orders and bookings; the API refuses everything else anyway.
const staffPages = [
	'/admin/pos',
	'/admin/orders',
	'/admin/bookings',
	'/admin/alerts',
	'/admin/logout'
];

export async function load(event) {
	if (event.url.pathname === '/admin/login') return { admin: null };
	if (!event.locals.token) redirect(303, '/admin/login');
	const admin = await adminApi<Me>(event, '/v1/admin/me');
	if (admin.role === 'staff' && !staffPages.some((p) => event.url.pathname.startsWith(p))) {
		redirect(303, '/admin/pos');
	}
	return { admin };
}

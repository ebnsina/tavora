import { fail, redirect, type Cookies } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { api, ApiError, message } from '$lib/api';
import { ADMIN_COOKIE } from '$lib/server/admin';

export function load({ locals }) {
	if (locals.token) redirect(303, '/admin');
}

type Session = { token: string; expires_at: string };

function keep(cookies: Cookies, res: Session) {
	cookies.set(ADMIN_COOKIE, res.token, {
		path: '/admin',
		httpOnly: true,
		sameSite: 'strict',
		secure: !dev,
		expires: new Date(res.expires_at)
	});
}

export const actions = {
	owner: async ({ request, cookies, fetch }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '');
		try {
			const body = JSON.stringify({ email, password: String(form.get('password') ?? '') });
			keep(cookies, await api<Session>('/v1/admin/login', { method: 'POST', body }, fetch));
		} catch (e) {
			if (e instanceof ApiError) return fail(400, { mode: 'owner', email, error: message(e) });
			throw e;
		}
		redirect(303, '/admin');
	},
	// Staff go straight to the till.
	pin: async ({ request, cookies, fetch }) => {
		const form = await request.formData();
		try {
			const body = JSON.stringify({ pin: String(form.get('pin') ?? '') });
			keep(cookies, await api<Session>('/v1/admin/pin', { method: 'POST', body }, fetch));
		} catch (e) {
			if (e instanceof ApiError) return fail(400, { mode: 'pin', email: '', error: message(e) });
			throw e;
		}
		redirect(303, '/admin/pos');
	}
};

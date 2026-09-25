import { fail, redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { api, ApiError, message } from '$lib/api';
import { ADMIN_COOKIE } from '$lib/server/admin';

export function load({ locals }) {
	if (locals.token) redirect(303, '/admin');
}

export const actions = {
	default: async ({ request, cookies, fetch }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '');
		try {
			const res = await api<{ token: string; expires_at: string }>(
				'/v1/admin/login',
				{
					method: 'POST',
					body: JSON.stringify({ email, password: String(form.get('password') ?? '') })
				},
				fetch
			);
			cookies.set(ADMIN_COOKIE, res.token, {
				path: '/admin',
				httpOnly: true,
				sameSite: 'strict',
				secure: !dev,
				expires: new Date(res.expires_at)
			});
		} catch (e) {
			if (e instanceof ApiError) return fail(400, { email, error: message(e) });
			throw e;
		}
		redirect(303, '/admin');
	}
};

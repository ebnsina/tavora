import { fail, isRedirect, redirect, type RequestEvent } from '@sveltejs/kit';
import { api, ApiError, message } from '$lib/api';

export const ADMIN_COOKIE = 'tavora_admin';

// Calls the API as the signed-in admin; an expired session sends them back to sign in.
export async function adminApi<T>(
	event: RequestEvent,
	path: string,
	init?: RequestInit
): Promise<T> {
	try {
		return await api<T>(path, { ...init, token: event.locals.token }, event.fetch);
	} catch (e) {
		if (e instanceof ApiError && e.code === 'unauthorized') {
			event.cookies.delete(ADMIN_COOKIE, { path: '/admin' });
			redirect(303, '/admin/login');
		}
		throw e;
	}
}

// Runs a form action's API work and turns API errors into a message the form can show.
export async function act(work: () => Promise<unknown>, done = 'Saved') {
	try {
		await work();
		return { ok: done };
	} catch (e) {
		if (isRedirect(e)) throw e;
		if (e instanceof ApiError) {
			return fail(e.code === 'validation_failed' ? 422 : 400, {
				error: message(e),
				fields: e.details as Record<string, string>
			});
		}
		throw e;
	}
}

export const json = (body: unknown) => JSON.stringify(body);

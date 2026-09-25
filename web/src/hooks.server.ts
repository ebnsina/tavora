import { env } from '$env/dynamic/public';
import { ADMIN_COOKIE } from '$lib/server/admin';

// Fail at boot, not on the first visitor, when the API address is missing.
export const init = () => {
	if (!env.PUBLIC_API_URL) throw new Error('missing required env var PUBLIC_API_URL');
};

export async function handle({ event, resolve }) {
	event.locals.token = event.cookies.get(ADMIN_COOKIE);
	return resolve(event);
}

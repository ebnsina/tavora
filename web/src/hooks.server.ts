import { env } from '$env/dynamic/public';
import { ADMIN_COOKIE } from '$lib/server/admin';

// Fail at boot, not on the first visitor, when the API address is missing.
export const init = () => {
	for (const k of ['PUBLIC_API_URL', 'PUBLIC_HELP_URL'] as const)
		if (!env[k]) throw new Error(`missing required env var ${k}`);
};

export async function handle({ event, resolve }) {
	event.locals.token = event.cookies.get(ADMIN_COOKIE);
	return resolve(event);
}

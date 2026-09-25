import { request } from '../web/src/lib/shared';

export * from '../web/src/lib/shared';

const base = process.env.EXPO_PUBLIC_API_URL;
const site = process.env.EXPO_PUBLIC_WEB_URL;
if (!base || !site)
	throw new Error(
		'EXPO_PUBLIC_API_URL or EXPO_PUBLIC_WEB_URL is not set. Copy .env.example to .env.'
	);

export const api = <T>(path: string, init?: RequestInit & { token?: string }) =>
	request<T>(base, path, init);

// Uploaded images live on the API; the demo photos (/img/…) are served by the website.
export const asset = (src: string | null) =>
	!src ? null : src.startsWith('/uploads/') ? base + src : src.startsWith('/') ? site + src : src;

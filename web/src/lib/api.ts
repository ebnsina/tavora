import { env } from '$env/dynamic/public';
import { request } from './shared';

export * from './shared';

export const api = <T>(
	path: string,
	init?: RequestInit & { token?: string },
	f: typeof fetch = fetch
) => request<T>(env.PUBLIC_API_URL, path, init, f);

// Uploaded images live on the API; bundled ones (/img/…) are served by the web app itself.
export const asset = (src: string | null | undefined) =>
	src?.startsWith('/uploads/') ? `${env.PUBLIC_API_URL}${src}` : (src ?? '');

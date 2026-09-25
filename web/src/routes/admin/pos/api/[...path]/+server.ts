import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';

// Relays POS calls to the API with the signed-in session, so the browser never holds the token.
const allowed = /^(pos|kitchen|menu|restaurant|admin\/me)(\/|$)/;

async function relay({ params, request, locals }: import('./$types').RequestEvent) {
	if (!locals.token) error(401, 'Please sign in again.');
	if (!allowed.test(params.path)) error(404, 'Not found');
	const res = await fetch(`${env.PUBLIC_API_URL}/v1/${params.path}`, {
		method: request.method,
		headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${locals.token}` },
		body: request.method === 'GET' ? undefined : await request.text()
	});
	return new Response(res.status === 204 ? null : res.body, {
		status: res.status,
		headers: { 'Content-Type': 'application/json' }
	});
}

export { relay as GET, relay as PUT, relay as POST };

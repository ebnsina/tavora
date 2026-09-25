import { fail } from '@sveltejs/kit';
import { api, type SiteContent } from '$lib/api';
import { act, adminApi, json } from '$lib/server/admin';

export const load = async ({ fetch }) => ({
	site: await api<SiteContent>('/v1/site', undefined, fetch)
});

export const actions = {
	default: async (event) => {
		const f = await event.request.formData();
		let site: SiteContent;
		try {
			site = JSON.parse(String(f.get('data')));
		} catch {
			return fail(400, {
				error: 'Something went wrong reading the form. Please reload and try again.'
			});
		}
		return act(async () => {
			// Optional new photos replace the current ones once they're uploaded.
			for (const [key, set] of [
				['seo_image', (u: string) => (site.seo.image = u)],
				['story_image', (u: string) => (site.story.image = u)]
			] as const) {
				const file = f.get(key);
				if (!(file instanceof File) || file.size === 0) continue;
				const body = new FormData();
				body.append('file', file);
				set(
					(await adminApi<{ url: string }>(event, '/v1/admin/uploads', { method: 'POST', body }))
						.url
				);
			}
			await adminApi(event, '/v1/admin/site', { method: 'PUT', body: json(site) });
		}, 'Website text saved. It’s live now.');
	}
};

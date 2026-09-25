import { error } from '@sveltejs/kit';
import { guides } from '$lib/docs';

export const entries = () => guides.map((g) => ({ slug: g.slug }));

export function load({ params }) {
	const i = guides.findIndex((g) => g.slug === params.slug);
	if (i < 0) error(404, 'Guide not found');
	return { guide: guides[i], prev: guides[i - 1] ?? null, next: guides[i + 1] ?? null };
}

import type { RequestEvent } from '@sveltejs/kit';
import { api, ApiError, type Category, type Item } from '$lib/api';
import { act, adminApi, json } from '$lib/server/admin';

type Cat = { id: number; slug: string; name: string; position: number };

export async function load(event) {
	const [cats, menu] = await Promise.all([
		adminApi<Cat[]>(event, '/v1/admin/categories'),
		api<Category[]>('/v1/menu', undefined, event.fetch)
	]);
	const items = menu.flatMap((c) => c.items);
	// Categories come from the admin list so empty ones still show up.
	return {
		categories: cats.map((c) => ({ ...c, items: items.filter((i) => i.category_id === c.id) }))
	};
}

async function uploadImage(event: RequestEvent, file: File) {
	const body = new FormData();
	body.append('file', file);
	const res = await adminApi<{ url: string }>(event, '/v1/admin/uploads', { method: 'POST', body });
	return res.url;
}

const itemBody = (f: FormData, image: string, available: boolean) => ({
	category_id: Number(f.get('category_id')),
	name: String(f.get('name') ?? ''),
	description: String(f.get('description') ?? ''),
	price: Math.round(Number(f.get('price')) * 100),
	tags: f.getAll('tags').map(String),
	image,
	available,
	position: Number(f.get('position') ?? 0)
});

export const actions = {
	addCategory: async (event) => {
		const f = await event.request.formData();
		return act(
			() =>
				adminApi(event, '/v1/admin/categories', {
					method: 'POST',
					body: json({ name: f.get('name') })
				}),
			'Category added'
		);
	},
	saveCategory: async (event) => {
		const f = await event.request.formData();
		return act(
			() =>
				adminApi(event, `/v1/admin/categories/${f.get('id')}`, {
					method: 'PUT',
					body: json({ name: f.get('name'), position: Number(f.get('position')) })
				}),
			'Category saved'
		);
	},
	deleteCategory: async (event) => {
		const f = await event.request.formData();
		return act(
			() => adminApi(event, `/v1/admin/categories/${f.get('id')}`, { method: 'DELETE' }),
			'Category deleted'
		);
	},
	saveItem: async (event) => {
		const f = await event.request.formData();
		const id = f.get('id');
		const file = f.get('file');
		return act(
			async () => {
				let image = String(f.get('image') ?? '');
				if (file instanceof File && file.size > 0) image = await uploadImage(event, file);
				const body = json(itemBody(f, image, f.get('available') === 'on'));
				await adminApi(event, id ? `/v1/admin/items/${id}` : '/v1/admin/items', {
					method: id ? 'PUT' : 'POST',
					body
				});
			},
			id ? 'Dish saved' : 'Dish added'
		);
	},
	toggle: async (event) => {
		const f = await event.request.formData();
		const menu = await api<Category[]>('/v1/menu', undefined, event.fetch);
		const item = menu.flatMap((c) => c.items).find((i) => i.id === Number(f.get('id')));
		return act(
			async () => {
				if (!item) throw new ApiError('not_found');
				const { id, available, ...rest }: Item = item;
				await adminApi(event, `/v1/admin/items/${id}`, {
					method: 'PUT',
					body: json({ ...rest, image: rest.image ?? '', available: !available })
				});
			},
			item?.available ? 'Marked sold out' : 'Back on the menu'
		);
	},
	deleteItem: async (event) => {
		const f = await event.request.formData();
		return act(
			() => adminApi(event, `/v1/admin/items/${f.get('id')}`, { method: 'DELETE' }),
			'Dish deleted'
		);
	}
};

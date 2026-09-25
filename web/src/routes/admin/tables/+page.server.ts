import { act, adminApi, json } from '$lib/server/admin';

type Table = { id: number; name: string; seats: number; area: string };

export const load = async (event) => ({
	tables: await adminApi<Table[]>(event, '/v1/admin/tables')
});

const body = (f: FormData) =>
	json({ name: f.get('name'), seats: Number(f.get('seats')), area: f.get('area') ?? '' });

export const actions = {
	add: async (event) => {
		const f = await event.request.formData();
		return act(
			() => adminApi(event, '/v1/admin/tables', { method: 'POST', body: body(f) }),
			'Table added'
		);
	},
	save: async (event) => {
		const f = await event.request.formData();
		return act(
			() => adminApi(event, `/v1/admin/tables/${f.get('id')}`, { method: 'PUT', body: body(f) }),
			'Table saved'
		);
	},
	remove: async (event) => {
		const f = await event.request.formData();
		return act(
			() => adminApi(event, `/v1/admin/tables/${f.get('id')}`, { method: 'DELETE' }),
			'Table removed'
		);
	}
};

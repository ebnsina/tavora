import { act, adminApi, json } from '$lib/server/admin';

type Staff = { id: number; name: string; created_at: string };

export const load = async (event) => ({
	staff: await adminApi<Staff[]>(event, '/v1/admin/staff')
});

const body = (f: FormData) => json({ name: f.get('name'), pin: f.get('pin') ?? '' });

export const actions = {
	add: async (event) => {
		const f = await event.request.formData();
		return act(
			() => adminApi(event, '/v1/admin/staff', { method: 'POST', body: body(f) }),
			'Staff member added'
		);
	},
	save: async (event) => {
		const f = await event.request.formData();
		return act(
			() => adminApi(event, `/v1/admin/staff/${f.get('id')}`, { method: 'PUT', body: body(f) }),
			'Saved'
		);
	},
	remove: async (event) => {
		const f = await event.request.formData();
		return act(
			() => adminApi(event, `/v1/admin/staff/${f.get('id')}`, { method: 'DELETE' }),
			'Removed and signed out'
		);
	}
};

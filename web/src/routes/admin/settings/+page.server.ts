import { api, type Restaurant } from '$lib/api';
import { act, adminApi, json } from '$lib/server/admin';

export const load = async ({ fetch }) => ({
	r: await api<Restaurant>('/v1/restaurant', undefined, fetch)
});

const taka = (v: FormDataEntryValue | null) => Math.round(Number(v ?? 0) * 100);

export const actions = {
	info: async (event) => {
		const f = await event.request.formData();
		const s = (k: string) => String(f.get(k) ?? '');
		return act(
			() =>
				adminApi(event, '/v1/admin/restaurant', {
					method: 'PUT',
					body: json({
						name: s('name'),
						area: s('area'),
						address: s('address'),
						phone: s('phone'),
						whatsapp: s('whatsapp'),
						email: s('email'),
						delivery_fee: taka(f.get('delivery_fee')),
						free_delivery_over: taka(f.get('free_delivery_over')),
						delivery_areas: s('delivery_areas'),
						delivery_eta: s('delivery_eta'),
						pickup_eta: s('pickup_eta')
					})
				}),
			'Details saved'
		);
	},
	theme: async (event) => {
		const f = await event.request.formData();
		return act(
			() =>
				adminApi(event, '/v1/admin/theme', {
					method: 'PUT',
					body: json({ color: String(f.getAll('color').at(-1) ?? '') })
				}),
			'Colour saved'
		);
	},
	vat: async (event) => {
		const f = await event.request.formData();
		return act(
			() =>
				adminApi(event, '/v1/admin/vat', {
					method: 'PUT',
					body: json({
						rate: Math.round(Number(f.get('rate') ?? 0) * 100),
						inclusive: f.get('inclusive') !== 'no',
						bin: String(f.get('bin') ?? '')
					})
				}),
			'VAT saved'
		);
	},
	hours: async (event) => {
		const f = await event.request.formData();
		const week = [0, 1, 2, 3, 4, 5, 6]
			.filter((d) => f.get(`open_${d}`) === 'on')
			.map((d) => ({ weekday: d, opens: f.get(`opens_${d}`), closes: f.get(`closes_${d}`) }));
		return act(
			() => adminApi(event, '/v1/admin/hours', { method: 'PUT', body: json(week) }),
			'Opening hours saved'
		);
	}
};

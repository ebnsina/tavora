import type { Reservation } from '$lib/api';
import { act, adminApi, json } from '$lib/server/admin';

export const load = async (event) => ({
	bookings: await adminApi<Reservation[]>(event, '/v1/admin/reservations')
});

export const actions = {
	status: async (event) => {
		const f = await event.request.formData();
		return act(
			() =>
				adminApi(event, `/v1/admin/reservations/${f.get('id')}`, {
					method: 'PATCH',
					body: json({ status: f.get('status') })
				}),
			'Booking updated'
		);
	}
};

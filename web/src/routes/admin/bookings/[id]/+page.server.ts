import { error } from '@sveltejs/kit';
import { ApiError, type Reservation } from '$lib/api';
import { act, adminApi, json } from '$lib/server/admin';

export type BookingDetail = Reservation & {
	created_at: string;
	history: Reservation[];
	orders: { count: number; spent: number; last_at: string | null };
};

export async function load(event) {
	try {
		const booking = await adminApi<BookingDetail>(
			event,
			`/v1/admin/reservations/${event.params.id}`
		);
		return { booking, crumb: `Booking for ${booking.name}` };
	} catch (e) {
		if (e instanceof ApiError && e.code === 'not_found') error(404, 'That booking doesn’t exist.');
		throw e;
	}
}

export const actions = {
	status: async (event) => {
		const f = await event.request.formData();
		return act(
			() =>
				adminApi(event, `/v1/admin/reservations/${event.params.id}`, {
					method: 'PATCH',
					body: json({ status: f.get('status') })
				}),
			'Booking updated'
		);
	}
};

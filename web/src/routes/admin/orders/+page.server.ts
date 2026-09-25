import type { Order } from '$lib/api';
import { act, adminApi, json } from '$lib/server/admin';

export async function load(event) {
	// Kitchen default: only orders someone still has to act on.
	const status = event.url.searchParams.get('status') ?? 'active';
	const orders = await adminApi<Order[]>(
		event,
		`/v1/admin/orders${status ? `?status=${status}` : ''}`
	);
	return { orders, status };
}

export const actions = {
	status: async (event) => {
		const f = await event.request.formData();
		return act(
			() =>
				adminApi(event, `/v1/admin/orders/${f.get('id')}`, {
					method: 'PATCH',
					body: json({ status: f.get('status') })
				}),
			'Order updated'
		);
	}
};

import { error } from '@sveltejs/kit';
import { ApiError, type Order, type Restaurant } from '$lib/api';
import type { Payment } from '$lib/pos';
import { adminApi } from '$lib/server/admin';

export type OrderDetail = Order & {
	source: 'online' | 'pos';
	discount: number;
	paid: number;
	due: number;
	table_id: number | null;
	table: string | null;
	created_by: string | null;
	voided_by: string | null;
	items: (Order['items'][number] & { note: string | null })[];
	payments: (Payment & { created_at: string; taken_by: string | null })[];
};

export async function load(event) {
	let order: OrderDetail;
	try {
		order = await adminApi<OrderDetail>(event, `/v1/admin/orders/${event.params.id}`);
	} catch (e) {
		if (e instanceof ApiError && e.code === 'not_found') error(404, 'That order doesn’t exist.');
		throw e;
	}
	const restaurant = await adminApi<Restaurant>(event, '/v1/restaurant');
	return { order, restaurant, crumb: `Order TV-${order.number}` };
}

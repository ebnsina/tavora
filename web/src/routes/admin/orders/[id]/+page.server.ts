import { error } from '@sveltejs/kit';
import { ApiError, type Order } from '$lib/api';
import type { Payment } from '$lib/pos';
import { adminApi } from '$lib/server/admin';

export type OrderDetail = Order & {
	source: 'online' | 'pos';
	discount: number;
	paid: number;
	due: number;
	table_id: number | null;
	payments: (Payment & { created_at: string })[];
};

export async function load(event) {
	let order: OrderDetail;
	try {
		order = await adminApi<OrderDetail>(event, `/v1/admin/orders/${event.params.id}`);
	} catch (e) {
		if (e instanceof ApiError && e.code === 'not_found') error(404, 'That order doesn’t exist.');
		throw e;
	}
	const table = order.table_id
		? (await adminApi<{ id: number; name: string }[]>(event, '/v1/admin/tables')).find(
				(t) => t.id === order.table_id
			)?.name
		: null;
	return { order, table };
}

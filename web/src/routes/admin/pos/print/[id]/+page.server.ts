import { error, redirect } from '@sveltejs/kit';
import { api, type Restaurant } from '$lib/api';
import type { Ticket } from '$lib/pos';
import { adminApi } from '$lib/server/admin';

type KTicket = {
	id: string;
	lines: { name: string; qty: number }[];
	created_at: string;
	table: string | null;
};

export async function load(event) {
	if (!event.locals.token) redirect(303, '/admin/login');
	const kitchenId = event.url.searchParams.get('kitchen');
	const [ticket, restaurant, board] = await Promise.all([
		adminApi<Ticket>(event, `/v1/pos/orders/${event.params.id}`),
		api<Restaurant>('/v1/restaurant', undefined, event.fetch),
		kitchenId ? adminApi<KTicket[]>(event, '/v1/kitchen') : Promise.resolve([])
	]);
	const kitchen = kitchenId ? board.find((k) => k.id === kitchenId) : null;
	if (kitchenId && !kitchen) error(404, 'That kitchen ticket is no longer on the board.');
	const tables = await adminApi<{ id: number; name: string }[]>(event, '/v1/admin/tables');
	return {
		ticket,
		restaurant,
		kitchen,
		table: tables.find((t) => t.id === ticket.table_id)?.name ?? null
	};
}

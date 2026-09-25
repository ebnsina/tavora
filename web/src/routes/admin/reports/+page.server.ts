import { ApiError, type Restaurant } from '$lib/api';
import { adminApi } from '$lib/server/admin';

type Money = { count: number; amount: number; tips: number };
export type DayReport = {
	date: string;
	methods: (Money & { method: 'cash' | 'card' | 'bkash' | 'nagad' })[];
	staff: (Money & { name: string })[];
	voids: {
		id: string;
		number: number;
		total: number;
		name: string;
		created_at: string;
		voided_by: string;
	}[];
	online: { count: number; cash: number };
	discounts: { count: number; amount: number };
	open: { count: number; total: number };
	vat: number;
	drawer: number;
};

export async function load(event) {
	const date = event.url.searchParams.get('date') ?? '';
	const restaurant = await adminApi<Restaurant>(event, '/v1/restaurant');
	try {
		return {
			restaurant,
			report: await adminApi<DayReport>(
				event,
				`/v1/admin/reports/day?date=${encodeURIComponent(date)}`
			),
			dateError: ''
		};
	} catch (e) {
		if (!(e instanceof ApiError) || e.code !== 'validation_failed') throw e;
		return {
			restaurant,
			report: await adminApi<DayReport>(event, '/v1/admin/reports/day'),
			dateError: 'That date doesn’t look right, so this is today’s report.'
		};
	}
}

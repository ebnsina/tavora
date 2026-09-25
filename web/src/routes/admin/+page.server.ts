import { ApiError } from '$lib/api';
import { adminApi } from '$lib/server/admin';

export type Stats = {
	from: string;
	to: string;
	totals: Period;
	previous: Period;
	days: { date: string; orders: number; revenue: number }[];
	top_items: { name: string; qty: number; revenue: number }[];
	open: Record<string, number>;
	upcoming_bookings: import('$lib/api').Reservation[];
};
type Period = {
	orders: number;
	revenue: number;
	cancelled: number;
	delivery: number;
	pickup: number;
	dine_in: number;
};

const bdDate = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });
const daysAgo = (n: number) => bdDate(new Date(Date.now() - n * 86_400_000));

export async function load(event) {
	const q = event.url.searchParams;
	// Presets are counted in days back from today; a custom range uses both dates.
	const preset = q.get('range') ?? (q.get('from') ? 'custom' : '7');
	const to = preset === 'custom' ? (q.get('to') ?? daysAgo(0)) : daysAgo(0);
	const from = preset === 'custom' ? (q.get('from') ?? daysAgo(6)) : daysAgo(Number(preset) - 1);
	let stats: Stats;
	let rangeError = '';
	try {
		stats = await adminApi<Stats>(event, `/v1/admin/stats?from=${from}&to=${to}`);
	} catch (e) {
		if (!(e instanceof ApiError) || e.code !== 'validation_failed') throw e;
		rangeError =
			'That date range doesn’t work (start after end, or longer than a year). Showing the last 7 days.';
		stats = await adminApi<Stats>(event, `/v1/admin/stats?from=${daysAgo(6)}&to=${daysAgo(0)}`);
	}
	const hour = Number(
		new Date().toLocaleString('en-GB', {
			hour: 'numeric',
			hourCycle: 'h23',
			timeZone: 'Asia/Dhaka'
		})
	);
	return { stats, preset: rangeError ? '7' : preset, hour, rangeError };
}

import { env } from '$env/dynamic/public';

// Amounts from the API are integer poisha (৳1 = 100).
export type Tag = 'veg' | 'spicy' | 'popular';
export type Item = {
	id: number;
	name: string;
	description: string;
	price: number;
	tags: Tag[];
	image: string | null;
	available: boolean;
};
export type Category = { slug: string; name: string; items: Item[] };
export type Hours = { weekday: number; opens: string; closes: string };
export type Restaurant = {
	name: string;
	area: string;
	address: string;
	phone: string;
	whatsapp: string;
	email: string;
	delivery: { fee: number; free_over: number; areas: string; eta: string };
	pickup_eta: string;
	hours: Hours[];
};
export type Order = {
	id: string;
	number: number;
	mode: 'delivery' | 'pickup';
	status: string;
	name: string;
	phone: string;
	address: string | null;
	note: string | null;
	items: { id: number; name: string; unit_price: number; qty: number; amount: number }[];
	subtotal: number;
	delivery_fee: number;
	total: number;
	created_at: string;
};
export type Reservation = {
	id: string;
	name: string;
	phone: string;
	guests: number;
	date: string;
	time: string;
	note: string | null;
	status: string;
};

export class ApiError extends Error {
	constructor(
		public code: string,
		public details: Record<string, unknown> = {}
	) {
		super(code);
	}
}

// Plain-language copy for every error code the API can return.
const messages: Record<string, string> = {
	validation_failed: 'Please check the highlighted details and try again.',
	item_unavailable: 'Sorry, one of your dishes just sold out. Please remove it and try again.',
	item_not_found: 'One of your dishes is no longer on the menu. Please remove it and try again.',
	restaurant_closed: "We're closed right now, so we can't take orders.",
	outside_opening_hours: "We can't book a table at that time. Please pick another.",
	network: "We couldn't reach the restaurant. Check your connection and try again.",
	internal: 'Something went wrong on our side. Please try again, or call us.'
};

export const message = (e: unknown) =>
	(e instanceof ApiError && messages[e.code]) || messages.internal;

export async function api<T>(
	path: string,
	init?: RequestInit,
	f: typeof fetch = fetch
): Promise<T> {
	let res: Response;
	try {
		res = await f(`${env.PUBLIC_API_URL}${path}`, {
			...init,
			headers: { 'Content-Type': 'application/json', ...init?.headers }
		});
	} catch {
		throw new ApiError('network');
	}
	const body = await res.json().catch(() => null);
	if (!res.ok) throw new ApiError(body?.error?.code ?? 'internal', body?.error?.details);
	return body as T;
}

export const price = (poisha: number) => fmt.format(poisha / 100);
const fmt = new Intl.NumberFormat('en-BD', {
	style: 'currency',
	currency: 'BDT',
	currencyDisplay: 'narrowSymbol',
	maximumFractionDigits: 0
});

const clock = new Intl.DateTimeFormat('en-BD', { hour: 'numeric', minute: '2-digit' });
export const time = (hhmm: string) => clock.format(new Date(`1970-01-01T${hhmm}`));

// Bangladesh's week starts on Saturday; consecutive days with equal hours collapse into one row.
const dayName = (d: number) =>
	new Intl.DateTimeFormat('en-GB', { weekday: 'long' }).format(new Date(2024, 0, 7 + d));
export function groupHours(hours: Hours[]) {
	const rows: { days: string; opens: string; closes: string }[] = [];
	let from = -1;
	const week = [6, 0, 1, 2, 3, 4, 5].map((d) => hours.find((h) => h.weekday === d));
	week.forEach((h, i) => {
		if (from < 0) from = i;
		const next = week[i + 1];
		if (next && h && next.opens === h.opens && next.closes === h.closes) return;
		if (h) {
			const a = dayName(week[from]!.weekday),
				b = dayName(h.weekday);
			rows.push({ days: a === b ? a : `${a} – ${b}`, opens: h.opens, closes: h.closes });
		}
		from = -1;
	});
	return rows;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const bdClock = new Intl.DateTimeFormat('en-US', {
	timeZone: 'Asia/Dhaka',
	weekday: 'short',
	hour: '2-digit',
	minute: '2-digit',
	hourCycle: 'h23'
});
const mins = (hhmm: string) => +hhmm.slice(0, 2) * 60 + +hhmm.slice(3, 5);

// Mirrors the API's rule (open from `opens` up to, not including, `closes`), in Bangladesh time.
export function openState(hours: Hours[], now = new Date()) {
	const p = Object.fromEntries(bdClock.formatToParts(now).map((x) => [x.type, x.value]));
	const day = DAYS.indexOf(p.weekday);
	const m = +p.hour * 60 + +p.minute;
	const today = hours.find((h) => h.weekday === day);
	if (today && m >= mins(today.opens) && m < mins(today.closes))
		return { open: true as const, closes: today.closes };
	if (today && m < mins(today.opens))
		return { open: false as const, when: 'today', at: today.opens };
	const next = hours.find((h) => h.weekday === (day + 1) % 7);
	return { open: false as const, when: next ? 'tomorrow' : '', at: next?.opens ?? '' };
}

import { ApiError } from '$lib/api';

export type Line = {
	id: number;
	name: string;
	unit_price: number;
	qty: number;
	amount: number;
	sent: number;
};
export type Payment = {
	id: string;
	method: string;
	amount: number;
	tip: number;
	reference: string | null;
};
export type Ticket = {
	id: string;
	number: number;
	mode: 'dine_in' | 'pickup';
	status: string;
	name: string;
	phone: string | null;
	note: string | null;
	items: Line[];
	subtotal: number;
	discount: number;
	total: number;
	paid: number;
	due: number;
	payments: Payment[];
	table_id: number | null;
	created_at: string;
};
export type FloorTicket = {
	id: string;
	number: number;
	name: string;
	total: number;
	paid: number;
	unsent: number;
	created_at: string;
};
export type Floor = {
	tables: { id: number; name: string; seats: number; area: string; ticket: FloorTicket | null }[];
	counter: FloorTicket[];
};

// Talks to the API through the /admin/pos/api relay; errors come back as ApiError like everywhere else.
export async function pos<T>(path: string, init?: RequestInit): Promise<T> {
	let res: Response;
	try {
		// A request stuck on a dying connection must fail, not hang, or the sync queue would stall behind it.
		res = await fetch(`/admin/pos/api/${path}`, {
			...init,
			headers: { 'Content-Type': 'application/json' },
			signal: AbortSignal.timeout(15_000)
		});
	} catch {
		throw new ApiError('network');
	}
	if (res.status === 401) location.href = '/admin/login';
	const body = await res.json().catch(() => null);
	if (!res.ok) throw new ApiError(body?.error?.code ?? 'internal', body?.error?.details);
	return body as T;
}

export const minutesSince = (iso: string) =>
	Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));

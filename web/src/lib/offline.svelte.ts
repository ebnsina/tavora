import { ApiError, message, type Category, type Item, type Restaurant } from '$lib/api';
import { pos, type Floor, type Payment, type Ticket } from '$lib/pos';

// The POS keeps working without internet: every change is applied here first, saved on the
// tablet, and queued. The queue replays in order once the API is reachable again. Each queued
// call carries an id made on this tablet, so a replay can never double a ticket, kitchen send
// or payment.

type Kind = 'put' | 'kitchen' | 'payment' | 'void';
export type Op = {
	opId: string;
	kind: Kind;
	orderId: string;
	path: string;
	method: 'PUT' | 'POST';
	body: unknown;
};
export type Failed = Op & { error: string; label: string };

const KEY = 'tavora-pos-v1';

export const store = $state({
	online: true,
	syncing: false,
	queue: [] as Op[],
	failed: [] as Failed[],
	menu: [] as Category[],
	floor: null as Floor | null,
	me: null as { name: string } | null,
	restaurant: null as Restaurant | null,
	tickets: {} as Record<string, Ticket>
});

function persist() {
	try {
		const { queue, failed, menu, floor, me, restaurant, tickets } = store;
		localStorage.setItem(
			KEY,
			JSON.stringify({ queue, failed, menu, floor, me, restaurant, tickets })
		);
	} catch {
		// Storage full or blocked: the queue still lives in memory for this session.
	}
}

let started = false;
// Called once by the POS layout: restore saved state, then keep syncing.
export function start() {
	if (started) return;
	started = true;
	try {
		Object.assign(store, JSON.parse(localStorage.getItem(KEY) ?? '{}'));
	} catch {}
	// Keep only tickets that are still open or still waiting to sync.
	for (const [id, t] of Object.entries(store.tickets)) {
		if (!pendingFor(id) && (t.status !== 'open' || !t.items.length)) delete store.tickets[id];
	}
	store.online = navigator.onLine;
	addEventListener('online', () => {
		store.online = true;
		flush();
	});
	addEventListener('offline', () => (store.online = false));
	setInterval(flush, 10_000);
	refresh();
	flush();
}

// Fetch fresh reference data when possible; keep the saved copy when not.
export async function refresh() {
	try {
		const [menu, floor, me, restaurant] = await Promise.all([
			pos<Category[]>('menu'),
			pos<Floor>('pos/floor'),
			pos<{ name: string }>('admin/me'),
			pos<Restaurant>('restaurant')
		]);
		Object.assign(store, { menu, floor, me, restaurant, online: true });
		persist();
	} catch (e) {
		if (e instanceof ApiError && e.code === 'network') store.online = false;
	}
}

const pendingFor = (orderId: string) => store.queue.some((op) => op.orderId === orderId);

export function enqueue(op: Omit<Op, 'opId'>) {
	const last = store.queue.at(-1);
	// Consecutive edits to the same ticket collapse into the latest, since each carries the full ticket.
	if (op.kind === 'put' && last?.kind === 'put' && last.orderId === op.orderId) {
		store.queue[store.queue.length - 1] = { ...op, opId: last.opId };
	} else {
		store.queue.push({ ...op, opId: crypto.randomUUID() });
	}
	persist();
	flush();
}

const labels: Record<Kind, string> = {
	put: 'Ticket change',
	kitchen: 'Kitchen send',
	payment: 'Payment',
	void: 'Void'
};

let running: Promise<void> | null = null;
// One replay at a time. The guard is cleared in .finally, which always runs after it's set;
// clearing it inside the loop could run first when there's nothing to send and leave it stuck.
export function flush() {
	if (running || !store.queue.length) return running ?? Promise.resolve();
	running = (async () => {
		store.syncing = true;
		while (store.queue.length) {
			const op = store.queue[0];
			try {
				const t = await pos<Ticket>(op.path, { method: op.method, body: JSON.stringify(op.body) });
				store.online = true;
				store.queue.shift();
				// Only trust the server's copy once this tablet has nothing newer queued for the ticket.
				if (!pendingFor(op.orderId)) store.tickets[op.orderId] = t;
			} catch (e) {
				if (e instanceof ApiError && e.code === 'network') {
					store.online = false;
					break;
				}
				store.queue.shift();
				store.failed.push({ ...op, error: explain(e), label: labels[op.kind] });
			}
			persist();
		}
		if (!store.queue.length) refresh();
	})().finally(() => {
		store.syncing = false;
		running = null;
	});
	return running;
}

export function dismiss(opId: string) {
	store.failed = store.failed.filter((f) => f.opId !== opId);
	persist();
}

export function explain(e: unknown) {
	if (!(e instanceof ApiError)) return message(e);
	const d = e.details as Record<string, unknown>;
	switch (e.code) {
		case 'table_busy':
			return 'Another tablet opened this table first. Check the floor and move these dishes there.';
		case 'already_sent':
			return `${d.name} was already in the kitchen, so it couldn’t be reduced.`;
		case 'order_closed':
			return 'This ticket was already paid or voided on another tablet.';
		case 'overpayment':
			return 'More money was taken than the bill; check the payments on this ticket.';
		case 'has_payments':
			return 'Money was already taken on this ticket, so it couldn’t be voided.';
		case 'nothing_to_send':
			return 'The kitchen already had everything on this ticket.';
		default:
			return message(e);
	}
}

// ---- Local ticket model: what the till shows before (or without) the server's answer.

export function blankTicket(id: string, mode: Ticket['mode'], tableId: number | null): Ticket {
	return {
		id,
		number: 0,
		mode,
		status: 'open',
		name: '',
		phone: null,
		note: null,
		items: [],
		subtotal: 0,
		discount: 0,
		total: 0,
		paid: 0,
		due: 0,
		payments: [],
		table_id: tableId,
		created_at: new Date().toISOString()
	};
}

function totals(t: Ticket) {
	t.subtotal = t.items.reduce((s, l) => s + l.amount, 0);
	t.discount = Math.min(t.discount, t.subtotal);
	t.total = t.subtotal - t.discount;
	t.paid = t.payments.reduce((s, p) => s + p.amount, 0);
	t.due = t.total - t.paid;
	return t;
}

// Replace the lines with `qty` per dish; existing lines keep their price and kitchen count.
export function setLines(t: Ticket, qty: Record<number, number>, menu: Map<number, Item>) {
	t.items = Object.entries(qty)
		.filter(([, q]) => q > 0)
		.map(([k, q]) => {
			const old = t.items.find((l) => l.id === +k);
			const unit = old?.unit_price ?? menu.get(+k)?.price ?? 0;
			return {
				id: +k,
				name: old?.name ?? menu.get(+k)?.name ?? '',
				unit_price: unit,
				qty: q,
				amount: unit * q,
				sent: old?.sent ?? 0,
				note: old?.note ?? null
			};
		});
	return totals(t);
}

export function saveTicket(t: Ticket) {
	store.tickets[t.id] = totals(t);
	enqueue({
		kind: 'put',
		orderId: t.id,
		path: `pos/orders/${t.id}`,
		method: 'PUT',
		body: {
			mode: t.mode,
			table_id: t.table_id,
			name: t.name,
			discount: t.discount,
			items: t.items.map((l) => ({ id: l.id, qty: l.qty, note: l.note ?? '' }))
		}
	});
}

export function setNote(t: Ticket, itemId: number, note: string) {
	const line = t.items.find((l) => l.id === itemId);
	if (!line) return;
	line.note = note.trim() || null;
	saveTicket(t);
}

// Marks everything as sent and returns just the new lines, for the kitchen printout.
export function sendKitchen(t: Ticket) {
	const lines = t.items
		.filter((l) => l.qty > l.sent)
		.map((l) => ({ name: l.name, qty: l.qty - l.sent, note: l.note }));
	if (!lines.length) return lines;
	t.items = t.items.map((l) => ({ ...l, sent: l.qty }));
	store.tickets[t.id] = t;
	enqueue({
		kind: 'kitchen',
		orderId: t.id,
		path: `pos/orders/${t.id}/kitchen`,
		method: 'POST',
		body: { ticket_id: crypto.randomUUID() }
	});
	return lines;
}

export function addPayment(t: Ticket, p: Omit<Payment, 'id'>) {
	const payment = { ...p, id: crypto.randomUUID() };
	t.payments = [...t.payments, payment];
	totals(t);
	if (t.due <= 0) t.status = 'completed';
	store.tickets[t.id] = t;
	enqueue({
		kind: 'payment',
		orderId: t.id,
		path: `pos/orders/${t.id}/payments`,
		method: 'POST',
		body: payment
	});
}

export function voidTicket(t: Ticket) {
	t.status = 'cancelled';
	store.tickets[t.id] = t;
	enqueue({
		kind: 'void',
		orderId: t.id,
		path: `pos/orders/${t.id}/void`,
		method: 'POST',
		body: {}
	});
}

// The floor as this tablet knows it: last server copy plus tickets changed here since.
export function floorView(): Floor | null {
	if (!store.floor) return null;
	const local = Object.values(store.tickets).filter((t) => pendingFor(t.id) || !store.floor);
	const tables = store.floor.tables.map((table) => {
		const mine = local.find((t) => t.table_id === table.id);
		if (!mine) return table;
		return { ...table, ticket: mine.status === 'open' ? summary(mine) : null };
	});
	const localIds = new Set(local.map((t) => t.id));
	const counter = [
		...store.floor.counter.filter((c) => !localIds.has(c.id)),
		...local.filter((t) => t.status === 'open' && !t.table_id).map(summary)
	];
	return { tables, counter };
}

const summary = (t: Ticket) => ({
	id: t.id,
	number: t.number,
	name: t.name || 'Walk-in',
	total: t.total,
	paid: t.paid,
	unsent: t.items.reduce((n, l) => n + l.qty - l.sent, 0),
	created_at: t.created_at
});

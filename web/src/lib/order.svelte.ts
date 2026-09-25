import type { Item } from '$lib/api';

const KEY = 'tavora-cart';

// Lines are menu item id → quantity.
export const cart = $state({ lines: {} as Record<number, number>, open: false });

export const count = () => Object.values(cart.lines).reduce((a, b) => a + b, 0);
export const subtotal = (items: Map<number, Item>) =>
	Object.entries(cart.lines).reduce(
		(sum, [id, qty]) => sum + (items.get(+id)?.price ?? 0) * qty,
		0
	);

export function add(id: number, by = 1) {
	const qty = (cart.lines[id] ?? 0) + by;
	if (qty > 0) cart.lines[id] = qty;
	else delete cart.lines[id];
}

// Storage can be blocked (private mode); the cart then just lives for the visit. Unknown or sold-out ids are dropped.
export function load(items: Map<number, Item>) {
	try {
		const saved: Record<string, number> = JSON.parse(localStorage.getItem(KEY) ?? '{}');
		for (const [id, qty] of Object.entries(saved))
			if (items.get(+id)?.available && qty > 0) cart.lines[+id] = qty;
	} catch {}
}

export function save() {
	try {
		localStorage.setItem(KEY, JSON.stringify(cart.lines));
	} catch {}
}

// Browser-only clock so open/closed never differs between server render and hydration.
export const clock = $state({ now: null as Date | null });

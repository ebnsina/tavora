<script lang="ts">
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		Add01Icon,
		ChefHatIcon,
		DiscountIcon,
		Delete02Icon,
		MinusSignIcon,
		PrinterIcon,
		Search01Icon
	} from '@hugeicons/core-free-icons';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { ApiError, price, vatPct, type Item } from '$lib/api';
	import {
		addPayment,
		blankTicket,
		saveTicket,
		sendKitchen,
		setLines,
		setNote,
		store,
		voidTicket
	} from '$lib/offline.svelte';
	import { pos, type Ticket } from '$lib/pos';
	import Slip from '$lib/Slip.svelte';
	import { onMount, tick } from 'svelte';
	import PaySheet from './PaySheet.svelte';
	import Dialog from '$lib/admin/Dialog.svelte';

	const id = $derived(page.params.id!);
	// The tablet's copy is the source of truth on screen; the server catches up through the queue.
	const t = $derived(store.tickets[id] ?? null);
	let loading = $state(true);
	let paying = $state(false);
	// Phones: the bill is a sheet that slides up over the menu.
	let sheet = $state(false);
	let askDiscount = $state(false);
	let cat = $state<number | 'all'>('all');
	let search = $state('');
	let slip = $state<{ kitchen?: { name: string; qty: number; note?: string | null }[] } | null>(
		null
	);
	// The dish whose cook's note is being written.
	let noting = $state<number | null>(null);
	let draft = $state('');
	const quickNotes = [
		'No onion',
		'Extra spicy',
		'Less spicy',
		'No ice',
		'Well done',
		'Pack separately'
	];
	const notingLine = $derived(t?.items.find((l) => l.id === noting));
	function toggleQuick(q: string) {
		const parts = draft
			.split(',')
			.map((p) => p.trim())
			.filter(Boolean);
		draft = (parts.includes(q) ? parts.filter((p) => p !== q) : [...parts, q]).join(', ');
	}

	const menu = $derived(new Map(store.menu.flatMap((c) => c.items).map((i) => [i.id, i])));
	const tableName = $derived(store.floor?.tables.find((x) => x.id === t?.table_id)?.name ?? '');
	const unsent = $derived(t?.items.reduce((n, l) => n + l.qty - l.sent, 0) ?? 0);
	const open = $derived(t?.status === 'open');
	const failures = $derived(store.failed.filter((f) => f.orderId === id));
	const shown = $derived(
		store.menu
			.filter((c) => cat === 'all' || c.id === cat)
			.flatMap((c) => c.items)
			.filter((i) => i.name.toLowerCase().includes(search.trim().toLowerCase()))
	);

	onMount(async () => {
		// Fresh server copy when online and nothing from this tablet is still waiting for it.
		if (store.online && !store.queue.some((op) => op.orderId === id)) {
			try {
				store.tickets[id] = await pos<Ticket>(`pos/orders/${id}`);
			} catch (e) {
				if (!(e instanceof ApiError) || !['not_found', 'network'].includes(e.code))
					console.error(e);
			}
		}
		if (!store.tickets[id]) {
			const table = page.url.searchParams.get('table');
			store.tickets[id] = blankTicket(id, table ? 'dine_in' : 'pickup', table ? +table : null);
		}
		loading = false;
	});

	const qtyMap = () => Object.fromEntries(t!.items.map((l) => [l.id, l.qty]));
	function setQty(itemId: number, qty: number) {
		if (!t || !open) return;
		saveTicket(setLines(t, { ...qtyMap(), [itemId]: qty }, menu));
	}
	const add = (item: Item) =>
		item.available && setQty(item.id, (t?.items.find((l) => l.id === item.id)?.qty ?? 0) + 1);
	function change(itemId: number, by: number) {
		const line = t?.items.find((l) => l.id === itemId);
		if (line && line.qty + by >= line.sent) setQty(itemId, line.qty + by);
	}

	async function print(what: typeof slip) {
		slip = what;
		await tick();
		window.print();
	}

	function toKitchen() {
		if (!t) return;
		const lines = sendKitchen(t);
		if (lines.length) print({ kitchen: lines });
	}

	function doVoid() {
		if (!t || !confirm('Void this ticket? It will be cancelled.')) return;
		voidTicket(t);
		goto('/admin/pos');
	}
</script>

{#if t}
	<Slip ticket={t} restaurant={store.restaurant} table={tableName} kitchen={slip?.kitchen} />
{/if}

<div class="till">
	<section class="menu" aria-label="Menu">
		<div class="tools">
			<label class="search">
				<HugeiconsIcon icon={Search01Icon} size={20} />
				<input bind:value={search} placeholder="Search dishes" aria-label="Search dishes" />
			</label>
			<div class="cats" role="tablist" aria-label="Categories">
				<button type="button" role="tab" aria-selected={cat === 'all'} onclick={() => (cat = 'all')}
					>All</button
				>
				{#each store.menu as c (c.id)}
					<button type="button" role="tab" aria-selected={cat === c.id} onclick={() => (cat = c.id)}
						>{c.name}</button
					>
				{/each}
			</div>
		</div>
		<ul class="dishes">
			{#each shown as item (item.id)}
				{@const q = t?.items.find((l) => l.id === item.id)?.qty}
				<li>
					<button
						type="button"
						class="dish"
						disabled={!item.available || !open}
						onclick={() => add(item)}
					>
						<span class="dname">{item.name}</span>
						<span class="dprice">{item.available ? price(item.price) : 'Sold out'}</span>
						{#if q}<span class="qbadge">{q}</span>{/if}
					</button>
				</li>
			{:else}
				<li class="muted">
					{store.menu.length
						? 'No dishes match.'
						: 'The menu hasn’t loaded on this tablet yet. Connect once to get it.'}
				</li>
			{/each}
		</ul>
	</section>

	<section class="bill" class:open={sheet} aria-label="Ticket">
		<button class="sheet-bar" type="button" aria-expanded={sheet} onclick={() => (sheet = !sheet)}>
			<span class="grip" aria-hidden="true"></span>
			<span class="sum">
				<strong>{t?.mode === 'dine_in' ? tableName || 'Table' : 'Takeaway'}</strong>
				{t?.items.reduce((n, l) => n + l.qty, 0) ?? 0} items
			</span>
			<strong class="sum-total">{price(Math.max(0, t?.due ?? 0))}</strong>
			<span class="sheet-cta">{sheet ? 'Hide bill' : 'View bill'}</span>
		</button>
		<div class="bill-head">
			<div>
				<strong class="where">{t?.mode === 'dine_in' ? tableName || 'Table' : 'Takeaway'}</strong>
				<span class="num">
					{t?.number ? `#${t.number}` : t?.items.length ? 'Not synced yet' : 'New ticket'}
					{#if t && !open}· {t.status === 'completed' ? 'Paid' : 'Voided'}{/if}
				</span>
			</div>
			{#if t}
				<input
					class="guest"
					value={['Walk-in', 'Table'].includes(t.name) ? '' : t.name}
					onchange={(e) => {
						t.name = e.currentTarget.value;
						if (t.items.length) saveTicket(t);
					}}
					disabled={!open}
					placeholder="Customer name (optional)"
					aria-label="Customer name"
					maxlength="80"
				/>
			{/if}
		</div>

		{#each failures as f (f.opId)}<p class="err" role="alert">{f.label}: {f.error}</p>{/each}

		<ul class="lines">
			{#each t?.items ?? [] as l (l.id)}
				<li>
					<div class="lname">
						<span>{l.name}</span>
						{#if l.sent}<span class="sent"
								><HugeiconsIcon icon={ChefHatIcon} size={12} /> {l.sent} in kitchen</span
							>{/if}
						<!-- Notes go with the next kitchen send, so they can only change while some are unsent. -->
						{#if l.note || (open && l.qty > l.sent)}
							<button
								type="button"
								class="note-btn"
								class:has={l.note}
								disabled={!open || l.qty <= l.sent}
								onclick={() => {
									noting = l.id;
									draft = l.note ?? '';
								}}>{l.note ? `“${l.note}”` : '+ Note'}</button
							>
						{/if}
					</div>
					<div class="qty">
						<button
							type="button"
							aria-label="One less {l.name}"
							disabled={!open || l.qty <= l.sent}
							onclick={() => change(l.id, -1)}
						>
							<HugeiconsIcon icon={MinusSignIcon} size={18} />
						</button>
						<span>{l.qty}</span>
						<button
							type="button"
							aria-label="One more {l.name}"
							disabled={!open}
							onclick={() => change(l.id, 1)}
						>
							<HugeiconsIcon icon={Add01Icon} size={18} />
						</button>
					</div>
					<span class="lamt">{price(l.amount)}</span>
				</li>
			{:else}
				<li class="none">{loading ? 'Loading…' : 'Tap dishes on the left to add them.'}</li>
			{/each}
		</ul>

		{#if t}
			<div class="totals">
				<div><span>Subtotal</span><span>{price(t.subtotal)}</span></div>
				{#if askDiscount && open}
					<label class="disc">
						Discount (৳)
						<input
							type="number"
							min="0"
							step="1"
							value={t.discount / 100}
							onchange={(e) => {
								t.discount = Math.max(0, Math.round(Number(e.currentTarget.value) * 100));
								saveTicket(t);
							}}
						/>
					</label>
				{:else if t.discount}
					<div><span>Discount</span><span>−{price(t.discount)}</span></div>
				{/if}
				{#if t.vat}<div>
						<span>VAT {vatPct(t.vat_rate)}{t.vat_inclusive ? ' (included)' : ''}</span><span
							>{price(t.vat)}</span
						>
					</div>{/if}
				{#if t.paid}<div><span>Paid so far</span><span>−{price(t.paid)}</span></div>{/if}
				<div class="grand">
					<span>{t.paid ? 'Left to pay' : 'Total'}</span><strong>{price(Math.max(0, t.due))}</strong
					>
				</div>
			</div>

			<div class="actions">
				<button type="button" class="act kitchen" disabled={!unsent || !open} onclick={toKitchen}>
					<HugeiconsIcon icon={ChefHatIcon} size={20} />
					{unsent ? `Send ${unsent} to kitchen` : 'Kitchen has it all'}
				</button>
				<div class="small-acts">
					<button
						type="button"
						class="act ghost"
						disabled={!t.items.length}
						onclick={() => print({})}
					>
						<HugeiconsIcon icon={PrinterIcon} size={18} /> Bill
					</button>
					<button
						type="button"
						class="act ghost"
						disabled={!open}
						onclick={() => (askDiscount = !askDiscount)}
					>
						<HugeiconsIcon icon={DiscountIcon} size={18} /> Discount
					</button>
					<button
						type="button"
						class="act ghost"
						disabled={!open || t.paid > 0 || !t.items.length}
						onclick={doVoid}
					>
						<HugeiconsIcon icon={Delete02Icon} size={18} /> Void
					</button>
				</div>
				<button
					type="button"
					class="act pay"
					disabled={!open || !t.items.length || t.due <= 0}
					onclick={() => (paying = true)}
				>
					Pay {price(Math.max(0, t.due))}
				</button>
			</div>
		{/if}
	</section>
</div>

<Dialog
	open={noting !== null}
	title="Note for {notingLine?.name ?? 'dish'}"
	onclose={() => (noting = null)}
>
	<form
		class="note-form"
		onsubmit={(e) => {
			e.preventDefault();
			if (t && noting !== null) setNote(t, noting, draft);
			noting = null;
		}}
	>
		<div class="quick">
			{#each quickNotes as q (q)}
				<button
					type="button"
					aria-pressed={draft
						.split(',')
						.map((p) => p.trim())
						.includes(q)}
					onclick={() => toggleQuick(q)}>{q}</button
				>
			{/each}
		</div>
		<label>
			Anything else for the cook
			<textarea bind:value={draft} maxlength="100" rows="2"></textarea>
		</label>
		<button class="save" type="submit">Save note</button>
	</form>
</Dialog>

{#if paying && t}
	<PaySheet
		ticket={t}
		onclose={() => (paying = false)}
		onpay={(p) => {
			addPayment(t, p);
			if (t.status === 'completed') print({});
		}}
		ondone={() => goto('/admin/pos')}
	/>
{/if}

<style>
	.note-btn {
		justify-self: start;
		padding: 2px 0;
		border: 0;
		background: none;
		color: var(--muted);
		font: 600 0.8125rem var(--sans);
		text-align: left;
		cursor: pointer;
	}
	.note-btn.has {
		color: var(--brand);
		font-style: italic;
	}
	.note-btn:disabled {
		cursor: default;
	}
	.note-form {
		display: grid;
		gap: 14px;
	}
	.quick {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.quick button {
		min-height: 48px;
		padding: 0 16px;
		border: 0;
		border-radius: 12px;
		background: var(--soft);
		font: 700 0.9375rem var(--sans);
		cursor: pointer;
	}
	.quick button[aria-pressed='true'] {
		background: var(--black);
		color: var(--cream);
	}
	.note-form label {
		display: grid;
		gap: 6px;
		font-weight: 700;
		font-size: 0.875rem;
	}
	.note-form textarea {
		padding: 10px 14px;
		border: 0;
		border-radius: 12px;
		background: #fffdf6;
		box-shadow: inset 0 0 0 2px var(--line);
		font: 1rem var(--sans);
		resize: vertical;
	}
	.save {
		min-height: 56px;
		border: 0;
		border-radius: 14px;
		background: var(--brand);
		color: var(--cream);
		font: 800 1.125rem var(--sans);
		cursor: pointer;
	}
	.till {
		height: 100%;
		display: grid;
		grid-template-columns: 1fr 400px;
		overflow: hidden;
	}
	.menu {
		display: flex;
		flex-direction: column;
		min-height: 0;
	}
	.tools {
		display: grid;
		gap: 10px;
		padding: 14px 14px 10px;
	}
	.search {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 0 14px;
		border-radius: 14px;
		background: var(--cream);
		box-shadow: inset 0 0 0 2px var(--line);
	}
	.search input {
		flex: 1;
		min-height: 48px;
		border: 0;
		background: none;
		font: 1rem var(--sans);
		outline: none;
	}
	.cats {
		display: flex;
		gap: 6px;
		overflow-x: auto;
		scrollbar-width: none;
	}
	.cats button {
		flex: none;
		min-height: 44px;
		padding: 0 16px;
		border: 0;
		border-radius: 12px;
		background: var(--cream);
		font: 700 0.9375rem var(--sans);
		cursor: pointer;
	}
	.cats button[aria-selected='true'] {
		background: var(--black);
		color: var(--cream);
	}
	.dishes {
		flex: 1;
		overflow-y: auto;
		list-style: none;
		margin: 0;
		padding: 4px 14px 14px;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		grid-auto-rows: min-content;
		gap: 10px;
	}
	.dish {
		position: relative;
		width: 100%;
		min-height: 96px;
		display: grid;
		align-content: space-between;
		gap: 6px;
		padding: 12px;
		border: 0;
		border-radius: 16px;
		background: var(--cream);
		color: var(--ink);
		font: inherit;
		text-align: left;
		cursor: pointer;
		transition: transform 0.08s;
	}
	.dish:active:not(:disabled) {
		transform: scale(0.96);
		background: #fff3c4;
	}
	.dish:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	.dname {
		font-weight: 700;
		line-height: 1.2;
	}
	.dprice {
		color: var(--brand);
		font-weight: 800;
	}
	.qbadge {
		position: absolute;
		top: 8px;
		right: 8px;
		min-width: 26px;
		height: 26px;
		display: grid;
		place-items: center;
		border-radius: 999px;
		background: var(--brand);
		color: var(--cream);
		font-weight: 800;
		font-size: 0.8125rem;
	}

	.bill {
		display: flex;
		flex-direction: column;
		min-height: 0;
		background: var(--cream);
		box-shadow: -1px 0 0 var(--line);
	}
	.bill-head {
		display: grid;
		gap: 8px;
		padding: 14px;
		border-bottom: 1px solid var(--line);
	}
	.where {
		display: block;
		font: 800 1.5rem var(--display);
		text-transform: uppercase;
	}
	.num {
		color: var(--muted);
		font-size: 0.875rem;
		font-weight: 600;
	}
	.guest {
		min-height: 40px;
		padding: 8px 12px;
		border: 0;
		border-radius: 10px;
		background: var(--soft);
		font: 0.9375rem var(--sans);
	}
	.err {
		margin: 10px 14px 0;
		padding: 10px 12px;
		border-radius: 10px;
		background: var(--brand);
		color: var(--cream);
		font-weight: 600;
		font-size: 0.9375rem;
	}
	.lines {
		flex: 1;
		overflow-y: auto;
		list-style: none;
		margin: 0;
		padding: 6px 14px;
	}
	.lines li {
		display: grid;
		grid-template-columns: 1fr auto auto;
		align-items: center;
		gap: 10px;
		padding: 10px 0;
		border-bottom: 1px dashed var(--line);
	}
	.dishes .muted {
		grid-column: 1 / -1;
		padding: 40px 0;
		text-align: center;
		color: var(--muted);
	}
	.lines .none {
		display: block;
		padding: 40px 0;
		border: 0;
		text-align: center;
		color: var(--muted);
	}
	.lname {
		display: grid;
		gap: 2px;
		font-weight: 600;
	}
	.sent {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		color: var(--green);
		font-size: 0.75rem;
		font-weight: 700;
	}
	.qty {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.qty span {
		min-width: 24px;
		text-align: center;
		font-weight: 800;
	}
	.qty button {
		width: 40px;
		height: 40px;
		display: grid;
		place-items: center;
		border: 0;
		border-radius: 12px;
		background: var(--black);
		color: var(--cream);
		cursor: pointer;
	}
	.qty button:disabled {
		background: var(--line);
		color: var(--muted);
		cursor: not-allowed;
	}
	.lamt {
		min-width: 72px;
		text-align: right;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}
	.totals {
		display: grid;
		gap: 6px;
		padding: 12px 14px;
		border-top: 1px solid var(--line);
		font-variant-numeric: tabular-nums;
	}
	.totals div {
		display: flex;
		justify-content: space-between;
	}
	.grand {
		font-size: 1.375rem;
		font-weight: 800;
	}
	.disc {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		font-weight: 600;
	}
	.disc input {
		width: 120px;
		min-height: 40px;
		padding: 6px 10px;
		border: 0;
		border-radius: 10px;
		box-shadow: inset 0 0 0 2px var(--line);
		font: 1rem var(--sans);
		text-align: right;
	}
	.actions {
		display: grid;
		gap: 8px;
		padding: 0 14px 14px;
	}
	.small-acts {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px;
	}
	.act {
		min-height: 52px;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		border: 0;
		border-radius: 14px;
		font: 800 1rem var(--sans);
		cursor: pointer;
	}
	.act:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	.kitchen {
		background: var(--mustard);
		color: var(--black);
	}
	.ghost {
		min-height: 46px;
		background: var(--soft);
		color: var(--ink);
		font-size: 0.875rem;
	}
	.pay {
		min-height: 64px;
		background: var(--brand);
		color: var(--cream);
		font-size: 1.25rem;
	}
	.sheet-bar {
		display: none;
	}
	@media (max-width: 860px) {
		.till {
			grid-template-columns: 1fr;
		}
		.menu {
			padding-bottom: 84px;
		}
		.bill {
			position: fixed;
			inset: auto 0 0;
			z-index: 20;
			height: min(88dvh, 760px);
			border-radius: 20px 20px 0 0;
			box-shadow: 0 -12px 40px rgb(0 0 0 / 0.18);
			translate: 0 calc(100% - 76px);
			transition: translate 0.32s cubic-bezier(0.2, 0.8, 0.2, 1);
		}
		.bill.open {
			translate: 0 0;
		}
		/* The sheet bar already names the ticket. */
		.bill-head > div:first-child {
			display: none;
		}
		.sheet-bar {
			position: relative;
			display: flex;
			flex: none;
			align-items: center;
			gap: 12px;
			height: 76px;
			padding: 14px 16px 10px;
			border: 0;
			border-bottom: 1px solid var(--line);
			background: none;
			font: 600 0.9375rem var(--sans);
			text-align: left;
			cursor: pointer;
		}
		.grip {
			position: absolute;
			top: 6px;
			left: 50%;
			width: 40px;
			height: 4px;
			border-radius: 2px;
			background: var(--line);
			translate: -50% 0;
		}
		.sum {
			display: grid;
			color: var(--muted);
			font-size: 0.8125rem;
		}
		.sum strong {
			color: var(--ink);
			font-size: 1.0625rem;
		}
		.sum-total {
			margin-left: auto;
			font-size: 1.25rem;
		}
		.sheet-cta {
			padding: 10px 14px;
			border-radius: 12px;
			background: var(--brand);
			color: var(--cream);
			font-weight: 700;
		}
	}
</style>

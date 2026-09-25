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
	import { ApiError, message, price, type Item } from '$lib/api';
	import { pos, type Floor, type Ticket } from '$lib/pos';
	import { onMount } from 'svelte';
	import PaySheet from './PaySheet.svelte';

	let { data } = $props();
	const id = $derived(page.params.id!);

	// Local copy of the bill; every change is saved to the API shortly after.
	let ticket = $state<Ticket | null>(null);
	let lines = $state<Record<number, number>>({});
	let discount = $state(0);
	let name = $state('');
	let mode = $state<'dine_in' | 'pickup'>('pickup');
	let tableId = $state<number | null>(null);
	let tableName = $state('');
	let loaded = $state(false);
	let saving = $state(false);
	let error = $state('');
	let paying = $state(false);
	let askDiscount = $state(false);
	let cat = $state<number | 'all'>('all');
	let search = $state('');

	const items = $derived(new Map(data.menu.flatMap((c) => c.items).map((i) => [i.id, i])));
	const sent = $derived(new Map((ticket?.items ?? []).map((l) => [l.id, l.sent])));
	const unitPrice = (itemId: number) =>
		ticket?.items.find((l) => l.id === itemId)?.unit_price ?? items.get(itemId)?.price ?? 0;
	const rows = $derived(
		Object.entries(lines)
			.filter(([, q]) => q > 0)
			.map(([k, q]) => ({
				id: +k,
				qty: q,
				name: items.get(+k)?.name ?? ticket?.items.find((l) => l.id === +k)?.name ?? ''
			}))
	);
	const subtotal = $derived(rows.reduce((s, r) => s + unitPrice(r.id) * r.qty, 0));
	const total = $derived(Math.max(0, subtotal - discount));
	const unsent = $derived(rows.reduce((n, r) => n + r.qty - (sent.get(r.id) ?? 0), 0));
	const paid = $derived(ticket?.paid ?? 0);
	const shown = $derived(
		data.menu
			.filter((c) => cat === 'all' || c.id === cat)
			.flatMap((c) => c.items)
			.filter((i) => i.name.toLowerCase().includes(search.trim().toLowerCase()))
	);

	function adopt(t: Ticket) {
		ticket = t;
		lines = Object.fromEntries(t.items.map((l) => [l.id, l.qty]));
		discount = t.discount;
		name = ['Walk-in', 'Table'].includes(t.name) ? '' : t.name;
		mode = t.mode;
		tableId = t.table_id;
	}

	onMount(async () => {
		try {
			adopt(await pos<Ticket>(`pos/orders/${id}`));
		} catch (e) {
			if (!(e instanceof ApiError && e.code === 'not_found')) error = message(e);
			// A brand-new ticket: the floor says which table (or takeaway).
			const t = page.url.searchParams.get('table');
			mode = t ? 'dine_in' : 'pickup';
			tableId = t ? +t : null;
		}
		if (tableId) {
			const floor = await pos<Floor>('pos/floor').catch(() => null);
			tableName = floor?.tables.find((x) => x.id === tableId)?.name ?? '';
		}
		loaded = true;
	});

	// Saves run one after another so an older save can never land after a newer one.
	let chain = Promise.resolve();
	let timer: ReturnType<typeof setTimeout>;
	function save(now = false) {
		clearTimeout(timer);
		const run = () =>
			(chain = chain.then(async () => {
				saving = true;
				try {
					const t = await pos<Ticket>(`pos/orders/${id}`, {
						method: 'PUT',
						body: JSON.stringify({
							mode,
							table_id: tableId,
							name,
							discount,
							items: rows.map((r) => ({ id: r.id, qty: r.qty }))
						})
					});
					ticket = t;
					error = '';
				} catch (e) {
					error = message(e);
					if (e instanceof ApiError && e.code === 'already_sent')
						error = `${e.details.name} is already in the kitchen, so it can’t go lower.`;
					if (e instanceof ApiError && e.code === 'table_busy')
						error = 'Someone just opened this table on another device. Go back to the floor.';
				} finally {
					saving = false;
				}
			}));
		if (now) return run();
		timer = setTimeout(run, 400);
		return chain;
	}

	function add(item: Item) {
		if (!item.available) return;
		lines[item.id] = (lines[item.id] ?? 0) + 1;
		save();
	}
	function change(itemId: number, by: number) {
		const next = (lines[itemId] ?? 0) + by;
		if (next < (sent.get(itemId) ?? 0)) return;
		lines[itemId] = next;
		save();
	}

	// Prints through a hidden frame so the till never leaves this screen.
	function print(query: string) {
		const f = document.createElement('iframe');
		f.style.cssText = 'position:fixed;width:0;height:0;border:0';
		f.src = `/admin/pos/print/${id}?${query}`;
		document.body.append(f);
		setTimeout(() => f.remove(), 60_000);
	}

	async function sendKitchen() {
		await save(true);
		const kid = crypto.randomUUID();
		try {
			ticket = await pos<Ticket>(`pos/orders/${id}/kitchen`, {
				method: 'POST',
				body: JSON.stringify({ ticket_id: kid })
			});
			print(`kitchen=${kid}`);
		} catch (e) {
			error = message(e);
			if (e instanceof ApiError && e.code === 'nothing_to_send')
				error = 'The kitchen already has everything on this ticket.';
		}
	}

	async function voidTicket() {
		if (!confirm('Void this ticket? It will be cancelled.')) return;
		try {
			await pos(`pos/orders/${id}/void`, { method: 'POST', body: '{}' });
			goto('/admin/pos');
		} catch (e) {
			error = message(e);
			if (e instanceof ApiError && e.code === 'has_payments')
				error = 'Money was already taken on this ticket, so it can’t be voided.';
		}
	}

	async function openPay() {
		await save(true);
		if (!error) paying = true;
	}
</script>

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
				{#each data.menu as c (c.id)}
					<button type="button" role="tab" aria-selected={cat === c.id} onclick={() => (cat = c.id)}
						>{c.name}</button
					>
				{/each}
			</div>
		</div>
		<ul class="dishes">
			{#each shown as item (item.id)}
				<li>
					<button
						type="button"
						class="dish"
						disabled={!item.available || (ticket?.status !== undefined && ticket.status !== 'open')}
						onclick={() => add(item)}
					>
						<span class="dname">{item.name}</span>
						<span class="dprice">{item.available ? price(item.price) : 'Sold out'}</span>
						{#if lines[item.id]}<span class="qbadge">{lines[item.id]}</span>{/if}
					</button>
				</li>
			{/each}
		</ul>
	</section>

	<section class="bill" aria-label="Ticket">
		<div class="bill-head">
			<div>
				<strong class="where">{mode === 'dine_in' ? tableName || 'Table' : 'Takeaway'}</strong>
				<span class="num"
					>{ticket ? `#${ticket.number}` : 'New ticket'} · {saving
						? 'Saving…'
						: ticket
							? 'Saved'
							: 'Not started'}</span
				>
			</div>
			<input
				class="guest"
				bind:value={name}
				onchange={() => save()}
				placeholder="Customer name (optional)"
				aria-label="Customer name"
				maxlength="80"
			/>
		</div>

		{#if error}<p class="err" role="alert">{error}</p>{/if}

		<ul class="lines">
			{#each rows as r (r.id)}
				{@const inKitchen = sent.get(r.id) ?? 0}
				<li>
					<div class="lname">
						<span>{r.name}</span>
						{#if inKitchen}<span class="sent"
								><HugeiconsIcon icon={ChefHatIcon} size={12} /> {inKitchen} in kitchen</span
							>{/if}
					</div>
					<div class="qty">
						<button
							type="button"
							aria-label="One less {r.name}"
							disabled={r.qty <= inKitchen}
							onclick={() => change(r.id, -1)}
						>
							<HugeiconsIcon icon={MinusSignIcon} size={18} />
						</button>
						<span>{r.qty}</span>
						<button type="button" aria-label="One more {r.name}" onclick={() => change(r.id, 1)}>
							<HugeiconsIcon icon={Add01Icon} size={18} />
						</button>
					</div>
					<span class="lamt">{price(unitPrice(r.id) * r.qty)}</span>
				</li>
			{:else}
				<li class="none">{loaded ? 'Tap dishes on the left to add them.' : 'Loading…'}</li>
			{/each}
		</ul>

		<div class="totals">
			<div><span>Subtotal</span><span>{price(subtotal)}</span></div>
			{#if askDiscount}
				<label class="disc">
					Discount (৳)
					<input
						type="number"
						min="0"
						step="1"
						value={discount / 100}
						onchange={(e) => {
							discount = Math.round(Number(e.currentTarget.value) * 100);
							save();
						}}
					/>
				</label>
			{:else if discount}
				<div><span>Discount</span><span>−{price(discount)}</span></div>
			{/if}
			{#if paid}<div><span>Paid so far</span><span>−{price(paid)}</span></div>{/if}
			<div class="grand">
				<span>{paid ? 'Left to pay' : 'Total'}</span><strong>{price(total - paid)}</strong>
			</div>
		</div>

		<div class="actions">
			<button type="button" class="act kitchen" disabled={!unsent || saving} onclick={sendKitchen}>
				<HugeiconsIcon icon={ChefHatIcon} size={20} />
				{unsent ? `Send ${unsent} to kitchen` : 'Kitchen has it all'}
			</button>
			<div class="small-acts">
				<button
					type="button"
					class="act ghost"
					disabled={!rows.length}
					onclick={() => print('bill=1')}
				>
					<HugeiconsIcon icon={PrinterIcon} size={18} /> Bill
				</button>
				<button type="button" class="act ghost" onclick={() => (askDiscount = !askDiscount)}>
					<HugeiconsIcon icon={DiscountIcon} size={18} /> Discount
				</button>
				<button type="button" class="act ghost" disabled={!ticket || paid > 0} onclick={voidTicket}>
					<HugeiconsIcon icon={Delete02Icon} size={18} /> Void
				</button>
			</div>
			<button
				type="button"
				class="act pay"
				disabled={!rows.length || total - paid <= 0 || saving}
				onclick={openPay}
			>
				Pay {price(total - paid)}
			</button>
		</div>
	</section>
</div>

{#if paying && ticket}
	<PaySheet
		{ticket}
		onclose={() => (paying = false)}
		onpaid={(t) => {
			ticket = t;
			if (t.status === 'completed') print('bill=1');
		}}
		ondone={() => goto('/admin/pos')}
	/>
{/if}

<style>
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
	@media (max-width: 860px) {
		.till {
			grid-template-columns: 1fr;
			grid-template-rows: 1fr 1fr;
		}
	}
</style>

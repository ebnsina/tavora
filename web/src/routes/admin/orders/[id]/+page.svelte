<script lang="ts">
	import { enhance } from '$app/forms';
	import { price } from '$lib/api';
	import PageHeader from '$lib/admin/PageHeader.svelte';

	let { data, form: raw } = $props();
	// The status buttons post to the orders list's action; its error lands here.
	const form = $derived(raw as { error?: string } | null);
	const o = $derived(data.order);

	const labels: Record<string, string> = {
		open: 'Open at the till',
		new: 'New',
		accepted: 'Accepted',
		preparing: 'Cooking',
		ready: 'Ready',
		out_for_delivery: 'On the way',
		completed: 'Done',
		cancelled: 'Cancelled'
	};
	const modes = { delivery: 'Delivery', pickup: 'Pickup', dine_in: 'Dine-in' };
	const methods: Record<string, string> = {
		cash: 'Cash',
		card: 'Card',
		bkash: 'bKash',
		nagad: 'Nagad'
	};
	const when = new Intl.DateTimeFormat('en-GB', {
		weekday: 'short',
		day: 'numeric',
		month: 'short',
		hour: 'numeric',
		minute: '2-digit',
		timeZone: 'Asia/Dhaka'
	});
	const tips = $derived(o.payments.reduce((s, p) => s + p.tip, 0));

	// Same next steps as the orders list; POS tickets are handled at the till.
	const next = $derived(
		o.source !== 'online'
			? null
			: ((
					{
						new: ['accepted', 'Accept'],
						accepted: ['preparing', 'Start cooking'],
						preparing: ['ready', 'Mark ready'],
						ready:
							o.mode === 'delivery'
								? ['out_for_delivery', 'Send with rider']
								: ['completed', 'Handed over'],
						out_for_delivery: ['completed', 'Delivered & paid']
					} as Record<string, [string, string]>
				)[o.status] ?? null)
	);
	const closed = $derived(o.status === 'completed' || o.status === 'cancelled');
</script>

<svelte:head><title>TV-{o.number} · Orders · Tavora</title></svelte:head>

<PageHeader
	title="Order TV-{o.number}"
	sub="{when.format(new Date(o.created_at))} · {o.source === 'pos'
		? 'Taken at the till'
		: 'Ordered online'}"
>
	{#snippet actions()}
		<a class="btn ghost small" href="/admin/orders">All orders</a>
		{#if o.source === 'pos' && o.status === 'open'}
			<a class="btn primary small" href="/admin/pos/ticket/{o.id}">Open at the till</a>
		{/if}
		{#if o.source === 'online' && (next || !closed)}
			<form method="POST" action="/admin/orders?/status" use:enhance class="row">
				<input type="hidden" name="id" value={o.id} />
				{#if next}<button class="btn primary small" name="status" value={next[0]}>{next[1]}</button
					>{/if}
				{#if !closed}<button class="btn ghost small" name="status" value="cancelled">Cancel</button
					>{/if}
			</form>
		{/if}
	{/snippet}
</PageHeader>

{#if form?.error}<p class="flash bad" role="alert">{form.error}</p>{/if}

<div class="layout">
	<section class="card">
		<h2>Dishes</h2>
		<ul class="lines">
			{#each o.items as l (l.id)}
				<li>
					<span
						>{l.qty} × {l.name} <small>{price(l.unit_price)} each</small>{#if l.note}<small
								class="note">Note: {l.note}</small
							>{/if}</span
					>
					<span>{price(l.amount)}</span>
				</li>
			{/each}
		</ul>
		<dl class="sums">
			<dt>Subtotal</dt>
			<dd>{price(o.subtotal)}</dd>
			{#if o.delivery_fee}<dt>Delivery</dt>
				<dd>{price(o.delivery_fee)}</dd>{/if}
			{#if o.discount}<dt>Discount</dt>
				<dd>−{price(o.discount)}</dd>{/if}
			<dt class="total">Total</dt>
			<dd class="total">{price(o.total)}</dd>
		</dl>
	</section>

	<div class="side">
		<section class="card">
			<h2>Details</h2>
			<dl class="facts">
				<dt>Status</dt>
				<dd><span class="badge {o.status}">{labels[o.status] ?? o.status}</span></dd>
				<dt>Type</dt>
				<dd>
					{[modes[o.mode], o.table].filter(Boolean).join(' · ')}
				</dd>
				<dt>Customer</dt>
				<dd>{o.name || 'Walk-in'}</dd>
				{#if o.phone}<dt>Phone</dt>
					<dd><a href="tel:{o.phone}">{o.phone}</a></dd>{/if}
				{#if o.address}<dt>Address</dt>
					<dd>{o.address}</dd>{/if}
				{#if o.created_by}<dt>Opened by</dt>
					<dd>{o.created_by}</dd>{/if}
				{#if o.voided_by}<dt>Voided by</dt>
					<dd>{o.voided_by}</dd>{/if}
				{#if o.note}<dt>Note</dt>
					<dd>{o.note}</dd>{/if}
			</dl>
		</section>

		<section class="card">
			<h2>Payment</h2>
			{#if o.payments.length}
				<ul class="lines">
					{#each o.payments as p (p.id)}
						<li>
							<span
								>{methods[p.method] ?? p.method}
								<small
									>{[
										when.format(new Date(p.created_at)),
										p.reference,
										p.tip && `tip ${price(p.tip)}`,
										p.taken_by && `by ${p.taken_by}`
									]
										.filter(Boolean)
										.join(' · ')}</small
								></span
							>
							<span>{price(p.amount)}</span>
						</li>
					{/each}
				</ul>
				<dl class="sums">
					<dt>Paid</dt>
					<dd>{price(o.paid)}</dd>
					{#if tips}<dt>Tips</dt>
						<dd>{price(tips)}</dd>{/if}
					{#if o.due > 0 && o.status !== 'cancelled'}<dt class="total">Still due</dt>
						<dd class="total">{price(o.due)}</dd>{/if}
				</dl>
			{:else if o.source === 'online'}
				<p class="muted">
					Cash on {o.mode === 'delivery' ? 'delivery' : 'pickup'}: {price(o.total)}{closed
						? ''
						: ' to collect'}.
				</p>
			{:else}
				<p class="muted">Nothing paid yet.</p>
			{/if}
		</section>
	</div>
</div>

<style>
	.layout {
		display: grid;
		gap: 16px;
		align-items: start;
	}
	@media (min-width: 900px) {
		.layout {
			grid-template-columns: 3fr 2fr;
		}
	}
	.side {
		display: grid;
		gap: 16px;
	}
	h2 {
		margin: 0 0 12px;
		font-size: 1.25rem;
	}
	.lines {
		display: grid;
		gap: 10px;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.lines li {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		font-weight: 600;
	}
	.lines small {
		display: block;
		color: var(--muted);
		font-weight: 500;
	}
	dl {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 8px 16px;
		margin: 0;
	}
	.sums {
		margin-top: 16px;
		padding-top: 12px;
		border-top: 1px dashed var(--line);
	}
	.sums dd {
		text-align: right;
	}
	dt {
		color: var(--muted);
	}
	dd {
		margin: 0;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}
	.total {
		color: var(--ink);
		font-size: 1.125rem;
		font-weight: 800;
	}
	.lines .note {
		color: var(--brand);
		font-style: italic;
	}
	.muted {
		margin: 0;
		color: var(--muted);
	}
	.badge {
		padding: 3px 10px;
		border-radius: 999px;
		background: var(--soft);
		font-size: 0.8125rem;
	}
	.badge.new {
		background: var(--brand);
		color: var(--cream);
	}
	.badge.completed {
		background: #e6f4ea;
	}
	.badge.cancelled {
		background: #fde4e1;
	}
</style>

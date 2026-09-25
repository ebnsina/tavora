<script lang="ts">
	import { price } from '$lib/api';
	import { onMount } from 'svelte';

	let { data } = $props();
	const t = $derived(data.ticket);
	const r = $derived(data.restaurant);
	const stamp = new Intl.DateTimeFormat('en-GB', {
		dateStyle: 'medium',
		timeStyle: 'short',
		timeZone: 'Asia/Dhaka'
	});
	const methods: Record<string, string> = {
		cash: 'Cash',
		card: 'Card',
		bkash: 'bKash',
		nagad: 'Nagad'
	};
	const where = $derived(
		data.table ? `Table ${data.table}` : t.mode === 'pickup' ? 'Takeaway' : 'Delivery'
	);
	const tips = $derived(t.payments.reduce((s, p) => s + p.tip, 0));

	// Opened in a hidden frame by the till; print as soon as it's drawn.
	onMount(() => setTimeout(() => print(), 200));
</script>

<svelte:head><title>{data.kitchen ? 'Kitchen ticket' : 'Bill'} #{t.number}</title></svelte:head>

<main class="slip">
	{#if data.kitchen}
		<h1>KITCHEN</h1>
		<p class="big">{where}</p>
		<p>#{t.number} · {stamp.format(new Date(data.kitchen.created_at))}</p>
		<hr />
		{#each data.kitchen.lines as l, i (i)}
			<p class="kline"><b>{l.qty} ×</b> {l.name}</p>
		{/each}
		{#if t.note}<hr />
			<p><b>Note:</b> {t.note}</p>{/if}
	{:else}
		<h1>{r.name.toUpperCase()}</h1>
		<p class="center">{r.address}<br />{r.phone}</p>
		<hr />
		<p>{where} · #{t.number}</p>
		<p>{stamp.format(new Date(t.created_at))}</p>
		{#if !['Walk-in', 'Table'].includes(t.name)}<p>{t.name}</p>{/if}
		<hr />
		{#each t.items as l (l.id)}
			<div class="row"><span>{l.qty} × {l.name}</span><span>{price(l.amount)}</span></div>
		{/each}
		<hr />
		<div class="row"><span>Subtotal</span><span>{price(t.subtotal)}</span></div>
		{#if t.discount}<div class="row">
				<span>Discount</span><span>−{price(t.discount)}</span>
			</div>{/if}
		<div class="row total"><span>TOTAL</span><span>{price(t.total)}</span></div>
		{#if t.payments.length}
			<hr />
			{#each t.payments as p (p.id)}
				<div class="row">
					<span>{methods[p.method]}{p.reference ? ` (${p.reference})` : ''}</span><span
						>{price(p.amount)}</span
					>
				</div>
			{/each}
			{#if tips}<div class="row"><span>Tip, thank you!</span><span>{price(tips)}</span></div>{/if}
			<div class="row">
				<span>{t.due > 0 ? 'Left to pay' : 'PAID'}</span><span>{price(t.due)}</span>
			</div>
		{/if}
		<hr />
		<p class="center">Thank you for eating with us!</p>
	{/if}
</main>

<style>
	@page {
		size: 80mm auto;
		margin: 4mm;
	}
	:global(body) {
		background: #fff;
	}
	.slip {
		width: 72mm;
		margin: 0 auto;
		color: #000;
		font:
			12px/1.35 ui-monospace,
			monospace;
	}
	h1 {
		margin: 0 0 4px;
		text-align: center;
		font:
			800 18px ui-monospace,
			monospace;
	}
	p {
		margin: 2px 0;
	}
	.center {
		text-align: center;
	}
	.big {
		font-size: 20px;
		font-weight: 800;
		text-align: center;
	}
	.kline {
		font-size: 16px;
		margin: 4px 0;
	}
	hr {
		border: 0;
		border-top: 1px dashed #000;
		margin: 6px 0;
	}
	.row {
		display: flex;
		justify-content: space-between;
		gap: 8px;
	}
	.total {
		font-size: 15px;
		font-weight: 800;
	}
</style>

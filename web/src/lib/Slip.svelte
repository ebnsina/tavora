<script lang="ts">
	import { price, vatPct, type Restaurant } from '$lib/api';
	import type { Ticket } from '$lib/pos';
	import { portal } from '$lib/portal';

	// Printed straight from the tablet's own data, so bills and kitchen tickets work offline.
	let {
		ticket: t,
		restaurant: r,
		table,
		kitchen
	}: {
		ticket: Ticket;
		restaurant: Restaurant | null;
		table: string;
		kitchen?: { name: string; qty: number; note?: string | null }[];
	} = $props();

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
		table ? `Table ${table}` : (t.mode as string) === 'delivery' ? 'Delivery' : 'Takeaway'
	);
	// A VAT-registered restaurant's bill is its Mushak-6.3 tax invoice.
	const taxInvoice = $derived(!!r?.vat?.bin && t.vat_rate > 0);
	// Tickets rung up offline get their number from the server later; print a short code meanwhile.
	const ref = $derived(t.number ? `#${t.number}` : `Offline ${t.id.slice(0, 6).toUpperCase()}`);
	const tips = $derived(t.payments.reduce((s, p) => s + p.tip, 0));
</script>

<div class="slip" aria-hidden="true" use:portal>
	{#if kitchen}
		<h1>KITCHEN</h1>
		<p class="big">{where}</p>
		<p>{ref} · {stamp.format(new Date())}</p>
		<hr />
		{#each kitchen as l, i (i)}<p class="kline"><b>{l.qty} ×</b> {l.name}</p>
			{#if l.note}<p class="knote">» {l.note}</p>{/if}{/each}
		{#if t.note}<hr />
			<p><b>Note:</b> {t.note}</p>{/if}
	{:else}
		<h1>{(r?.name ?? 'Tavora').toUpperCase()}</h1>
		{#if r}<p class="center">{r.address}<br />{r.phone}</p>{/if}
		{#if taxInvoice}
			<p class="center"><b>BIN {r?.vat.bin}</b></p>
			<p class="center big-sm">VAT INVOICE (MUSHAK-6.3)</p>
		{/if}
		<hr />
		<p>{taxInvoice ? 'Invoice' : where} {ref}{taxInvoice ? ` · ${where}` : ''}</p>
		<p>{stamp.format(new Date(t.created_at))}</p>
		{#if t.name && !['Walk-in', 'Table'].includes(t.name)}<p>{t.name}</p>{/if}
		<hr />
		{#each t.items as l (l.id)}
			<p class="iname">{l.name}</p>
			<div class="row sub">
				<span>{l.qty} × {price(l.unit_price)}</span><span>{price(l.amount)}</span>
			</div>
		{/each}
		<hr />
		<div class="row"><span>Subtotal</span><span>{price(t.subtotal)}</span></div>
		{#if t.discount}<div class="row">
				<span>Discount</span><span>−{price(t.discount)}</span>
			</div>{/if}
		{#if t.vat}
			<div class="row">
				<span>VAT {vatPct(t.vat_rate)}{t.vat_inclusive ? ' (included)' : ''}</span><span
					>{price(t.vat)}</span
				>
			</div>
		{/if}
		{#if (t as { delivery_fee?: number }).delivery_fee}
			<div class="row">
				<span>Delivery</span><span>{price((t as { delivery_fee?: number }).delivery_fee!)}</span>
			</div>
		{/if}
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
				<span>{t.due > 0 ? 'Left to pay' : 'PAID'}</span><span>{price(Math.max(0, t.due))}</span>
			</div>
		{/if}
		<hr />
		<p class="center">Thank you for eating with us!</p>
		<p class="center made">Made with Tavora</p>
	{/if}
</div>

<style>
	.slip {
		display: none;
	}
	/* Only the slip prints; the receipt printer's own paper setting (80 mm roll) sets the page. */
	@media print {
		@page {
			margin: 3mm;
		}
		:global(body > *:not(.slip)) {
			display: none !important;
		}
		:global(html),
		:global(body) {
			background: #fff !important;
			margin: 0 !important;
		}
		.slip {
			display: block;
			width: 72mm;
			color: #000;
			background: #fff;
			font:
				12px/1.35 ui-monospace,
				monospace;
		}
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
	.made {
		margin-top: 6px;
		font-size: 10px;
	}
	.big {
		font-size: 20px;
		font-weight: 800;
		text-align: center;
	}
	.big-sm {
		font-weight: 800;
		letter-spacing: 0.04em;
	}
	.iname {
		margin: 4px 0 0;
	}
	.row.sub {
		padding-left: 12px;
	}
	.kline {
		font-size: 16px;
		margin: 4px 0;
	}
	.knote {
		margin: 0 0 6px 16px;
		font-size: 14px;
		font-weight: 700;
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

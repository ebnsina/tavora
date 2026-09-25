<script lang="ts">
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		Cancel01Icon,
		Cash01Icon,
		PrinterIcon,
		UserGroupIcon,
		Wallet01Icon
	} from '@hugeicons/core-free-icons';
	import Tabs from '$lib/admin/Tabs.svelte';
	import RangePicker from '$lib/admin/RangePicker.svelte';
	import { goto } from '$app/navigation';
	import PageHeader from '$lib/admin/PageHeader.svelte';
	import { price } from '$lib/api';

	let { data } = $props();
	let tab = $state('payments');
	const bdDay = (n: number) =>
		new Date(Date.now() - n * 86_400_000).toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });
	const presets = [
		{ key: 'today', label: 'Today', from: bdDay(0), to: bdDay(0) },
		{ key: 'yesterday', label: 'Yesterday', from: bdDay(1), to: bdDay(1) }
	];
	const r = $derived(data.report);

	const names = { cash: 'Cash', card: 'Card', bkash: 'bKash', nagad: 'Nagad' };
	const long = new Intl.DateTimeFormat('en-GB', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	});
	const clock = new Intl.DateTimeFormat('en-US', {
		hour: 'numeric',
		minute: '2-digit',
		timeZone: 'Asia/Dhaka'
	});
	const cash = $derived(r.methods.find((m) => m.method === 'cash'));
	const other = $derived(
		r.methods.filter((m) => m.method !== 'cash').reduce((s, m) => s + m.amount, 0)
	);
	const printed = new Intl.DateTimeFormat('en-GB', {
		dateStyle: 'medium',
		timeStyle: 'short',
		timeZone: 'Asia/Dhaka'
	});
	const tips = $derived(r.methods.reduce((s, m) => s + m.tips, 0));
	const taken = $derived(r.methods.reduce((s, m) => s + m.amount, 0) + r.online.cash);
</script>

<svelte:head><title>End of day · Tavora</title></svelte:head>

<div class="screen">
	<PageHeader title="End of day" sub={long.format(new Date(`${r.date}T00:00`))}>
		{#snippet actions()}
			<RangePicker
				mode="single"
				from={r.date}
				to={r.date}
				{presets}
				active={presets.find((p) => p.from === r.date)?.key}
				onchange={(v) => goto(`?date=${v.from}`)}
			/>
			<button class="btn primary small" type="button" onclick={() => print()}
				><HugeiconsIcon icon={PrinterIcon} size={16} /> Print</button
			>
		{/snippet}
	</PageHeader>

	{#if data.dateError}<p class="flash bad" role="alert">{data.dateError}</p>{/if}
	{#if r.open.count}
		<p class="flash bad" role="alert">
			{r.open.count} ticket{r.open.count === 1 ? ' is' : 's are'} still open ({price(
				r.open.total
			)}). Take payment or void {r.open.count === 1 ? 'it' : 'them'} before counting the drawer.
		</p>
	{/if}

	<section class="tiles" aria-label="Totals">
		<div class="card tile">
			<span class="label">Cash that should be in the drawer</span>
			<strong class="value">{price(r.drawer)}</strong>
			<span class="small">Till cash + cash tips + online orders paid in cash</span>
		</div>
		<div class="card tile">
			<span class="label">Taken in total</span>
			<strong class="value">{price(taken)}</strong>
		</div>
		<div class="card tile">
			<span class="label">Card, bKash and Nagad</span>
			<strong class="value">{price(other)}</strong>
		</div>
		<div class="card tile">
			<span class="label">Tips</span>
			<strong class="value">{price(tips)}</strong>
		</div>
		<div class="card tile">
			<span class="label">VAT collected</span>
			<strong class="value">{price(r.vat)}</strong>
			<span class="small">On bills closed this day</span>
		</div>
	</section>

	<Tabs
		label="Report"
		bind:active={tab}
		tabs={[
			{ id: 'payments', label: 'Payments', icon: Wallet01Icon },
			{ id: 'drawer', label: 'Cash drawer', icon: Cash01Icon },
			{ id: 'staff', label: 'By staff', icon: UserGroupIcon, count: r.staff.length },
			{ id: 'voids', label: 'Discounts & voids', icon: Cancel01Icon, count: r.voids.length }
		]}
	/>

	<section class="card panel" id="panel-payments" hidden={tab !== 'payments'}>
		<h2>How people paid</h2>
		<table>
			<thead><tr><th>Method</th><th>Payments</th><th>Amount</th><th>Tips</th></tr></thead>
			<tbody>
				{#each r.methods as m (m.method)}
					<tr>
						<td>{names[m.method]}</td>
						<td>{m.count}</td>
						<td>{price(m.amount)}</td>
						<td>{price(m.tips)}</td>
					</tr>
				{/each}
				<tr>
					<td>Online orders, cash on delivery or pickup</td>
					<td>{r.online.count}</td>
					<td>{price(r.online.cash)}</td>
					<td>–</td>
				</tr>
			</tbody>
		</table>
	</section>

	<section class="card panel" id="panel-drawer" hidden={tab !== 'drawer'}>
		<h2>Counting the drawer</h2>
		<dl>
			<dt>Cash taken at the till</dt>
			<dd>{price(cash?.amount ?? 0)}</dd>
			<dt>Cash tips</dt>
			<dd>{price(cash?.tips ?? 0)}</dd>
			<dt>Cash from online orders</dt>
			<dd>{price(r.online.cash)}</dd>
			<dt class="total">Should be in the drawer</dt>
			<dd class="total">{price(r.drawer)}</dd>
		</dl>
	</section>

	<section class="card panel" id="panel-staff" hidden={tab !== 'staff'}>
		<h2>By staff</h2>
		{#if r.staff.length}
			<table>
				<thead><tr><th>Name</th><th>Payments</th><th>Amount</th><th>Tips</th></tr></thead>
				<tbody>
					{#each r.staff as s (s.name)}
						<tr
							><td>{s.name}</td><td>{s.count}</td><td>{price(s.amount)}</td><td>{price(s.tips)}</td
							></tr
						>
					{/each}
				</tbody>
			</table>
		{:else}
			<p class="muted">No payments at the till this day.</p>
		{/if}
	</section>

	<section class="card panel" id="panel-voids" hidden={tab !== 'voids'}>
		<h2>Discounts</h2>
		<p class="muted">
			{r.discounts.count
				? `${price(r.discounts.amount)} off across ${r.discounts.count} bill${r.discounts.count === 1 ? '' : 's'}`
				: 'No discounts given.'}
		</p>

		<h3>Voided tickets</h3>
		{#if r.voids.length}
			<table>
				<thead><tr><th>Ticket</th><th>Time</th><th>Amount</th><th>Voided by</th></tr></thead>
				<tbody>
					{#each r.voids as v (v.id)}
						<tr>
							<td><a href="/admin/orders/{v.id}">TV-{v.number}</a></td>
							<td>{clock.format(new Date(v.created_at))}</td>
							<td>{price(v.total)}</td>
							<td>{v.voided_by || 'Not recorded'}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{:else}
			<p class="muted">Nothing voided.</p>
		{/if}
	</section>
</div>

<!-- Printed instead of the screen: a plain A4 sheet to count the drawer against and sign. -->
<article class="doc" aria-hidden="true">
	<header>
		<div>
			<h1>{data.restaurant.name}</h1>
			<p>{data.restaurant.address}</p>
			{#if data.restaurant.vat.bin}<p>BIN {data.restaurant.vat.bin}</p>{/if}
		</div>
		<div class="right">
			<h2>End of day report</h2>
			<p>{long.format(new Date(`${r.date}T00:00`))}</p>
			<p>Printed {printed.format(new Date())}</p>
		</div>
	</header>

	{#if r.open.count}
		<p class="warn">
			Warning: {r.open.count} ticket{r.open.count === 1 ? ' was' : 's were'} still open ({price(
				r.open.total
			)}) when this was printed.
		</p>
	{/if}

	<h3>Summary</h3>
	<table>
		<tbody>
			<tr><td>Taken in total</td><td>{price(taken)}</td></tr>
			<tr><td>Card, bKash and Nagad</td><td>{price(other)}</td></tr>
			<tr><td>Tips</td><td>{price(tips)}</td></tr>
			<tr><td>Discounts ({r.discounts.count} bills)</td><td>−{price(r.discounts.amount)}</td></tr>
			<tr><td>VAT collected</td><td>{price(r.vat)}</td></tr>
		</tbody>
	</table>

	<h3>Payments by method</h3>
	<table>
		<thead><tr><th>Method</th><th>Payments</th><th>Amount</th><th>Tips</th></tr></thead>
		<tbody>
			{#each r.methods as m (m.method)}
				<tr>
					<td>{names[m.method]}</td><td>{m.count}</td><td>{price(m.amount)}</td><td
						>{price(m.tips)}</td
					>
				</tr>
			{/each}
			<tr>
				<td>Online orders (cash)</td><td>{r.online.count}</td><td>{price(r.online.cash)}</td><td
					>–</td
				>
			</tr>
		</tbody>
	</table>

	<h3>Cash drawer</h3>
	<table>
		<tbody>
			<tr><td>Cash taken at the till</td><td>{price(cash?.amount ?? 0)}</td></tr>
			<tr><td>Cash tips</td><td>{price(cash?.tips ?? 0)}</td></tr>
			<tr><td>Cash from online orders</td><td>{price(r.online.cash)}</td></tr>
			<tr class="strong"><td>Should be in the drawer</td><td>{price(r.drawer)}</td></tr>
			<tr><td>Actually counted</td><td class="blank"></td></tr>
			<tr><td>Difference</td><td class="blank"></td></tr>
		</tbody>
	</table>

	{#if r.staff.length}
		<h3>By staff</h3>
		<table>
			<thead><tr><th>Name</th><th>Payments</th><th>Amount</th><th>Tips</th></tr></thead>
			<tbody>
				{#each r.staff as s (s.name)}
					<tr
						><td>{s.name}</td><td>{s.count}</td><td>{price(s.amount)}</td><td>{price(s.tips)}</td
						></tr
					>
				{/each}
			</tbody>
		</table>
	{/if}

	<h3>Voided tickets</h3>
	{#if r.voids.length}
		<table>
			<thead><tr><th>Ticket</th><th>Time</th><th>Amount</th><th>Voided by</th></tr></thead>
			<tbody>
				{#each r.voids as v (v.id)}
					<tr
						><td>TV-{v.number}</td><td>{clock.format(new Date(v.created_at))}</td><td
							>{price(v.total)}</td
						><td>{v.voided_by || 'Not recorded'}</td></tr
					>
				{/each}
			</tbody>
		</table>
	{:else}
		<p>None.</p>
	{/if}

	<div class="sign">
		<p>Counted by</p>
		<p>Checked by</p>
	</div>
</article>

<style>
	.tiles {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
		gap: 14px;
		margin-bottom: 14px;
	}
	.tile {
		display: grid;
		gap: 6px;
		align-content: start;
	}
	.label {
		color: var(--muted);
		font-weight: 600;
		font-size: 0.875rem;
	}
	.value {
		font-size: 1.75rem;
		font-weight: 800;
	}
	.small {
		font-size: 0.8125rem;
	}
	@media (min-width: 1000px) {
	}
	.panel {
		max-width: 860px;
	}
	h2 {
		margin: 0 0 12px;
		font-size: 1.125rem;
	}
	h3 {
		margin: 22px 0 8px;
		font-size: 0.9375rem;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-variant-numeric: tabular-nums;
	}
	th,
	td {
		padding: 9px 10px;
		border-bottom: 1px solid var(--line);
		text-align: right;
	}
	th:first-child,
	td:first-child {
		text-align: left;
	}
	thead th {
		color: var(--muted);
		font-size: 0.8125rem;
		font-weight: 600;
	}
	dl {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 8px 16px;
		margin: 0;
	}
	dt {
		color: var(--muted);
	}
	dd {
		margin: 0;
		font-weight: 600;
		text-align: right;
		font-variant-numeric: tabular-nums;
	}
	.total {
		padding-top: 8px;
		border-top: 1px dashed var(--line);
		color: var(--ink);
		font-weight: 800;
	}
	.muted {
		margin: 0;
		color: var(--muted);
	}
	.doc {
		display: none;
	}
	@media print {
		@page {
			size: A4;
			margin: 16mm;
		}
		:global(aside),
		:global(.topbar),
		:global(.page-head),
		.screen {
			display: none !important;
		}
		:global(main),
		:global(.body),
		:global(.shell) {
			display: block !important;
			margin: 0 !important;
			padding: 0 !important;
			background: #fff !important;
		}
		.doc {
			display: block;
			color: #000;
			font: 10.5pt/1.4 var(--sans);
		}
		.doc header {
			display: flex;
			justify-content: space-between;
			gap: 24px;
			padding-bottom: 10px;
			border-bottom: 2px solid #000;
		}
		.doc h1 {
			margin: 0;
			font-size: 18pt;
		}
		.doc h2 {
			margin: 0;
			font-size: 13pt;
		}
		.doc .right {
			text-align: right;
		}
		.doc p {
			margin: 2px 0;
		}
		.doc h3 {
			margin: 16px 0 6px;
			font-size: 11pt;
			text-transform: uppercase;
			letter-spacing: 0.04em;
		}
		.doc table {
			width: 100%;
			border-collapse: collapse;
			break-inside: avoid;
		}
		.doc th,
		.doc td {
			padding: 5px 6px;
			border-bottom: 1px solid #999;
			text-align: right;
		}
		.doc th:first-child,
		.doc td:first-child {
			text-align: left;
		}
		.doc th {
			font-weight: 700;
			border-bottom: 1.5px solid #000;
		}
		.doc .strong td {
			font-weight: 800;
			border-top: 1.5px solid #000;
		}
		.doc .blank {
			height: 26px;
		}
		.doc .warn {
			margin-top: 10px;
			padding: 6px 8px;
			border: 1.5px solid #000;
			font-weight: 700;
		}
		.doc .sign {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 40px;
			margin-top: 48px;
			break-inside: avoid;
		}
		.doc .sign p {
			padding-top: 6px;
			border-top: 1px solid #000;
		}
	}
</style>

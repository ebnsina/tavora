<script lang="ts">
	import DatePicker from '$lib/admin/DatePicker.svelte';
	import PageHeader from '$lib/admin/PageHeader.svelte';
	import { price } from '$lib/api';

	let { data } = $props();
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
	const tips = $derived(r.methods.reduce((s, m) => s + m.tips, 0));
	const taken = $derived(r.methods.reduce((s, m) => s + m.amount, 0) + r.online.cash);
</script>

<svelte:head><title>End of day · Tavora</title></svelte:head>

<PageHeader title="End of day" sub={long.format(new Date(`${r.date}T00:00`))}>
	{#snippet actions()}
		<form method="GET" class="pick">
			<DatePicker name="date" value={r.date} label="Day" />
			<button class="btn small">Show</button>
		</form>
		<button class="btn primary small" type="button" onclick={() => print()}>Print</button>
	{/snippet}
</PageHeader>

{#if data.dateError}<p class="flash bad" role="alert">{data.dateError}</p>{/if}
{#if r.open.count}
	<p class="flash bad" role="alert">
		{r.open.count} ticket{r.open.count === 1 ? ' is' : 's are'} still open ({price(r.open.total)}).
		Take payment or void {r.open.count === 1 ? 'it' : 'them'} before counting the drawer.
	</p>
{/if}

<section class="tiles" aria-label="Totals">
	<div class="card tile hero">
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
</section>

<div class="grid">
	<section class="card">
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
		<h3>Counting the drawer</h3>
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

	<section class="card">
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

		<h3>Discounts</h3>
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

<style>
	.pick {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.tiles {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
	.tile.hero {
		background: var(--black);
		color: var(--cream);
	}
	.hero .label,
	.hero .small {
		color: rgb(255 249 231 / 0.65);
	}
	.small {
		font-size: 0.8125rem;
	}
	.hero .value {
		font-size: clamp(2.25rem, 4vw, 3rem);
		line-height: 1;
	}
	.grid {
		display: grid;
		gap: 14px;
		align-items: start;
	}
	@media (min-width: 1000px) {
		.grid {
			grid-template-columns: 1fr 1fr;
		}
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
	@media print {
		:global(aside),
		:global(.topbar),
		.pick,
		:global(.page-head .actions) {
			display: none !important;
		}
	}
</style>

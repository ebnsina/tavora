<script lang="ts">
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		ArrowDown01Icon,
		ArrowRight02Icon,
		ArrowUp01Icon,
		ChartColumnIcon,
		Search01Icon,
		Table01Icon
	} from '@hugeicons/core-free-icons';
	import ColumnChart from '$lib/admin/ColumnChart.svelte';
	import DatePicker from '$lib/admin/DatePicker.svelte';
	import PageHeader from '$lib/admin/PageHeader.svelte';
	import { price, time } from '$lib/api';
	import { onMount } from 'svelte';

	let { data } = $props();
	const s = $derived(data.stats);

	const greeting = $derived(
		data.hour < 12 ? 'Good morning' : data.hour < 17 ? 'Good afternoon' : 'Good evening'
	);
	const first = $derived(data.admin?.name.split(' ')[0] ?? '');

	const fmtDay = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
	// Live clock for the header, in restaurant time.
	let now = $state(new Date());
	onMount(() => {
		const t = setInterval(() => (now = new Date()), 15_000);
		return () => clearInterval(t);
	});
	const clock = new Intl.DateTimeFormat('en-GB', {
		weekday: 'short',
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
		hour12: true,
		timeZone: 'Asia/Dhaka'
	});
	const fmtLong = new Intl.DateTimeFormat('en-GB', {
		weekday: 'short',
		day: 'numeric',
		month: 'short'
	});
	const d = (iso: string) => new Date(`${iso}T00:00`);
	const rangeLabel = $derived(
		s.from === s.to
			? fmtLong.format(d(s.from))
			: `${fmtDay.format(d(s.from))} – ${fmtDay.format(d(s.to))}`
	);
	const count = new Intl.NumberFormat('en-BD');
	const pct = new Intl.NumberFormat('en', {
		style: 'percent',
		maximumFractionDigits: 0,
		signDisplay: 'exceptZero'
	});

	const avg = (p: typeof s.totals) => (p.orders ? Math.round(p.revenue / p.orders) : 0);
	// Change against the previous period of the same length; `upIsGood` decides the colour.
	function delta(now: number, before: number, upIsGood = true) {
		if (!before) return null;
		const change = (now - before) / before;
		return {
			text: pct.format(change),
			up: change > 0,
			good: change === 0 ? null : change > 0 === upIsGood
		};
	}
	const tiles = $derived([
		{
			label: 'Revenue',
			value: price(s.totals.revenue),
			delta: delta(s.totals.revenue, s.previous.revenue)
		},
		{
			label: 'Orders',
			value: count.format(s.totals.orders),
			delta: delta(s.totals.orders, s.previous.orders)
		},
		{
			label: 'Average order',
			value: price(avg(s.totals)),
			delta: delta(avg(s.totals), avg(s.previous))
		},
		{
			label: 'Cancelled',
			value: count.format(s.totals.cancelled),
			delta: delta(s.totals.cancelled, s.previous.cancelled, false)
		}
	]);

	let view = $state<'chart' | 'table'>('chart');
	const points = $derived(
		s.days.map((day) => ({
			label: fmtDay.format(d(day.date)),
			tip: `${fmtLong.format(d(day.date))} · ${day.orders} orders`,
			value: day.revenue / 100,
			display: price(day.revenue)
		}))
	);

	const openLabels: Record<string, string> = {
		new: 'New',
		accepted: 'Accepted',
		preparing: 'Cooking',
		ready: 'Ready',
		out_for_delivery: 'On the way'
	};
	const openTotal = $derived(Object.values(s.open).reduce((a, b) => a + b, 0));
	// How orders arrived; colours validated for colour-blind readers in this order.
	const split = $derived.by(() => {
		const parts = [
			{ key: 'delivery', label: 'Delivery', n: s.totals.delivery },
			{ key: 'pickup', label: 'Pickup / takeaway', n: s.totals.pickup },
			{ key: 'dine_in', label: 'Dine-in', n: s.totals.dine_in }
		];
		const total = parts.reduce((a, p) => a + p.n, 0);
		return total ? { total, parts: parts.map((p) => ({ ...p, share: p.n / total })) } : null;
	});
	const topMax = $derived(Math.max(1, ...s.top_items.map((t) => t.qty)));
	const presets = [
		['1', 'Today'],
		['7', '7 days'],
		['30', '30 days'],
		['90', '90 days']
	];
</script>

<PageHeader title="{greeting}, {first}" aside={clock.format(now)}>
	{#snippet actions()}
		<nav class="seg" aria-label="Date range">
			{#each presets as [v, label] (v)}
				<a href="?range={v}" aria-current={data.preset === v ? 'true' : undefined}>{label}</a>
			{/each}
		</nav>
		<form class="custom" method="GET">
			<DatePicker name="from" value={s.from} label="From" max={s.to} />
			<span aria-hidden="true">–</span>
			<DatePicker name="to" value={s.to} label="To" />
			<button class="btn small"><HugeiconsIcon icon={Search01Icon} size={16} /> Show</button>
		</form>
	{/snippet}
</PageHeader>

{#if data.rangeError}<p class="flash bad" role="alert">{data.rangeError}</p>{/if}

<section class="tiles" aria-label="Key numbers">
	{#each tiles as t (t.label)}
		<div class="card tile">
			<span class="label">{t.label}</span>
			<strong class="value">{t.value}</strong>
			{#if t.delta}
				<span class="delta" class:good={t.delta.good === true} class:bad={t.delta.good === false}>
					<HugeiconsIcon icon={t.delta.up ? ArrowUp01Icon : ArrowDown01Icon} size={14} />
					{t.delta.text}
					<span class="vs">vs previous {s.days.length === 1 ? 'day' : `${s.days.length} days`}</span
					>
				</span>
			{:else}
				<span class="delta vs">No earlier data to compare</span>
			{/if}
		</div>
	{/each}
</section>

<div class="layout">
	<div class="col">
		<section class="card">
			<div class="card-head">
				<div>
					<h2>Revenue by day</h2>
					<span class="hint">Cash from orders that weren’t cancelled</span>
				</div>
				{#if s.totals.orders}
					<div class="seg" role="tablist" aria-label="Show revenue as">
						{#each [['chart', 'Chart', ChartColumnIcon], ['table', 'Table', Table01Icon]] as const as [v, label, icon] (v)}
							<button
								type="button"
								role="tab"
								aria-selected={view === v}
								aria-current={view === v ? 'true' : undefined}
								onclick={() => (view = v)}><HugeiconsIcon {icon} size={16} /> {label}</button
							>
						{/each}
					</div>
				{/if}
			</div>
			{#if s.totals.orders && view === 'chart'}
				<ColumnChart {points} caption="Revenue by day, {rangeLabel}" />
			{:else if s.totals.orders}
				<div class="table-wrap">
					<table class="days">
						<thead>
							<tr><th>Day</th><th>Orders</th><th>Revenue</th><th>Average order</th></tr>
						</thead>
						<tbody>
							{#each s.days as day (day.date)}
								<tr>
									<td>{fmtLong.format(d(day.date))}</td>
									<td>{count.format(day.orders)}</td>
									<td>{price(day.revenue)}</td>
									<td>{day.orders ? price(Math.round(day.revenue / day.orders)) : '–'}</td>
								</tr>
							{/each}
						</tbody>
						<tfoot>
							<tr>
								<th>Total</th>
								<td>{count.format(s.totals.orders)}</td>
								<td>{price(s.totals.revenue)}</td>
								<td>{price(avg(s.totals))}</td>
							</tr>
						</tfoot>
					</table>
				</div>
			{:else}
				<p class="empty">No orders in this period yet.</p>
			{/if}
		</section>

		<section class="card">
			<div class="card-head">
				<h2>Best sellers</h2>
				<span class="hint">By plates sold</span>
			</div>
			{#if s.top_items.length}
				<ol class="top">
					{#each s.top_items as t, i (t.name)}
						<li>
							<span class="rank">{i + 1}</span>
							<div class="bar-wrap">
								<div class="top-line">
									<span>{t.name}</span><span class="num">{t.qty} · {price(t.revenue)}</span>
								</div>
								<span class="meter"><span style="width: {(t.qty / topMax) * 100}%"></span></span>
							</div>
						</li>
					{/each}
				</ol>
			{:else}
				<p class="empty">Nothing sold in this period yet.</p>
			{/if}
		</section>
	</div>

	<div class="col">
		<section class="card">
			<div class="card-head">
				<h2>Right now</h2>
				<a class="btn small" href="/admin/orders"
					>Open orders <HugeiconsIcon icon={ArrowRight02Icon} size={16} /></a
				>
			</div>
			{#if openTotal}
				<ul class="chips">
					{#each Object.entries(openLabels) as [key, label] (key)}
						{#if s.open[key]}
							<li>
								<a href="/admin/orders?status={key}" class:urgent={key === 'new'}>
									<strong>{s.open[key]}</strong>{label}
								</a>
							</li>
						{/if}
					{/each}
				</ul>
			{:else}
				<p class="hint">No orders waiting. The kitchen is clear.</p>
			{/if}

			<h3>Next table bookings</h3>
			{#if s.upcoming_bookings.length}
				<ul class="bookings">
					{#each s.upcoming_bookings as b (b.id)}
						<li>
							<span class="when">{fmtLong.format(d(b.date))} · {time(b.time)}</span>
							<span>{b.name} · {b.guests} {b.guests === 1 ? 'person' : 'people'}</span>
							{#if b.status === 'requested'}<a class="wait" href="/admin/bookings">Needs a reply</a
								>{/if}
						</li>
					{/each}
				</ul>
			{:else}
				<p class="hint">No upcoming bookings.</p>
			{/if}
		</section>

		<section class="card">
			<div class="card-head">
				<h2>How orders came in</h2>
				<span class="hint">{split ? `${split.total} orders` : ''}</span>
			</div>
			{#if split}
				<div
					class="split"
					role="img"
					aria-label={split.parts.map((p) => `${Math.round(p.share * 100)}% ${p.label}`).join(', ')}
				>
					{#each split.parts as p (p.key)}
						{#if p.n}<span class="seg {p.key}" style="flex: {p.share}"></span>{/if}
					{/each}
				</div>
				<ul class="legend">
					{#each split.parts as p (p.key)}
						<li>
							<span class="dot {p.key}"></span>{p.label}
							<strong>{Math.round(p.share * 100)}%</strong>
							· {p.n}
						</li>
					{/each}
				</ul>
			{:else}
				<p class="empty">No orders in this period yet.</p>
			{/if}
		</section>
	</div>
</div>

<style>
	.seg {
		display: flex;
		padding: 4px;
		border-radius: 12px;
		background: var(--cream);
	}
	.seg a,
	.seg button {
		border: 0;
		background: none;
		font-family: inherit;
		color: inherit;
		cursor: pointer;
	}
	.seg a,
	.seg button {
		padding: 7px 12px;
		border-radius: 9px;
		font-weight: 600;
		font-size: 0.875rem;
		text-decoration: none;
		white-space: nowrap;
	}
	.seg [aria-current] {
		background: var(--black);
		color: var(--cream);
	}
	.table-wrap {
		overflow-x: auto;
	}
	.days {
		width: 100%;
		border-collapse: collapse;
		font-variant-numeric: tabular-nums;
	}
	.days th,
	.days td {
		padding: 10px 12px;
		border-bottom: 1px solid var(--line);
		text-align: right;
		white-space: nowrap;
	}
	.days th:first-child,
	.days td:first-child {
		text-align: left;
	}
	.days thead th {
		color: var(--muted);
		font-size: 0.8125rem;
		font-weight: 600;
	}
	.days tbody tr:hover {
		background: var(--soft);
	}
	.days tfoot th,
	.days tfoot td {
		border-bottom: 0;
		font-weight: 800;
	}
	.custom {
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
	}
	.label {
		color: var(--muted);
		font-weight: 600;
		font-size: 0.875rem;
	}
	.value {
		font-size: 1.75rem;
		font-weight: 800;
		font-variant-numeric: proportional-nums;
	}
	.delta {
		display: inline-flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 4px;
		font-size: 0.8125rem;
		font-weight: 700;
	}
	.delta.good {
		color: var(--green);
	}
	.delta.bad {
		color: var(--brand);
	}
	.vs {
		font-weight: 500;
		color: var(--muted);
	}
	.layout,
	.col {
		display: grid;
		gap: 14px;
		align-content: start;
	}
	.card-head h2 {
		font-size: 1.125rem;
	}
	h3 {
		margin: 20px 0 10px;
		font-size: 0.9375rem;
	}
	.chips {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.chips a {
		display: grid;
		min-width: 88px;
		padding: 10px 14px;
		border-radius: 12px;
		background: var(--soft);
		font-size: 0.8125rem;
		font-weight: 600;
		text-decoration: none;
	}
	.chips strong {
		font-size: 1.5rem;
	}
	.chips a.urgent {
		background: var(--brand);
		color: var(--cream);
	}
	.bookings {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 8px;
	}
	.bookings li {
		display: grid;
		padding: 10px 12px;
		border-radius: 10px;
		background: var(--soft);
		font-size: 0.9375rem;
	}
	.when {
		font-weight: 700;
	}
	.wait {
		justify-self: start;
		margin-top: 4px;
		color: var(--brand);
		font-size: 0.8125rem;
		font-weight: 700;
	}
	.top {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 12px;
	}
	.top li {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.rank {
		display: grid;
		place-items: center;
		flex: none;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: var(--soft);
		font-weight: 800;
		font-size: 0.8125rem;
	}
	.bar-wrap {
		flex: 1;
		display: grid;
		gap: 6px;
	}
	.top-line {
		display: flex;
		justify-content: space-between;
		gap: 10px;
		font-weight: 600;
	}
	.num {
		color: var(--muted);
		font-weight: 500;
		font-size: 0.875rem;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
	.meter {
		height: 8px;
		border-radius: 99px;
		background: var(--soft);
	}
	.meter span {
		display: block;
		height: 100%;
		border-radius: 99px;
		background: var(--brand);
	}
	.split {
		display: flex;
		gap: 2px;
		height: 20px;
		margin-bottom: 14px;
	}
	.split .seg:first-child {
		border-radius: 6px 0 0 6px;
	}
	.split .seg:last-child {
		border-radius: 0 6px 6px 0;
	}
	.delivery {
		background: var(--brand);
	}
	.pickup {
		background: #2b6cb0;
	}
	.dine_in {
		background: #b07d00;
	}
	.legend {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 6px;
	}
	.legend li {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.dot {
		width: 12px;
		height: 12px;
		border-radius: 4px;
	}
	@media (min-width: 1100px) {
		.layout {
			grid-template-columns: 2fr 1fr;
		}
	}
</style>

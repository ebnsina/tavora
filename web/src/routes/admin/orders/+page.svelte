<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { price, type Order } from '$lib/api';
	import { onMount } from 'svelte';
	import PageHeader from '$lib/admin/PageHeader.svelte';

	let { data, form } = $props();

	const labels: Record<string, string> = {
		new: 'New',
		accepted: 'Accepted',
		preparing: 'Cooking',
		ready: 'Ready',
		out_for_delivery: 'On the way',
		completed: 'Done',
		cancelled: 'Cancelled',
		active: 'Active'
	};
	const filters = ['active', 'new', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled'];

	// The one sensible next step for each order; pickups skip "on the way".
	function next(o: Order): [string, string] | null {
		const flow: Record<string, [string, string]> = {
			new: ['accepted', 'Accept'],
			accepted: ['preparing', 'Start cooking'],
			preparing: ['ready', 'Mark ready'],
			ready:
				o.mode === 'delivery'
					? ['out_for_delivery', 'Send with rider']
					: ['completed', 'Handed over'],
			out_for_delivery: ['completed', 'Delivered & paid']
		};
		return flow[o.status] ?? null;
	}

	const ago = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
	const since = (iso: string) => {
		const mins = Math.round((new Date(iso).getTime() - Date.now()) / 60_000);
		return Math.abs(mins) < 60
			? ago.format(mins, 'minute')
			: ago.format(Math.round(mins / 60), 'hour');
	};

	// Kitchen screens stay current without anyone pressing refresh.
	onMount(() => {
		const t = setInterval(invalidateAll, 30_000);
		return () => clearInterval(t);
	});
</script>

<PageHeader title="Orders" sub="Updates by itself every 30 seconds">
	{#snippet actions()}
		<nav class="tabs" aria-label="Filter orders">
			{#each filters as f (f)}
				<a
					href="?status={f}"
					aria-current={data.status === f ? 'page' : undefined}
				>
					{labels[f]}
				</a>
			{/each}
		</nav>
	{/snippet}
</PageHeader>

{#if form?.error}<p class="flash bad" role="alert">{form.error}</p>{/if}

{#if !data.orders.length}
	<p class="card empty">Nothing here. New orders show up by themselves.</p>
{:else}
	<ul class="orders">
		{#each data.orders as o (o.id)}
			{@const step = next(o)}
			<li class="card" class:fresh={o.status === 'new'}>
				<div class="top">
					<strong class="num">TV-{o.number}</strong>
					<span class="badge {o.status}">{labels[o.status]}</span>
					<span class="mode">{o.mode === 'delivery' ? 'Delivery' : 'Pickup'}</span>
					<span class="when">{since(o.created_at)}</span>
				</div>
				<p class="who">
					<strong>{o.name}</strong> · <a href="tel:{o.phone}">{o.phone}</a>
					{#if o.address}<br /><span class="addr">{o.address}</span>{/if}
				</p>
				<ul class="lines">
					{#each o.items as l (l.id)}
						<li><span>{l.qty} × {l.name}</span><span>{price(l.amount)}</span></li>
					{/each}
				</ul>
				{#if o.note}<p class="note">Note: {o.note}</p>{/if}
				<div class="bottom">
					<span class="total">{price(o.total)} <small>cash</small></span>
					<form method="POST" action="?/status" use:enhance class="row">
						<input type="hidden" name="id" value={o.id} />
						{#if step}
							<button class="btn primary small" name="status" value={step[0]}>{step[1]}</button>
						{/if}
						{#if o.status !== 'completed' && o.status !== 'cancelled'}
							<button class="btn ghost small" name="status" value="cancelled">Cancel</button>
						{/if}
					</form>
				</div>
			</li>
		{/each}
	</ul>
{/if}

<style>
	.tabs {
		display: flex;
		gap: 4px;
		overflow-x: auto;
		padding: 4px;
		border-radius: 12px;
		background: var(--cream);
	}
	.tabs a {
		flex: none;
		padding: 7px 12px;
		border-radius: 9px;
		text-decoration: none;
		font-weight: 600;
		font-size: 0.875rem;
	}
	.tabs a[aria-current='page'] {
		background: var(--black);
		color: var(--cream);
	}
	.orders {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 14px;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
	}
	.fresh {
		box-shadow: inset 0 0 0 3px var(--brand);
	}
	.top {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px;
	}
	.num {
		font: 800 1.25rem var(--display);
	}
	.badge {
		padding: 3px 10px;
		border-radius: 999px;
		background: var(--soft);
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
	}
	.badge.new {
		background: var(--brand);
		color: var(--cream);
	}
	.badge.ready,
	.badge.out_for_delivery {
		background: var(--mustard);
	}
	.badge.completed {
		background: var(--green);
		color: #fff;
	}
	.mode,
	.when {
		font-size: 0.8125rem;
		color: var(--muted);
	}
	.when {
		margin-left: auto;
	}
	.who {
		margin: 12px 0;
	}
	.addr {
		color: var(--muted);
		font-size: 0.9375rem;
	}
	.lines {
		list-style: none;
		margin: 0;
		padding: 10px 0;
		border-block: 1px dashed var(--line);
		display: grid;
		gap: 4px;
	}
	.lines li {
		display: flex;
		justify-content: space-between;
		gap: 12px;
	}
	.note {
		margin: 10px 0 0;
		padding: 8px 12px;
		border-radius: 8px;
		background: #fff4cf;
		font-size: 0.9375rem;
	}
	.bottom {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		margin-top: 14px;
	}
	.total {
		font: 800 1.25rem var(--display);
	}
	.total small {
		font: 600 0.75rem var(--sans);
		color: var(--muted);
	}
</style>

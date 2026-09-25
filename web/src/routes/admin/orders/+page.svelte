<script lang="ts">
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		ArrowRight02Icon,
		Call02Icon,
		Cancel01Icon,
		Location01Icon
	} from '@hugeicons/core-free-icons';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { price, type Order } from '$lib/api';
	import { onMount } from 'svelte';
	import PageHeader from '$lib/admin/PageHeader.svelte';
	import MenuSelect from '$lib/admin/MenuSelect.svelte';

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
	const filters = [
		'active',
		'new',
		'preparing',
		'ready',
		'out_for_delivery',
		'completed',
		'cancelled'
	];

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
		<MenuSelect
			label="Status"
			options={filters.map((f) => ({
				label: labels[f],
				href: `?status=${f}`,
				current: data.status === f
			}))}
		/>
	{/snippet}
</PageHeader>

{#if form?.error}<p class="flash bad" role="alert">{form.error}</p>{/if}

{#if !data.orders.length}
	<p class="card empty">Nothing here. New orders show up by themselves.</p>
{:else}
	<ul class="orders">
		{#each data.orders as o (o.id)}
			{@const step = next(o)}
			<li class="card order" class:fresh={o.status === 'new'}>
				<header class="head">
					<div>
						<a class="num" href="/admin/orders/{o.id}">TV-{o.number}</a>
						<p class="meta">
							{{ delivery: 'Delivery', pickup: 'Pickup', dine_in: 'Dine-in' }[o.mode]} · {since(
								o.created_at
							)}
						</p>
					</div>
					<span class="badge {o.status}">{labels[o.status]}</span>
				</header>

				<div class="who">
					<strong>{o.name}</strong>
					{#if o.phone}<a class="sub" href="tel:{o.phone}"
							><HugeiconsIcon icon={Call02Icon} size={14} /> {o.phone}</a
						>{/if}
					{#if o.address}<p class="sub">
							<HugeiconsIcon icon={Location01Icon} size={14} />
							{o.address}
						</p>{/if}
				</div>

				<ul class="lines">
					{#each o.items as l (l.id)}
						<li>
							<span class="qty">{l.qty}×</span><span class="name">{l.name}</span><span
								>{price(l.amount)}</span
							>
						</li>
					{/each}
				</ul>
				{#if o.note}<p class="note">{o.note}</p>{/if}

				<!-- Footer sits at the bottom of every card: total, then one row of actions. -->
				<footer class="foot">
					<p class="total"><span>Cash total</span><strong>{price(o.total)}</strong></p>
					<form method="POST" action="?/status" use:enhance class="acts">
						<input type="hidden" name="id" value={o.id} />
						<a class="btn quiet small" href="/admin/orders/{o.id}">Details</a>
						{#if step}
							<button class="btn primary small grow" name="status" value={step[0]}
								>{step[1]} <HugeiconsIcon icon={ArrowRight02Icon} size={16} /></button
							>
						{/if}
						{#if o.status !== 'completed' && o.status !== 'cancelled'}
							<button
								class="btn quiet small icon"
								name="status"
								value="cancelled"
								aria-label="Cancel order TV-{o.number}"
								title="Cancel order"
								><HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={2} /></button
							>
						{/if}
					</form>
				</footer>
			</li>
		{/each}
	</ul>
{/if}

<style>
	.orders {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(320px, 100%), 1fr));
		gap: 16px;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.order {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	/* New orders: an accent stripe, not a heavy frame. */
	.fresh {
		box-shadow: inset 4px 0 0 var(--brand);
	}
	.head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
	}
	.num {
		color: var(--ink);
		font: 700 1.125rem var(--sans);
		text-decoration: none;
	}
	.num:hover {
		color: var(--brand);
	}
	.meta {
		margin: 2px 0 0;
		color: var(--muted);
		font-size: 0.8125rem;
	}
	/* Status: a soft tint of its colour, never a loud block. */
	.badge {
		flex: none;
		padding: 3px 10px;
		border-radius: 999px;
		background: var(--soft);
		color: var(--muted);
		font-size: 0.75rem;
		font-weight: 700;
	}
	.badge.new {
		background: var(--accent-soft);
		color: var(--brand);
	}
	.badge.preparing {
		background: #fff1c2;
		color: #7a5a00;
	}
	.badge.ready,
	.badge.completed {
		background: #e3f6ec;
		color: #1f7a45;
	}
	.badge.out_for_delivery {
		background: #e3ecfb;
		color: #1d4ed8;
	}
	.who {
		display: grid;
		gap: 4px;
	}
	.who strong {
		font-weight: 600;
	}
	.sub {
		display: flex;
		align-items: flex-start;
		gap: 6px;
		margin: 0;
		color: var(--muted);
		font-size: 0.875rem;
		text-decoration: none;
	}
	.sub :global(svg) {
		flex: none;
		margin-top: 3px;
	}
	a.sub:hover {
		color: var(--ink);
	}
	.lines {
		display: grid;
		gap: 6px;
		margin: 0;
		padding: 0;
		list-style: none;
		font-size: 0.9375rem;
		font-variant-numeric: tabular-nums;
	}
	.lines li {
		display: grid;
		grid-template-columns: 28px 1fr auto;
		gap: 8px;
	}
	.qty {
		color: var(--muted);
	}
	.note {
		margin: 0;
		padding: 8px 12px;
		border-radius: 8px;
		background: #fff6d6;
		font-size: 0.875rem;
	}
	.foot {
		display: grid;
		gap: 12px;
		margin-top: auto;
		padding-top: 16px;
		border-top: 1px solid var(--line);
	}
	.total {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		margin: 0;
	}
	.total span {
		color: var(--muted);
		font-size: 0.8125rem;
	}
	.total strong {
		font-size: 1.25rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}
	.acts {
		display: flex;
		gap: 8px;
	}
	.acts .grow {
		flex: 1;
	}
	.acts .btn.icon {
		flex: none;
		width: 38px;
		padding: 0;
	}
</style>

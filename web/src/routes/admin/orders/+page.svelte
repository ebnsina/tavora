<script lang="ts">
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		ArrowRight02Icon,
		Call02Icon,
		Cancel01Icon,
		Location01Icon,
		Motorbike02Icon,
		ShoppingBag01Icon,
		TableRoundIcon
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

	const kinds = { delivery: Motorbike02Icon, pickup: ShoppingBag01Icon, dine_in: TableRoundIcon };

	const initials = (name: string) =>
		name
			.split(/\s+/)
			.filter((w) => /^\p{L}/u.test(w))
			.slice(0, 2)
			.map((w) => w[0].toUpperCase())
			.join('');

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
					<span class="kind"><HugeiconsIcon icon={kinds[o.mode]} size={20} /></span>
					<div class="id">
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
					<span class="avatar" aria-hidden="true">{initials(o.name)}</span>
					<div>
						<strong>{o.name}</strong>
						{#if o.phone}<a class="sub" href="tel:{o.phone}"
								><HugeiconsIcon icon={Call02Icon} size={14} /> {o.phone}</a
							>{/if}
						{#if o.address}<p class="sub">
								<HugeiconsIcon icon={Location01Icon} size={14} />
								{o.address}
							</p>{/if}
					</div>
				</div>

				<ul class="lines">
					{#each o.items as l (l.id)}
						<li>
							<span class="qty">{l.qty}×</span><span class="name">{l.name}</span><span class="amt"
								>{price(l.amount)}</span
							>
						</li>
					{/each}
				</ul>
				{#if o.note}<p class="note">{o.note}</p>{/if}

				<!-- A tinted footer pinned to the bottom: total, then one row of actions. -->
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
	/* Sections carry their own padding so the footer can run edge to edge. */
	.orders .order {
		display: flex;
		flex-direction: column;
		padding: 0;
		overflow: hidden;
		box-shadow:
			0 0 0 1px var(--line),
			0 1px 2px rgb(15 23 42 / 0.04);
	}
	.fresh {
		box-shadow:
			0 0 0 1px color-mix(in srgb, var(--brand) 45%, transparent),
			0 4px 16px -6px color-mix(in srgb, var(--brand) 30%, transparent);
	}
	.head {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 16px 18px 14px;
	}
	.kind {
		display: grid;
		flex: none;
		place-items: center;
		width: 40px;
		height: 40px;
		border-radius: 12px;
		background: var(--soft);
		color: var(--ink);
	}
	.id {
		flex: 1;
		min-width: 0;
	}
	.num {
		color: var(--ink);
		font: 600 1rem var(--code);
		letter-spacing: -0.01em;
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
	/* Status: a soft pill with a dot in its colour. */
	.badge {
		display: inline-flex;
		flex: none;
		align-items: center;
		gap: 6px;
		padding: 4px 10px;
		border-radius: 999px;
		background: var(--soft);
		color: var(--muted);
		font-size: 0.75rem;
		font-weight: 600;
	}
	.badge::before {
		content: '';
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: currentColor;
	}
	.badge.new {
		background: var(--accent-soft);
		color: var(--brand);
	}
	.badge.accepted,
	.badge.preparing {
		background: #fef6dc;
		color: #8a6400;
	}
	.badge.ready,
	.badge.completed {
		background: #e7f6ee;
		color: #1f7a45;
	}
	.badge.out_for_delivery {
		background: #e8effc;
		color: #1d4ed8;
	}
	.who {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		margin: 0 18px;
		padding: 12px;
		border-radius: 12px;
		background: #f8fafc;
	}
	.who > div {
		display: grid;
		gap: 3px;
		min-width: 0;
	}
	.avatar {
		display: grid;
		flex: none;
		place-items: center;
		width: 34px;
		height: 34px;
		border-radius: 50%;
		background: var(--accent-soft);
		color: var(--brand);
		font-size: 0.75rem;
		font-weight: 700;
	}
	.who strong {
		font-weight: 600;
		line-height: 34px;
	}
	.who strong:not(:only-child) {
		line-height: 1.3;
		padding-top: 1px;
	}
	.sub {
		display: flex;
		align-items: flex-start;
		gap: 6px;
		margin: 0;
		color: var(--muted);
		font-size: 0.8125rem;
		text-decoration: none;
	}
	.sub :global(svg) {
		flex: none;
		margin-top: 2px;
	}
	a.sub:hover {
		color: var(--ink);
	}
	.lines {
		display: grid;
		gap: 10px;
		margin: 0;
		padding: 16px 18px;
		list-style: none;
		font-size: 0.9375rem;
		font-variant-numeric: tabular-nums;
	}
	.lines li {
		display: grid;
		grid-template-columns: 32px 1fr auto;
		align-items: baseline;
		gap: 8px;
	}
	.qty {
		color: var(--muted);
		font: 500 0.8125rem var(--code);
	}
	.name {
		color: var(--ink);
	}
	.amt {
		color: var(--muted);
	}
	.note {
		margin: 0 18px 16px;
		padding: 8px 12px;
		border-radius: 10px;
		background: #fef6dc;
		color: #6b4e00;
		font-size: 0.875rem;
	}
	.foot {
		display: grid;
		gap: 12px;
		margin-top: auto;
		padding: 14px 18px 16px;
		border-top: 1px solid var(--line);
		background: #f8fafc;
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
		letter-spacing: -0.01em;
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

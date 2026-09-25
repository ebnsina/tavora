<script lang="ts">
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { Add01Icon, ChefHatIcon } from '@hugeicons/core-free-icons';
	import { goto } from '$app/navigation';
	import { message, price } from '$lib/api';
	import { minutesSince, pos, type Floor } from '$lib/pos';
	import { onMount } from 'svelte';

	let floor = $state<Floor | null>(null);
	let error = $state('');

	async function refresh() {
		try {
			floor = await pos<Floor>('pos/floor');
			error = '';
		} catch (e) {
			error = message(e);
		}
	}

	// Other tablets open and close tables too, so keep the floor current.
	onMount(() => {
		refresh();
		const t = setInterval(refresh, 10_000);
		return () => clearInterval(t);
	});

	const areas = $derived(Object.groupBy(floor?.tables ?? [], (t) => t.area || 'Tables'));
	const busy = $derived(floor?.tables.filter((t) => t.ticket).length ?? 0);
	const newTicket = (query: string) => goto(`/admin/pos/ticket/${crypto.randomUUID()}?${query}`);
</script>

<div class="floor">
	<section class="tables">
		<div class="head">
			<h1>Tables</h1>
			{#if floor}<span class="count">{busy} of {floor.tables.length} in use</span>{/if}
		</div>
		{#if error}<p class="flash bad" role="alert">{error}</p>{/if}
		{#if !floor && !error}<p class="muted">Loading tables…</p>{/if}

		{#each Object.entries(areas) as [area, tables] (area)}
			<h2>{area}</h2>
			<ul class="grid">
				{#each tables ?? [] as t (t.id)}
					<li>
						<button
							type="button"
							class="table"
							class:busy={t.ticket}
							onclick={() =>
								t.ticket ? goto(`/admin/pos/ticket/${t.ticket.id}`) : newTicket(`table=${t.id}`)}
						>
							<span class="name">{t.name}</span>
							{#if t.ticket}
								<strong class="amt">{price(t.ticket.total)}</strong>
								<span class="meta">{minutesSince(t.ticket.created_at)} min</span>
								{#if t.ticket.unsent > 0}
									<span class="flag"
										><HugeiconsIcon icon={ChefHatIcon} size={14} /> {t.ticket.unsent} not sent</span
									>
								{/if}
							{:else}
								<span class="meta">Free · {t.seats} seats</span>
							{/if}
						</button>
					</li>
				{/each}
			</ul>
		{/each}
	</section>

	<aside class="counter">
		<button type="button" class="new" onclick={() => newTicket('mode=pickup')}>
			<HugeiconsIcon icon={Add01Icon} size={24} /> New takeaway
		</button>
		<h2>Open takeaway</h2>
		{#if floor?.counter.length}
			<ul class="list">
				{#each floor.counter as c (c.id)}
					<li>
						<a href="/admin/pos/ticket/{c.id}">
							<span><strong>#{c.number}</strong> {c.name}</span>
							<span class="amt">{price(c.total - c.paid)}</span>
						</a>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="muted">No open takeaway orders.</p>
		{/if}
	</aside>
</div>

<style>
	.floor {
		height: 100%;
		display: grid;
		grid-template-columns: 1fr 320px;
		overflow: hidden;
	}
	.tables {
		overflow-y: auto;
		padding: 20px;
	}
	.head {
		display: flex;
		align-items: baseline;
		gap: 12px;
	}
	h1 {
		font-size: 2rem;
	}
	h2 {
		margin: 20px 0 10px;
		font-size: 0.8125rem;
		letter-spacing: 0.1em;
		color: var(--muted);
	}
	.count,
	.muted {
		color: var(--muted);
		font-weight: 600;
	}
	.grid {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 12px;
	}
	.table {
		width: 100%;
		min-height: 130px;
		display: grid;
		align-content: space-between;
		justify-items: start;
		gap: 4px;
		padding: 14px;
		border: 0;
		border-radius: 18px;
		background: var(--cream);
		box-shadow: inset 0 0 0 2px var(--line);
		color: var(--ink);
		font: inherit;
		text-align: left;
		cursor: pointer;
		transition: transform 0.1s;
	}
	.table:active {
		transform: scale(0.97);
	}
	.table.busy {
		background: var(--brand);
		box-shadow: none;
		color: var(--cream);
	}
	.name {
		font: 800 1.75rem var(--display);
	}
	.amt {
		font-size: 1.125rem;
		font-variant-numeric: tabular-nums;
	}
	.meta {
		font-size: 0.875rem;
		font-weight: 600;
		opacity: 0.8;
	}
	.flag {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 2px 8px;
		border-radius: 999px;
		background: var(--mustard);
		color: var(--black);
		font-size: 0.75rem;
		font-weight: 700;
	}
	.counter {
		overflow-y: auto;
		padding: 20px;
		background: var(--cream);
	}
	.new {
		width: 100%;
		min-height: 72px;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		border: 0;
		border-radius: 18px;
		background: var(--black);
		color: var(--cream);
		font: 800 1.125rem var(--sans);
		cursor: pointer;
	}
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 8px;
	}
	.list a {
		display: flex;
		justify-content: space-between;
		gap: 10px;
		padding: 14px;
		border-radius: 14px;
		background: var(--soft);
		text-decoration: none;
		font-weight: 600;
	}
	.flash {
		padding: 12px 16px;
		border-radius: 12px;
		background: var(--brand);
		color: var(--cream);
		font-weight: 600;
	}
	@media (max-width: 860px) {
		.floor {
			grid-template-columns: 1fr;
			overflow-y: auto;
		}
		.tables,
		.counter {
			overflow: visible;
		}
	}
</style>

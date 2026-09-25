<script lang="ts">
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { Tick02Icon } from '@hugeicons/core-free-icons';
	import { ApiError, message } from '$lib/api';
	import { minutesSince, pos } from '$lib/pos';
	import { onMount } from 'svelte';

	type KTicket = {
		id: string;
		number: number;
		mode: string;
		source: string;
		table: string | null;
		name: string;
		lines: { name: string; qty: number; note?: string }[];
		created_at: string;
		done: boolean;
	};

	let tickets = $state<KTicket[]>([]);
	let error = $state('');
	let tick = $state(0);

	async function refresh() {
		try {
			tickets = await pos<KTicket[]>('kitchen');
			error = '';
		} catch (e) {
			// Offline: keep showing the last board; the till prints kitchen tickets on paper meanwhile.
			error =
				e instanceof ApiError && e.code === 'network'
					? 'No internet. Showing the last tickets; new orders print at the till until it’s back.'
					: message(e);
		}
	}

	onMount(() => {
		refresh();
		const a = setInterval(refresh, 8_000);
		const b = setInterval(() => tick++, 30_000);
		return () => {
			clearInterval(a);
			clearInterval(b);
		};
	});

	async function mark(t: KTicket, done: boolean) {
		t.done = done;
		try {
			await pos(`kitchen/${t.id}/done`, { method: 'POST', body: JSON.stringify({ done }) });
		} catch (e) {
			t.done = !done;
			error = message(e);
		}
	}

	const pending = $derived(tickets.filter((t) => !t.done));
	const recent = $derived(tickets.filter((t) => t.done));
	const where = (t: KTicket) =>
		t.table ??
		(t.source === 'online' ? (t.mode === 'delivery' ? 'Delivery' : 'Online pickup') : 'Takeaway');
	// Reading `tick` re-renders the timers every 30 seconds.
	const age = (t: KTicket) => {
		void tick;
		return minutesSince(t.created_at);
	};
</script>

<div class="kds">
	<div class="head">
		<h1>Kitchen</h1>
		<span class="muted">{pending.length} to cook</span>
		{#if error}<span class="err" role="alert">{error}</span>{/if}
	</div>

	{#if !pending.length}
		<p class="empty">All clear. New tickets appear here as soon as they’re sent.</p>
	{/if}

	<ul class="board">
		{#each pending as t (t.id)}
			{@const m = age(t)}
			<li class="ticket" class:warn={m >= 10} class:late={m >= 20}>
				<div class="thead">
					<div>
						<strong>{where(t)}</strong>
						<small>#{t.number}</small>
					</div>
					<span class="timer">{m} min</span>
				</div>
				<ul class="items">
					{#each t.lines as l, i (i)}
						<li>
							<b class="q">{l.qty}×</b>
							{l.name}
							{#if l.note}<em class="note">{l.note}</em>{/if}
						</li>
					{/each}
				</ul>
				<button type="button" class="bump" onclick={() => mark(t, true)}>
					<HugeiconsIcon icon={Tick02Icon} size={22} /> Done
				</button>
			</li>
		{/each}
	</ul>

	{#if recent.length}
		<h2>Finished in the last 30 minutes</h2>
		<ul class="recent">
			{#each recent as t (t.id)}
				<li>
					<span
						>{where(t)} · #{t.number} · {t.lines.map((l) => `${l.qty}× ${l.name}`).join(', ')}</span
					>
					<button type="button" onclick={() => mark(t, false)}>Bring back</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.note {
		display: block;
		margin-left: 22px;
		color: var(--brand);
		font-weight: 700;
	}
	.kds {
		height: 100%;
		overflow-y: auto;
		padding: 20px;
		background: #1c1c1c;
		color: var(--cream);
	}
	.head {
		display: flex;
		align-items: baseline;
		gap: 14px;
		margin-bottom: 16px;
	}
	h1 {
		font-size: 2rem;
		color: var(--cream);
	}
	h2 {
		margin: 28px 0 10px;
		font-size: 0.875rem;
		letter-spacing: 0.1em;
		color: rgb(255 255 255 / 0.5);
	}
	.muted {
		color: rgb(255 255 255 / 0.6);
		font-weight: 600;
	}
	.err {
		padding: 4px 12px;
		border-radius: 999px;
		background: var(--brand);
		font-weight: 600;
	}
	.empty {
		padding: 60px 0;
		text-align: center;
		color: rgb(255 255 255 / 0.6);
		font-size: 1.125rem;
	}
	.board {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: 14px;
		align-items: start;
	}
	.ticket {
		display: grid;
		border-radius: 16px;
		background: var(--cream);
		color: var(--ink);
		overflow: hidden;
	}
	/* Age shows in the timer chip; a late ticket also gets a thin red outline. */
	.ticket.late {
		box-shadow: 0 0 0 2px var(--brand);
	}
	.timer {
		align-self: flex-start;
		padding: 3px 10px;
		border-radius: 999px;
		background: #e3f6ec;
		color: #1f7a45;
		font-size: 0.8125rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}
	.warn .timer {
		background: #fff1c2;
		color: #7a5a00;
	}
	.late .timer {
		background: var(--accent-soft);
		color: var(--brand);
	}
	.thead {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 8px;
		padding: 16px 14px 8px;
	}
	.thead strong {
		display: block;
		font: 700 1.25rem var(--sans);
		letter-spacing: -0.01em;
	}
	.thead small {
		color: var(--muted);
		font-size: 0.8125rem;
		font-weight: 500;
	}
	.q {
		color: var(--muted);
		font-weight: 600;
	}
	.items {
		list-style: none;
		margin: 0;
		padding: 0 14px 12px;
		display: grid;
		gap: 6px;
		font-size: 1.125rem;
	}
	.bump {
		min-height: 52px;
		margin: 4px 12px 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		border: 0;
		border-radius: 12px;
		background: var(--black);
		color: var(--cream);
		font: 800 1.0625rem var(--sans);
		cursor: pointer;
	}
	.bump:active {
		background: var(--green);
	}
	.recent {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 6px;
	}
	.recent li {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
		padding: 10px 14px;
		border-radius: 12px;
		background: rgb(255 255 255 / 0.06);
		color: rgb(255 255 255 / 0.7);
	}
	.recent button {
		flex: none;
		min-height: 40px;
		padding: 0 14px;
		border: 0;
		border-radius: 10px;
		background: rgb(255 255 255 / 0.12);
		color: var(--cream);
		font: 700 0.875rem var(--sans);
		cursor: pointer;
	}
</style>

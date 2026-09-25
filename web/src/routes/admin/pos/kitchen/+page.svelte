<script lang="ts">
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		ChefHatIcon,
		Clock01Icon,
		Motorbike02Icon,
		ShoppingBag01Icon,
		TableRoundIcon,
		Tick02Icon
	} from '@hugeicons/core-free-icons';
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
	const icon = (t: KTicket) =>
		t.table ? TableRoundIcon : t.mode === 'delivery' ? Motorbike02Icon : ShoppingBag01Icon;
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
		<div class="empty">
			<span class="chef"><HugeiconsIcon icon={ChefHatIcon} size={40} /></span>
			<p><strong>All clear, chef.</strong> New tickets pop up here as soon as they’re sent.</p>
		</div>
	{/if}

	<ul class="board">
		{#each pending as t (t.id)}
			{@const m = age(t)}
			<li class="ticket" class:warn={m >= 10} class:late={m >= 20}>
				<div class="thead">
					<span class="kind"><HugeiconsIcon icon={icon(t)} size={22} /></span>
					<div class="who">
						<strong>{where(t)}</strong>
						<small>#{t.number}</small>
					</div>
					<span class="timer"><HugeiconsIcon icon={Clock01Icon} size={14} />{m} min</span>
				</div>
				<!-- A torn-docket divider, like the paper tickets on a kitchen rail. -->
				<div class="tear" aria-hidden="true"></div>
				<ul class="items">
					{#each t.lines as l, i (i)}
						<li>
							<b class="q">{l.qty}</b>
							<span class="name">
								{l.name}
								{#if l.note}<em class="note">{l.note}</em>{/if}
							</span>
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
		display: grid;
		justify-items: center;
		gap: 14px;
		padding: 72px 0;
		color: rgb(255 255 255 / 0.6);
		font-size: 1.125rem;
		text-align: center;
	}
	.empty strong {
		display: block;
		color: var(--cream);
		font-size: 1.375rem;
	}
	.chef {
		display: grid;
		place-items: center;
		width: 88px;
		height: 88px;
		border-radius: 50%;
		background: rgb(255 255 255 / 0.06);
		color: var(--mustard);
		rotate: -8deg;
	}
	/* Tickets in a row share a height, so every Done button lines up along the bottom. */
	.board {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: 16px;
	}
	.ticket {
		--bg: #1c1c1c;
		display: flex;
		flex-direction: column;
		border-radius: 18px;
		background: var(--cream);
		color: var(--ink);
	}
	.ticket.late {
		box-shadow: 0 0 0 3px var(--brand);
	}
	.thead {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 16px 16px 14px;
	}
	.kind {
		display: grid;
		flex: none;
		place-items: center;
		width: 44px;
		height: 44px;
		border-radius: 14px;
		background: #e3f6ec;
		color: #1f7a45;
	}
	.warn .kind {
		background: #fff1c2;
		color: #7a5a00;
	}
	.late .kind {
		background: var(--accent-soft);
		color: var(--brand);
	}
	.who {
		flex: 1;
		min-width: 0;
	}
	.who strong {
		display: block;
		overflow: hidden;
		font: 700 1.25rem var(--sans);
		letter-spacing: -0.01em;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.who small {
		color: var(--muted);
		font: 500 0.8125rem var(--code, var(--sans));
	}
	.timer {
		display: inline-flex;
		flex: none;
		align-items: center;
		gap: 4px;
		align-self: flex-start;
		padding: 4px 10px;
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
		background: var(--brand);
		color: var(--cream);
		animation: nudge 1.6s ease-in-out infinite;
	}
	@keyframes nudge {
		50% {
			scale: 1.08;
		}
	}
	/* Dashed line with two half-circle bites out of the edges. */
	.tear {
		position: relative;
		height: 0;
		margin: 0 16px;
		border-top: 2px dashed rgb(15 23 42 / 0.14);
	}
	.tear::before,
	.tear::after {
		content: '';
		position: absolute;
		top: -10px;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--bg);
	}
	.tear::before {
		left: -26px;
	}
	.tear::after {
		right: -26px;
	}
	.items {
		flex: 1;
		list-style: none;
		margin: 0;
		padding: 14px 16px;
		display: grid;
		align-content: start;
		gap: 10px;
		font-size: 1.125rem;
	}
	.items li {
		display: flex;
		align-items: flex-start;
		gap: 10px;
	}
	.q {
		display: grid;
		flex: none;
		place-items: center;
		min-width: 30px;
		height: 30px;
		padding: 0 6px;
		border-radius: 9px;
		background: var(--black);
		color: var(--mustard);
		font: 800 1rem var(--sans);
		font-variant-numeric: tabular-nums;
	}
	.name {
		padding-top: 2px;
		font-weight: 600;
		line-height: 1.3;
	}
	.note {
		display: block;
		margin-top: 2px;
		color: var(--brand);
		font-size: 0.9375rem;
		font-weight: 700;
	}
	.bump {
		min-height: 56px;
		margin: 0 12px 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		border: 0;
		border-radius: 14px;
		background: var(--black);
		color: var(--cream);
		font: 800 1.0625rem var(--sans);
		cursor: pointer;
		transition:
			background 0.15s,
			transform 0.1s;
	}
	@media (hover: hover) {
		.bump:hover {
			background: var(--green);
		}
	}
	.bump:active {
		background: var(--green);
		transform: scale(0.97);
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
	@media (prefers-reduced-motion: reduce) {
		.late .timer {
			animation: none;
		}
	}
</style>

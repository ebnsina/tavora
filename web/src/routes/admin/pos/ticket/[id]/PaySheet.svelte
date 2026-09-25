<script lang="ts">
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { Cancel01Icon, Tick02Icon } from '@hugeicons/core-free-icons';
	import { price } from '$lib/api';
	import type { Payment, Ticket } from '$lib/pos';

	// Payments are recorded on the tablet first and synced after, so this works offline too.
	let {
		ticket: t,
		onclose,
		onpay,
		ondone
	}: {
		ticket: Ticket;
		onclose: () => void;
		onpay: (p: Omit<Payment, 'id'>) => void;
		ondone: () => void;
	} = $props();

	const methods = [
		{ id: 'cash', label: 'Cash' },
		{ id: 'card', label: 'Card' },
		{ id: 'bkash', label: 'bKash' },
		{ id: 'nagad', label: 'Nagad' }
	] as const;

	let method = $state<(typeof methods)[number]['id']>('cash');
	// Amounts in taka while typing; stored in poisha.
	// svelte-ignore state_referenced_locally
	let amount = $state(t.due / 100);
	let tendered = $state<number | null>(null);
	let tip = $state(0);
	let reference = $state('');
	let lastChange = $state(0);

	const due = $derived(t.due / 100);
	const change = $derived(
		method === 'cash' && tendered !== null ? Math.max(0, tendered - amount) : 0
	);
	// Handy notes: exact, next round hundred, then common notes above it.
	const quick = $derived(
		[
			...new Set(
				[amount, Math.ceil(amount / 100) * 100, 500, 1000, 2000].filter((n) => n >= amount)
			)
		].slice(0, 4)
	);
	const needsRef = $derived(method === 'bkash' || method === 'nagad');
	const ready = $derived(
		amount > 0 &&
			amount <= due &&
			!(method === 'cash' && tendered !== null && tendered < amount) &&
			!(needsRef && !reference.trim())
	);

	function take() {
		lastChange = change;
		onpay({
			method,
			amount: Math.round(amount * 100),
			tip: Math.max(0, Math.round(tip * 100)),
			reference: reference.trim() || null
		});
		amount = t.due / 100;
		tendered = null;
		tip = 0;
		reference = '';
	}
</script>

<div
	class="scrim"
	role="presentation"
	onclick={(e) => e.target === e.currentTarget && t.status === 'open' && onclose()}
>
	<div class="sheet" role="dialog" aria-modal="true" aria-label="Take payment">
		{#if t.status === 'completed'}
			<div class="done">
				<span class="tick"><HugeiconsIcon icon={Tick02Icon} size={48} /></span>
				<h2>Paid in full</h2>
				{#if lastChange > 0}
					<p class="change">Give back <strong>{price(Math.round(lastChange * 100))}</strong></p>
				{/if}
				<p class="muted">The receipt is printing.</p>
				<button type="button" class="big" onclick={ondone}>Back to the floor</button>
			</div>
		{:else}
			<div class="top">
				<div>
					<span class="muted">Left to pay</span>
					<strong class="due">{price(t.due)}</strong>
					{#if t.paid}<span class="muted">{price(t.paid)} already paid</span>{/if}
				</div>
				<button type="button" class="x" aria-label="Close" onclick={onclose}
					><HugeiconsIcon icon={Cancel01Icon} size={22} /></button
				>
			</div>

			<div class="methods" role="radiogroup" aria-label="How they're paying">
				{#each methods as m (m.id)}
					<button
						type="button"
						role="radio"
						aria-checked={method === m.id}
						onclick={() => (method = m.id)}>{m.label}</button
					>
				{/each}
			</div>

			<div class="row2">
				<label>
					Amount to take now (৳)
					<input type="number" min="1" max={due} step="1" bind:value={amount} />
				</label>
				<div class="split">
					<span class="muted">Split the bill</span>
					<div class="chips">
						{#each [2, 3, 4] as n (n)}
							<button type="button" onclick={() => (amount = Math.ceil(due / n))}>÷{n}</button>
						{/each}
						<button type="button" onclick={() => (amount = due)}>All</button>
					</div>
				</div>
			</div>

			{#if method === 'cash'}
				<div class="cash">
					<span class="muted">Cash given</span>
					<div class="chips">
						{#each quick as n (n)}
							<button type="button" aria-pressed={tendered === n} onclick={() => (tendered = n)}
								>{price(n * 100)}</button
							>
						{/each}
					</div>
					<input
						type="number"
						min={amount}
						step="1"
						bind:value={tendered}
						placeholder="Other amount"
						aria-label="Other cash amount"
					/>
					{#if change > 0}<p class="change">
							Change: <strong>{price(Math.round(change * 100))}</strong>
						</p>{/if}
				</div>
			{:else if method === 'bkash' || method === 'nagad'}
				<label>
					Transaction ID from the customer’s phone
					<input bind:value={reference} maxlength="60" placeholder="e.g. 8N7A6B5C4D" required />
				</label>
			{:else}
				<label>
					Card slip number <span class="muted">(optional)</span>
					<input bind:value={reference} maxlength="60" />
				</label>
			{/if}

			<label class="tip">
				Tip (৳) <span class="muted">(optional, on top of the bill)</span>
				<input type="number" min="0" step="1" bind:value={tip} />
			</label>

			<button type="button" class="big" disabled={!ready} onclick={take}>
				{amount < due
					? `Take ${price(Math.round(amount * 100))} now`
					: `Take ${price(Math.round(amount * 100))} and close`}
			</button>
		{/if}
	</div>
</div>

<style>
	.scrim {
		position: fixed;
		inset: 0;
		z-index: 30;
		display: grid;
		place-items: center;
		padding: 16px;
		background: rgb(0 0 0 / 0.5);
	}
	.sheet {
		width: min(560px, 100%);
		max-height: 100%;
		overflow-y: auto;
		display: grid;
		gap: 16px;
		padding: 22px;
		border-radius: 24px;
		background: var(--cream);
	}
	.top {
		display: flex;
		justify-content: space-between;
		align-items: start;
	}
	.top > div {
		display: grid;
	}
	.due {
		font: 800 2.5rem var(--display);
		line-height: 1.1;
	}
	.muted {
		color: var(--muted);
		font-size: 0.875rem;
		font-weight: 600;
	}
	.x {
		width: 48px;
		height: 48px;
		display: grid;
		place-items: center;
		border: 0;
		border-radius: 14px;
		background: var(--soft);
		cursor: pointer;
	}
	.methods {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 8px;
	}
	.methods button,
	.chips button {
		min-height: 56px;
		border: 0;
		border-radius: 14px;
		background: var(--soft);
		font: 800 1rem var(--sans);
		cursor: pointer;
	}
	.methods button[aria-checked='true'],
	.chips button[aria-pressed='true'] {
		background: var(--black);
		color: var(--cream);
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.chips button {
		min-height: 48px;
		padding: 0 14px;
	}
	.row2 {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
		align-items: end;
	}
	.split,
	.cash {
		display: grid;
		gap: 8px;
	}
	label {
		display: grid;
		gap: 6px;
		font-weight: 700;
		font-size: 0.875rem;
	}
	input {
		min-height: 52px;
		padding: 10px 14px;
		border: 0;
		border-radius: 12px;
		background: #fffdf6;
		box-shadow: inset 0 0 0 2px var(--line);
		font: 700 1.25rem var(--sans);
		font-variant-numeric: tabular-nums;
	}
	input:focus {
		outline: none;
		box-shadow: inset 0 0 0 2px var(--black);
	}
	.change {
		margin: 0;
		padding: 12px 14px;
		border-radius: 12px;
		background: #e6f4ea;
		font-size: 1.125rem;
	}
	.big {
		min-height: 64px;
		border: 0;
		border-radius: 16px;
		background: var(--brand);
		color: var(--cream);
		font: 800 1.25rem var(--sans);
		cursor: pointer;
	}
	.big:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	.done {
		display: grid;
		justify-items: center;
		gap: 10px;
		padding: 20px 0;
		text-align: center;
	}
	.done h2 {
		font-size: 2rem;
	}
	.done .big {
		width: 100%;
	}
	.tick {
		width: 88px;
		height: 88px;
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: var(--green);
		color: #fff;
	}
	.scrim {
		animation: fade-in 0.2s ease both;
	}
	.sheet {
		animation: sheet-in 0.28s cubic-bezier(0.2, 0.8, 0.2, 1) both;
	}
	@keyframes fade-in {
		from {
			opacity: 0;
		}
	}
	@keyframes sheet-in {
		from {
			opacity: 0;
			translate: 0 24px;
			scale: 0.98;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.scrim,
		.sheet {
			animation: none;
		}
	}
</style>

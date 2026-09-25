<script lang="ts">
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { Add01Icon, MinusSignIcon } from '@hugeicons/core-free-icons';
	import type { Item } from '$lib/api';
	import { cart, add } from '$lib/order.svelte';

	let { item, compact = false }: { item: Item; compact?: boolean } = $props();
	const qty = $derived(cart.lines[item.id] ?? 0);
</script>

<!-- Fixed-width slot so Add ↔ stepper never reflows the row. -->
<div class="slot">
	{#if !item.available}
		<span class="out">Sold out</span>
	{:else if qty}
		<div class="stepper" role="group" aria-label="{item.name} quantity">
			<button type="button" onclick={() => add(item.id, -1)} aria-label="Remove one {item.name}">
				<HugeiconsIcon icon={MinusSignIcon} size={16} />
			</button>
			{#key qty}<span class="qty" aria-live="polite">{qty}</span>{/key}
			<button type="button" onclick={() => add(item.id)} aria-label="Add one more {item.name}">
				<HugeiconsIcon icon={Add01Icon} size={16} />
			</button>
		</div>
	{:else}
		<button
			class="add"
			class:compact
			type="button"
			onclick={() => add(item.id)}
			aria-label="Add {item.name} to order"
		>
			<HugeiconsIcon icon={Add01Icon} size={16} />{#if !compact}
				Add{/if}
		</button>
	{/if}
</div>

<style>
	.slot {
		display: inline-flex;
		justify-content: flex-end;
		width: 104px;
	}
	.add,
	.stepper {
		display: inline-flex;
		align-items: center;
		height: 40px;
		border-radius: 12px;
		font: 800 0.9375rem var(--display);
		text-transform: uppercase;
	}
	.add {
		gap: 6px;
		padding: 0 16px;
		border: 0;
		background: var(--black);
		color: var(--cream);
		cursor: pointer;
		transition:
			transform 0.15s,
			background 0.15s;
	}
	.add.compact {
		width: 38px;
		height: 38px;
		padding: 0;
		justify-content: center;
		border-radius: 50%;
	}
	.add:hover {
		background: var(--brand);
		transform: rotate(-6deg) scale(1.06);
	}
	.add:active {
		transform: scale(0.92);
	}
	.stepper {
		background: var(--brand);
		color: var(--cream);
		animation: pop 0.25s ease-out;
	}
	.stepper button {
		display: grid;
		place-items: center;
		width: 40px;
		height: 40px;
		border: 0;
		background: none;
		color: inherit;
		cursor: pointer;
		border-radius: 12px;
	}
	.stepper button:hover {
		background: rgb(255 255 255 / 0.15);
	}
	.qty {
		min-width: 20px;
		text-align: center;
		animation: pop 0.2s ease-out;
	}
	.out {
		align-self: center;
		padding: 6px 10px;
		border-radius: 8px;
		background: var(--soft);
		color: var(--muted);
		font: 800 0.75rem var(--display);
		text-transform: uppercase;
		rotate: -4deg;
	}
	@keyframes pop {
		from {
			transform: scale(0.85);
		}
	}
</style>

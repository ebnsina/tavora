<script lang="ts">
	import { fly } from 'svelte/transition';
	import { ms } from '$lib/motion';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { ArrowDown01Icon, FilterIcon, Tick02Icon } from '@hugeicons/core-free-icons';

	// A filter as one button: "Status · Active ▾" opens the choices; each choice is a link.
	let {
		label,
		options
	}: { label: string; options: { label: string; href: string; current: boolean }[] } = $props();

	let open = $state(false);
	let root = $state<HTMLDivElement>();
	const current = $derived(options.find((o) => o.current)?.label ?? options[0]?.label);
	function outside(e: MouseEvent) {
		if (open && root && !root.contains(e.target as Node)) open = false;
	}
</script>

<svelte:window onclick={outside} onkeydown={(e) => e.key === 'Escape' && (open = false)} />

<div class="ms" bind:this={root}>
	<button
		type="button"
		class="trigger"
		aria-haspopup="menu"
		aria-expanded={open}
		onclick={() => (open = !open)}
	>
		<HugeiconsIcon icon={FilterIcon} size={16} />
		<span class="lbl">{label}</span><span class="dot">·</span><strong>{current}</strong>
		<span class="chev"><HugeiconsIcon icon={ArrowDown01Icon} size={16} /></span>
	</button>
	{#if open}
		<div class="list" role="menu" aria-label={label} transition:fly={{ y: -6, duration: ms(160) }}>
			{#each options as o (o.href)}
				<a
					role="menuitemradio"
					aria-checked={o.current}
					href={o.href}
					onclick={() => (open = false)}
				>
					{o.label}
					{#if o.current}<HugeiconsIcon icon={Tick02Icon} size={16} />{/if}
				</a>
			{/each}
		</div>
	{/if}
</div>

<style>
	.ms {
		position: relative;
	}
	.trigger {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		min-height: 40px;
		padding: 0 12px;
		border: 0;
		border-radius: 10px;
		background: #ffffff;
		box-shadow: inset 0 0 0 1px var(--line);
		color: var(--ink);
		font: 500 0.9375rem var(--sans);
		white-space: nowrap;
		cursor: pointer;
	}
	.trigger:hover {
		box-shadow: inset 0 0 0 1px #cbd5e1;
	}
	.trigger[aria-expanded='true'],
	.trigger:focus-visible {
		outline: 2px solid var(--brand);
		outline-offset: 2px;
		box-shadow: inset 0 0 0 1px #e2e8f0;
	}
	.trigger :global(svg:first-child) {
		color: var(--brand);
	}
	.lbl,
	.dot {
		color: var(--muted);
	}
	.chev {
		display: grid;
		color: var(--muted);
		transition: rotate 0.2s;
	}
	[aria-expanded='true'] .chev {
		rotate: 180deg;
	}
	.list {
		position: absolute;
		z-index: 30;
		top: calc(100% + 8px);
		right: 0;
		display: grid;
		min-width: 200px;
		padding: 6px;
		border-radius: 12px;
		background: #ffffff;
		box-shadow:
			0 0 0 1px var(--line),
			0 24px 48px -16px rgb(15 23 42 / 0.3);
	}
	.list a {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 9px 12px;
		border-radius: 8px;
		color: var(--ink);
		font-size: 0.9375rem;
		font-weight: 600;
		text-decoration: none;
	}
	.list a:hover {
		background: var(--soft);
	}
	.list [aria-checked='true'] {
		color: var(--brand);
	}
	@media (max-width: 759px) {
		.list {
			left: 0;
			right: auto;
		}
	}
</style>

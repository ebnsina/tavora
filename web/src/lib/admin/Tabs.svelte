<script lang="ts">
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { replaceState } from '$app/navigation';
	import { onMount } from 'svelte';

	type Tab = { id: string; label: string; icon?: unknown; count?: number; dot?: boolean };
	// Horizontal page tabs. The open tab lives in the URL hash, so a reload or a shared link keeps it.
	let {
		tabs,
		active = $bindable(),
		label
	}: { tabs: Tab[]; active: string; label: string } = $props();

	let bar = $state<HTMLDivElement>();
	let fadeL = $state(false);
	let fadeR = $state(false);
	// Fade the edge that has more tabs behind it, so it's clear the bar scrolls.
	function edges() {
		if (!bar) return;
		fadeL = bar.scrollLeft > 4;
		fadeR = bar.scrollLeft + bar.clientWidth < bar.scrollWidth - 4;
	}
	onMount(() => {
		const id = decodeURIComponent(location.hash.slice(1));
		if (tabs.some((t) => t.id === id)) active = id;
		edges();
		const ro = new ResizeObserver(edges);
		ro.observe(bar!);
		return () => ro.disconnect();
	});
	$effect(() => {
		document
			.getElementById(`tab-${active}`)
			?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
	});
	function select(id: string) {
		active = id;
		replaceState(`#${id}`, {});
	}
	// Arrow keys move between tabs, as screen-reader users expect from a tablist.
	function key(e: KeyboardEvent, i: number) {
		const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
		if (!d) return;
		e.preventDefault();
		const next = tabs[(i + d + tabs.length) % tabs.length];
		select(next.id);
		document.getElementById(`tab-${next.id}`)?.focus();
	}
</script>

<div
	class="tabs"
	class:fade-l={fadeL}
	class:fade-r={fadeR}
	role="tablist"
	aria-label={label}
	bind:this={bar}
	onscroll={edges}
>
	{#each tabs as t, i (t.id)}
		<button
			type="button"
			role="tab"
			id="tab-{t.id}"
			aria-selected={active === t.id}
			aria-controls="panel-{t.id}"
			tabindex={active === t.id ? 0 : -1}
			onclick={() => select(t.id)}
			onkeydown={(e) => key(e, i)}
		>
			{#if t.icon}<HugeiconsIcon icon={t.icon as never} size={18} />{/if}
			<span class="lbl"
				>{t.label}{#if t.count !== undefined}<span class="count">{t.count}</span>{/if}</span
			>
			{#if t.dot}<span class="dot" aria-label="needs fixing"></span>{/if}
		</button>
	{/each}
</div>

<style>
	/* Desktop and tablet: a quiet underline bar. Phones: the floating tab bar (see below). */
	.tabs {
		display: flex;
		gap: 4px;
		max-width: 100%;
		margin: -4px 0 20px;
		overflow-x: auto;
		scrollbar-width: none;
		overscroll-behavior-x: contain;
	}
	.fade-r {
		mask-image: linear-gradient(to right, #000 calc(100% - 48px), transparent);
	}
	.fade-l {
		mask-image: linear-gradient(to left, #000 calc(100% - 48px), transparent);
	}
	.fade-l.fade-r {
		mask-image: linear-gradient(to right, transparent, #000 48px, #000 calc(100% - 48px), transparent);
	}
	button {
		position: relative;
		display: flex;
		flex: none;
		align-items: center;
		gap: 8px;
		padding: 12px 14px;
		border: 0;
		/* The current tab's underline: a 2px bottom border whose ends curve up with the rounded corners. */
		border-bottom: 2px solid transparent;
		border-radius: 12px;
		background: none;
		color: var(--muted);
		font: 600 0.9375rem var(--sans);
		white-space: nowrap;
		cursor: pointer;
		transition:
			color 0.2s,
			border-color 0.2s;
	}
	button:hover,
	button[aria-selected='true'] {
		color: var(--ink);
	}
	button[aria-selected='true'] {
		border-bottom-color: var(--brand);
	}
	button:focus-visible {
		outline: 2px solid var(--brand);
		outline-offset: -4px;
		border-radius: 8px;
	}
	.lbl {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}
	.count {
		min-width: 20px;
		padding: 0 6px;
		border-radius: 999px;
		background: var(--soft);
		color: var(--muted);
		font-size: 0.75rem;
		line-height: 20px;
		text-align: center;
	}
	[aria-selected='true'] .count {
		background: var(--ink);
		color: var(--cream);
	}
	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--brand);
	}

	/* Phones: the same floating bar as the bottom navigation. */
	@media (max-width: 759px) {
		.tabs {
			width: fit-content;
			padding: 6px;
			border-bottom: 0;
			border-radius: 20px;
			background: #fffdf6;
			box-shadow:
				0 0 0 1px var(--line),
				0 8px 24px -12px rgb(40 20 0 / 0.2);
		}
		button {
			display: grid;
			justify-items: center;
			align-content: center;
			gap: 4px;
			min-width: 84px;
			padding: 10px 14px 14px;
			border-radius: 14px;
			font-size: 0.8125rem;
			transition:
				background 0.2s,
				color 0.2s;
		}
		button,
		button[aria-selected='true'] {
			border-bottom: 0;
		}
		button[aria-selected='true'] {
			background: var(--soft);
		}
		button[aria-selected='true']::after {
			content: '';
			position: absolute;
			bottom: 5px;
			width: 18px;
			height: 4px;
			border-radius: 2px;
			background: var(--brand);
			animation: pill 0.25s cubic-bezier(0.2, 0.8, 0.2, 1) both;
		}
		.dot {
			position: absolute;
			top: 8px;
			right: 12px;
		}
	}
	@keyframes pill {
		from {
			width: 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		button[aria-selected='true']::after {
			animation: none;
		}
	}
</style>

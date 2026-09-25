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

	// One underline that slides to the current tab, measured because only the browser knows a word's width.
	let mark = $state({ x: 0, w: 0 });
	let placed = $state(false);
	function measure() {
		const el = document.getElementById(`tab-${active}`);
		if (el) mark = { x: el.offsetLeft, w: el.offsetWidth };
	}
	$effect(() => {
		void active;
		void tabs;
		measure();
		// The first placement isn't a move, so it shouldn't animate from zero.
		if (!placed) requestAnimationFrame(() => (placed = true));
	});
	$effect(() => {
		if (!bar) return;
		const ro = new ResizeObserver(measure);
		ro.observe(bar);
		return () => ro.disconnect();
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

<!-- The rule sits on the outer element, which never scrolls; the tabs scroll inside it. -->
<div class="tabs">
	<div
		class="strip"
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
				{#if t.icon}<HugeiconsIcon icon={t.icon as never} size={16} />{/if}
				<span class="lbl"
					>{t.label}{#if t.count !== undefined}<span class="count">{t.count}</span>{/if}</span
				>
				{#if t.dot}<span class="dot" aria-label="needs fixing"></span>{/if}
			</button>
		{/each}
		<span
			class="bar"
			class:placed
			aria-hidden="true"
			style="transform: translateX({mark.x}px); width: {mark.w}px"
		></span>
	</div>
</div>

<style>
	/* A hairline across the page with the current tab sitting on it: a soft tint behind the tab,
	   the word in the brand colour, and one underline that slides between tabs. */
	.tabs {
		margin: 0 0 20px;
		border-bottom: 1px solid var(--line);
	}
	.strip {
		position: relative;
		display: flex;
		gap: 4px;
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
		mask-image: linear-gradient(
			to right,
			transparent,
			#000 48px,
			#000 calc(100% - 48px),
			transparent
		);
	}
	button {
		display: flex;
		flex: none;
		align-items: center;
		gap: 8px;
		padding: 10px 14px;
		border: 0;
		border-radius: 12px 12px 0 0;
		background: none;
		color: var(--muted);
		font: 500 0.9375rem var(--sans);
		white-space: nowrap;
		cursor: pointer;
		transition:
			background 0.14s,
			color 0.14s;
	}
	/* Hover changes the ground, not the word, so a tab never changes width under the pointer. */
	@media (hover: hover) and (pointer: fine) {
		button:hover:not([aria-selected='true']) {
			background: rgb(15 23 42 / 0.04);
			color: var(--ink);
		}
	}
	button[aria-selected='true'] {
		background: var(--accent-soft);
		color: color-mix(in srgb, var(--brand) 85%, black);
		font-weight: 600;
	}
	button:focus-visible {
		outline: 2px solid var(--brand);
		outline-offset: -2px;
	}
	.bar {
		position: absolute;
		left: 0;
		bottom: 0;
		height: 2px;
		border-radius: 2px 2px 0 0;
		background: var(--brand);
		opacity: 0;
		pointer-events: none;
	}
	.bar.placed {
		opacity: 1;
		transition:
			transform 220ms cubic-bezier(0.32, 0.72, 0, 1),
			width 220ms cubic-bezier(0.32, 0.72, 0, 1);
	}
	.lbl {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}
	.count {
		min-width: 18px;
		padding: 0 6px;
		border-radius: 999px;
		background: rgb(15 23 42 / 0.06);
		color: var(--muted);
		font: 600 0.6875rem / 18px var(--sans);
		font-variant-numeric: tabular-nums;
		text-align: center;
	}
	[aria-selected='true'] .count {
		background: var(--brand);
		color: #fff;
	}
	.dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--brand);
	}
	@media (prefers-reduced-motion: reduce) {
		.bar.placed {
			transition: none;
		}
	}
</style>

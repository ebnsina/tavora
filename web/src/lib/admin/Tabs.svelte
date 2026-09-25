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

	onMount(() => {
		const id = decodeURIComponent(location.hash.slice(1));
		if (tabs.some((t) => t.id === id)) active = id;
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

<div class="tabs" role="tablist" aria-label={label}>
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
			{t.label}
			{#if t.count !== undefined}<span class="count">{t.count}</span>{/if}
			{#if t.dot}<span class="dot" aria-label="needs fixing"></span>{/if}
		</button>
	{/each}
</div>

<style>
	.tabs {
		display: flex;
		gap: 4px;
		margin: -4px 0 20px;
		overflow-x: auto;
		border-bottom: 1px solid var(--line);
		scrollbar-width: none;
	}
	button {
		position: relative;
		display: flex;
		flex: none;
		align-items: center;
		gap: 8px;
		padding: 12px 14px;
		border: 0;
		background: none;
		color: var(--muted);
		font: 600 0.9375rem var(--sans);
		white-space: nowrap;
		cursor: pointer;
	}
	button:hover {
		color: var(--ink);
	}
	button[aria-selected='true'] {
		color: var(--ink);
	}
	button[aria-selected='true']::after {
		content: '';
		position: absolute;
		inset: auto 8px -1px;
		height: 2px;
		border-radius: 2px;
		background: var(--brand);
	}
	button:focus-visible {
		outline: 2px solid var(--brand);
		outline-offset: -4px;
		border-radius: 8px;
	}
	.count {
		min-width: 22px;
		padding: 1px 7px;
		border-radius: 999px;
		background: var(--soft);
		color: var(--muted);
		font-size: 0.75rem;
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
</style>

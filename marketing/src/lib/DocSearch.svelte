<script lang="ts">
	import { goto } from '$app/navigation';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { Search01Icon } from '@hugeicons/core-free-icons';
	import { guides, plain, slugify } from '$lib/docs';

	let q = $state('');
	let input = $state<HTMLInputElement>();
	let active = $state(0);

	// Every guide and section heading, matched on its own words and the text under it.
	const index = guides.flatMap((g) => [
		{
			href: `/docs/${g.slug}`,
			title: g.title,
			where: g.group,
			text: plain(g.title + ' ' + g.summary)
		},
		...g.sections.map((s) => ({
			href: `/docs/${g.slug}#${slugify(s.heading)}`,
			title: s.heading,
			where: g.title,
			text: plain([s.heading, s.text, ...(s.steps ?? []), ...(s.tips ?? [])].join(' '))
		}))
	]);
	const results = $derived.by(() => {
		const words = q.toLowerCase().split(/\s+/).filter(Boolean);
		if (!words.length) return [];
		return index.filter((r) => words.every((w) => r.text.toLowerCase().includes(w))).slice(0, 8);
	});

	function key(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') active = Math.min(active + 1, results.length - 1);
		else if (e.key === 'ArrowUp') active = Math.max(active - 1, 0);
		else if (e.key === 'Enter' && results[active]) open(results[active].href);
		else if (e.key === 'Escape') q = '';
		else return;
		e.preventDefault();
	}
	function open(href: string) {
		q = '';
		input?.blur();
		goto(href);
	}
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
			e.preventDefault();
			input?.focus();
		}
	}}
/>

<div class="search">
	<HugeiconsIcon icon={Search01Icon} size={16} />
	<input
		bind:this={input}
		bind:value={q}
		oninput={() => (active = 0)}
		onkeydown={key}
		placeholder="Search the docs"
		aria-label="Search the docs"
		role="combobox"
		aria-expanded={results.length > 0}
		aria-controls="doc-results"
		autocomplete="off"
	/>
	<kbd>/</kbd>
	{#if q.trim()}
		<ul id="doc-results" role="listbox">
			{#each results as r, i (r.href)}
				<li role="option" aria-selected={i === active}>
					<a href={r.href} onclick={(e) => (e.preventDefault(), open(r.href))}>
						<span>{r.title}</span><small>{r.where}</small>
					</a>
				</li>
			{:else}
				<li class="none">No results for “{q}”</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.search {
		position: relative;
		display: flex;
		align-items: center;
		gap: var(--s2);
		width: 100%;
		max-width: 360px;
		height: 36px;
		padding: 0 var(--s2) 0 var(--s3);
		border-radius: 8px;
		background: var(--surface);
		box-shadow: 0 0 0 1px var(--line);
		color: var(--faint);
	}
	@media (max-width: 900px) {
		.search {
			flex: 1;
			min-width: 0;
		}
		kbd {
			display: none;
		}
	}
	.search:focus-within {
		outline: 2px solid var(--brand);
		outline-offset: 2px;
		box-shadow: inset 0 0 0 1px #e2e8f0;
	}
	.search input:focus-visible {
		outline: none;
	}
	input {
		flex: 1;
		min-width: 0;
		border: 0;
		background: none;
		color: var(--ink);
		font: var(--t-sm) var(--sans);
		outline: none;
	}
	kbd {
		padding: 1px 6px;
		border-radius: 4px;
		box-shadow: 0 0 0 1px var(--line);
		font-size: var(--t-xs);
	}
	ul {
		position: absolute;
		top: calc(100% + 6px);
		left: 0;
		right: 0;
		z-index: 20;
		margin: 0;
		padding: var(--s1);
		border-radius: 10px;
		background: var(--surface);
		box-shadow:
			0 0 0 1px var(--line),
			0 16px 32px -12px rgb(40 20 0 / 0.25);
		list-style: none;
	}
	a {
		display: grid;
		padding: var(--s2) var(--s3);
		border-radius: 6px;
		color: var(--ink);
		text-decoration: none;
	}
	[aria-selected='true'] a,
	a:hover {
		background: var(--soft);
	}
	a span {
		font-size: var(--t-sm);
		font-weight: 500;
	}
	small {
		color: var(--faint);
		font-size: var(--t-xs);
	}
	.none {
		padding: var(--s3);
		color: var(--muted);
		font-size: var(--t-sm);
	}
</style>

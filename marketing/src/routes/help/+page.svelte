<script lang="ts">
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { ArrowRight01Icon, Search01Icon } from '@hugeicons/core-free-icons';
	import Seo from '$lib/Seo.svelte';
	import { groups, guides } from '$lib/docs';

	let q = $state('');
	// Matches titles, summaries and every word inside a guide.
	const match = (g: (typeof guides)[number]) =>
		!q.trim() || JSON.stringify(g).toLowerCase().includes(q.trim().toLowerCase());
	const shown = $derived(guides.filter(match));
</script>

<Seo
	title="Help"
	description="Simple guides for every screen in Tavora: the till, online orders, bookings, menu, staff, VAT, printing and more."
	path="/help"
/>

<section class="wrap head">
	<p class="pill">Help</p>
	<h1>How to use Tavora</h1>
	<p class="lead">Short, plain guides for every screen. Each one takes a minute to read.</p>
	<label class="search">
		<HugeiconsIcon icon={Search01Icon} size={20} />
		<input
			bind:value={q}
			placeholder="Search, e.g. split bill, printer, PIN"
			aria-label="Search the guides"
		/>
	</label>
</section>

{#each groups as g (g)}
	{@const list = shown.filter((x) => x.group === g)}
	{#if list.length}
		<section class="wrap group">
			<h2>{g}</h2>
			<div class="cards">
				{#each list as guide (guide.slug)}
					<a class="card" href="/help/{guide.slug}">
						<strong>{guide.title}</strong>
						<span>{guide.summary}</span>
						<HugeiconsIcon icon={ArrowRight01Icon} size={20} />
					</a>
				{/each}
			</div>
		</section>
	{/if}
{/each}
{#if !shown.length}<p class="wrap none">
		Nothing matches “{q}”. Try another word, or message us on WhatsApp.
	</p>{/if}

<style>
	.head {
		padding-top: 64px;
	}
	h1 {
		margin-bottom: 16px;
		font-size: clamp(2.75rem, 7vw, 5rem);
	}
	.search {
		display: flex;
		align-items: center;
		gap: 10px;
		max-width: 560px;
		margin-top: 24px;
		padding: 0 16px;
		border-radius: 14px;
		background: #fffdf6;
		box-shadow: inset 0 0 0 2px var(--black);
	}
	.search input {
		flex: 1;
		min-height: 52px;
		border: 0;
		background: none;
		font: 1.0625rem var(--sans);
		outline: none;
	}
	.group {
		padding-top: 48px;
	}
	h2 {
		margin-bottom: 16px;
		font-size: 1.75rem;
	}
	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 14px;
	}
	.card {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 6px 12px;
		align-items: center;
		padding: 20px;
		border-radius: 18px;
		background: var(--soft);
		text-decoration: none;
		transition: transform 0.15s;
	}
	.card:hover {
		transform: translateY(-2px);
	}
	.card strong {
		font-size: 1.125rem;
	}
	.card span {
		grid-column: 1;
		color: var(--muted);
	}
	.card :global(svg) {
		grid-row: 1 / 3;
		grid-column: 2;
		color: var(--brand);
	}
	.none {
		padding-top: 32px;
		color: var(--muted);
	}
</style>

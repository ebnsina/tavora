<script lang="ts">
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { ArrowRight02Icon } from '@hugeicons/core-free-icons';
	import Seo from '$lib/Seo.svelte';
	import { groups, guides } from '$lib/docs';

	const start = guides.slice(0, 1)[0];
</script>

<Seo
	title="Docs"
	description="How to use Tavora: the till, online orders, bookings, menu, staff, VAT, printing and more, in plain words."
	path="/docs"
/>

<div class="page">
	<span class="eyebrow">Documentation</span>
	<h1>Tavora docs</h1>
	<p class="lead">
		Short guides for every screen of the dashboard and the till. New here? Start with
		<a href="/docs/{start.slug}">{start.title}</a>.
	</p>

	{#each groups as g (g)}
		<section>
			<h2>{g}</h2>
			<div class="cards">
				{#each guides.filter((x) => x.group === g) as x (x.slug)}
					<a class="card" href="/docs/{x.slug}">
						<span class="t">{x.title} <HugeiconsIcon icon={ArrowRight02Icon} size={16} /></span>
						<span class="d">{x.summary}</span>
					</a>
				{/each}
			</div>
		</section>
	{/each}
</div>

<style>
	.page {
		max-width: 880px;
		padding: var(--s8) var(--s7) var(--s9);
	}
	h1 {
		font-size: var(--t-2xl);
	}
	.lead {
		margin-top: var(--s3);
		color: var(--muted);
		font-size: var(--t-lg);
	}
	.lead a {
		color: var(--brand);
	}
	section {
		margin-top: var(--s7);
	}
	h2 {
		margin-bottom: var(--s4);
		font-size: var(--t-md);
		letter-spacing: 0;
	}
	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: var(--s3);
	}
	.card {
		display: grid;
		gap: var(--s1);
		padding: var(--s4);
		border-radius: 10px;
		background: var(--surface);
		box-shadow: 0 0 0 1px var(--line);
		text-decoration: none;
		transition: box-shadow 0.15s;
	}
	.card:hover {
		box-shadow: 0 0 0 1px var(--brand);
	}
	.t {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-weight: 600;
		font-size: var(--t-sm);
	}
	.t :global(svg) {
		color: var(--faint);
	}
	.d {
		color: var(--muted);
		font-size: var(--t-sm);
		line-height: 1.5;
	}
	@media (max-width: 900px) {
		.page {
			padding: var(--s7) var(--s4) var(--s8);
		}
	}
</style>

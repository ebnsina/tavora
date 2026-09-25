<script lang="ts">
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		ArrowLeft01Icon,
		ArrowRight01Icon,
		BulbIcon,
		Link01Icon
	} from '@hugeicons/core-free-icons';
	import Rich from '$lib/Rich.svelte';
	import Seo from '$lib/Seo.svelte';
	import Shot from '$lib/Shot.svelte';
	import { plain, slugify } from '$lib/docs';

	let { data } = $props();
	const g = $derived(data.guide);
</script>

<Seo title="{g.title} · Docs" description={plain(g.summary)} path="/docs/{g.slug}" />

<div class="doc">
	<article>
		<p class="crumbs"><a href="/docs">Docs</a> / {g.group}</p>
		<h1>{g.title}</h1>
		<p class="lead"><Rich text={g.summary} /></p>
		{#if g.shot}<div class="shot"><Shot name={g.shot} alt="The {g.title} screen" /></div>{/if}

		{#each g.sections as s (s.heading)}
			<section id={slugify(s.heading)}>
				<h2>
					<a href="#{slugify(s.heading)}" aria-label="Link to this section">
						{s.heading}<HugeiconsIcon icon={Link01Icon} size={16} />
					</a>
				</h2>
				{#if s.text}<p><Rich text={s.text} /></p>{/if}
				{#if s.steps}
					<ol>
						{#each s.steps as step (step)}<li><Rich text={step} /></li>{/each}
					</ol>
				{/if}
				{#each s.tips ?? [] as tip (tip)}
					<div class="note" role="note">
						<HugeiconsIcon icon={BulbIcon} size={16} />
						<p><Rich text={tip} /></p>
					</div>
				{/each}
			</section>
		{/each}

		<nav class="pager" aria-label="Next and previous guides">
			{#if data.prev}
				<a href="/docs/{data.prev.slug}">
					<small><HugeiconsIcon icon={ArrowLeft01Icon} size={16} /> Previous</small>
					<span>{data.prev.title}</span>
				</a>
			{:else}<span></span>{/if}
			{#if data.next}
				<a class="next" href="/docs/{data.next.slug}">
					<small>Next <HugeiconsIcon icon={ArrowRight01Icon} size={16} /></small>
					<span>{data.next.title}</span>
				</a>
			{/if}
		</nav>
	</article>

	<nav class="toc" aria-label="On this page">
		<p>On this page</p>
		{#each g.sections as s (s.heading)}<a href="#{slugify(s.heading)}">{s.heading}</a>{/each}
	</nav>
</div>

<style>
	.doc {
		display: grid;
		grid-template-columns: minmax(0, 720px) 200px;
		justify-content: space-between;
		gap: var(--s7);
		max-width: 1080px;
		padding: var(--s7) var(--s7) var(--s9);
	}
	.crumbs {
		margin-bottom: var(--s3);
		color: var(--faint);
		font: 500 var(--t-xs) / 1 var(--mono);
	}
	.crumbs a {
		color: var(--muted);
		text-decoration: none;
	}
	h1 {
		font-size: var(--t-2xl);
	}
	.lead {
		margin-top: var(--s3);
		color: var(--muted);
		font-size: var(--t-lg);
	}
	.shot {
		margin-top: var(--s6);
	}
	section {
		margin-top: var(--s7);
		scroll-margin-top: 84px;
	}
	h2 {
		margin-bottom: var(--s3);
		font-size: var(--t-xl);
	}
	h2 a {
		display: inline-flex;
		align-items: center;
		gap: var(--s2);
		text-decoration: none;
	}
	h2 a :global(svg) {
		color: var(--faint);
		opacity: 0;
		transition: opacity 0.15s;
	}
	h2 a:hover :global(svg),
	h2 a:focus-visible :global(svg) {
		opacity: 1;
	}
	section p {
		margin-bottom: var(--s3);
	}
	ol {
		display: grid;
		gap: var(--s3);
		margin: 0 0 var(--s4);
		padding: 0;
		list-style: none;
		counter-reset: step;
	}
	ol li {
		position: relative;
		padding-left: 40px;
		counter-increment: step;
	}
	ol li::before {
		content: counter(step);
		position: absolute;
		left: 0;
		top: 1px;
		display: grid;
		place-items: center;
		width: 26px;
		height: 26px;
		border-radius: 7px;
		background: var(--soft);
		color: var(--muted);
		font: 500 var(--t-xs) / 1 var(--mono);
	}
	:global(.doc code) {
		padding: 1px 6px;
		border-radius: 5px;
		background: var(--surface);
		box-shadow: 0 0 0 1px var(--line);
		font-size: 0.85em;
		white-space: nowrap;
	}
	.note {
		display: flex;
		gap: var(--s3);
		margin: var(--s3) 0;
		padding: var(--s3) var(--s4);
		border-radius: 8px;
		background: #fff6d6;
		box-shadow: inset 3px 0 0 var(--mustard);
		font-size: var(--t-sm);
	}
	.note :global(svg) {
		flex: none;
		margin-top: 3px;
		color: #9a6b00;
	}
	.note p {
		margin: 0;
	}
	.pager {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--s4);
		margin-top: var(--s8);
	}
	.pager a {
		display: grid;
		gap: var(--s1);
		padding: var(--s4);
		border-radius: 10px;
		box-shadow: 0 0 0 1px var(--line);
		text-decoration: none;
	}
	.pager a:hover {
		box-shadow: 0 0 0 1px var(--brand);
	}
	.pager .next {
		text-align: right;
	}
	.pager small {
		display: inline-flex;
		align-items: center;
		gap: var(--s1);
		color: var(--faint);
		font-size: var(--t-xs);
	}
	.pager .next small {
		justify-content: flex-end;
	}
	.pager span {
		font-weight: 600;
	}
	.toc {
		position: sticky;
		top: 92px;
		align-self: start;
		display: grid;
		gap: var(--s2);
		font-size: var(--t-sm);
	}
	.toc p {
		margin-bottom: var(--s1);
		color: var(--faint);
		font: 500 0.75rem / 1 var(--mono);
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}
	.toc a {
		color: var(--muted);
		text-decoration: none;
	}
	.toc a:hover {
		color: var(--ink);
	}
	@media (max-width: 1180px) {
		.doc {
			grid-template-columns: minmax(0, 720px);
		}
		.toc {
			display: none;
		}
	}
	@media (max-width: 900px) {
		.doc {
			padding: var(--s6) var(--s4) var(--s8);
		}
	}
</style>

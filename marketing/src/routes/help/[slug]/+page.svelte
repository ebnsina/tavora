<script lang="ts">
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		ArrowLeft01Icon,
		ArrowRight01Icon,
		BulbIcon,
		WhatsappIcon
	} from '@hugeicons/core-free-icons';
	import Seo from '$lib/Seo.svelte';
	import Shot from '$lib/Shot.svelte';
	import { guides, groups } from '$lib/docs';
	import { site } from '$lib/site';

	let { data } = $props();
	const g = $derived(data.guide);
</script>

<Seo title="{g.title} · Help" description={g.summary} path="/help/{g.slug}" />

<div class="wrap page">
	<aside aria-label="All guides">
		{#each groups as grp (grp)}
			<p class="grp">{grp}</p>
			{#each guides.filter((x) => x.group === grp) as x (x.slug)}
				<a href="/help/{x.slug}" aria-current={x.slug === g.slug ? 'page' : undefined}>{x.title}</a>
			{/each}
		{/each}
	</aside>

	<article>
		<nav class="crumbs" aria-label="Breadcrumb">
			<a href="/help">Help</a>
			<HugeiconsIcon icon={ArrowRight01Icon} size={14} /> <span>{g.group}</span>
		</nav>
		<h1>{g.title}</h1>
		<p class="lead">{g.summary}</p>
		{#if g.shot}<Shot name={g.shot} alt="The {g.title} screen" />{/if}

		{#each g.sections as s (s.heading)}
			<section>
				<h2>{s.heading}</h2>
				{#if s.text}<p>{s.text}</p>{/if}
				{#if s.steps}
					<ol>
						{#each s.steps as step (step)}<li>{step}</li>{/each}
					</ol>
				{/if}
				{#each s.tips ?? [] as tip (tip)}
					<p class="tip"><HugeiconsIcon icon={BulbIcon} size={20} /> {tip}</p>
				{/each}
			</section>
		{/each}

		<nav class="pager" aria-label="More guides">
			{#if data.prev}<a href="/help/{data.prev.slug}"
					><HugeiconsIcon icon={ArrowLeft01Icon} size={18} /> {data.prev.title}</a
				>{:else}<span></span>{/if}
			{#if data.next}<a class="next" href="/help/{data.next.slug}"
					>{data.next.title} <HugeiconsIcon icon={ArrowRight01Icon} size={18} /></a
				>{/if}
		</nav>

		<p class="stuck">
			Still stuck? <a href={site.whatsapp} target="_blank" rel="noopener"
				><HugeiconsIcon icon={WhatsappIcon} size={18} /> Message us on WhatsApp</a
			>
		</p>
	</article>
</div>

<style>
	.page {
		display: grid;
		grid-template-columns: 240px 1fr;
		gap: 48px;
		padding-top: 48px;
	}
	aside {
		position: sticky;
		top: 88px;
		align-self: start;
		display: grid;
		gap: 2px;
		max-height: calc(100dvh - 104px);
		overflow-y: auto;
	}
	.grp {
		margin: 16px 0 4px;
		color: var(--muted);
		font-size: 0.75rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	.grp:first-child {
		margin-top: 0;
	}
	aside a {
		padding: 6px 10px;
		border-radius: 8px;
		font-weight: 600;
		text-decoration: none;
	}
	aside a[aria-current] {
		background: var(--black);
		color: var(--cream);
	}
	article {
		max-width: 760px;
	}
	.crumbs {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 12px;
		color: var(--muted);
		font-weight: 600;
	}
	h1 {
		margin-bottom: 12px;
		font-size: clamp(2.5rem, 6vw, 4rem);
	}
	.lead {
		margin: 0 0 28px;
	}
	section {
		margin-top: 36px;
	}
	h2 {
		margin-bottom: 12px;
		font-size: 1.625rem;
	}
	section p {
		margin: 0 0 12px;
		font-size: 1.125rem;
	}
	ol {
		display: grid;
		gap: 10px;
		margin: 0 0 12px;
		padding: 0;
		list-style: none;
		counter-reset: step;
		font-size: 1.125rem;
	}
	ol li {
		position: relative;
		padding-left: 44px;
		counter-increment: step;
	}
	ol li::before {
		content: counter(step);
		position: absolute;
		left: 0;
		top: -1px;
		display: grid;
		place-items: center;
		width: 30px;
		height: 30px;
		border-radius: 50%;
		background: var(--brand);
		color: var(--cream);
		font-weight: 800;
		font-size: 0.9375rem;
	}
	.tip {
		display: flex;
		gap: 10px;
		padding: 14px 16px;
		border-radius: 14px;
		background: #fff3c4;
	}
	.tip :global(svg) {
		flex: none;
		margin-top: 3px;
	}
	.pager {
		display: flex;
		justify-content: space-between;
		gap: 16px;
		margin-top: 56px;
		padding-top: 24px;
		border-top: 2px solid var(--black);
	}
	.pager a {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-weight: 700;
		text-decoration: none;
	}
	.stuck {
		margin-top: 32px;
		color: var(--muted);
	}
	.stuck a {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-weight: 700;
		color: var(--ink);
	}
	@media (max-width: 900px) {
		.page {
			grid-template-columns: 1fr;
		}
		aside {
			display: none;
		}
	}
</style>

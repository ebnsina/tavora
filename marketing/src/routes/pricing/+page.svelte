<script lang="ts">
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		CheckmarkBadge01Icon,
		Tick02Icon,
		WhatsappIcon,
		Wrench01Icon
	} from '@hugeicons/core-free-icons';
	import Seo from '$lib/Seo.svelte';
	import { care, plans, promises, setup } from '$lib/pricing';
	import { site, taka } from '$lib/site';

	const firstYear = (monthly: number) => setup.price + monthly * 12;
</script>

<Seo
	title="Pricing"
	description="Fixed prices in taka: a one-time setup, then a monthly plan. No commission on orders, no hidden fees, cancel any month."
	path="/pricing"
/>

<section class="wrap head">
	<p class="pill">Pricing</p>
	<h1>Fixed prices. No commission.</h1>
	<p class="lead">
		A one-time setup to get you running, then one monthly price. Every taka from your orders stays
		yours.
	</p>
</section>

<section class="wrap plans" aria-label="Monthly plans">
	{#each plans as p (p.id)}
		<article class="plan" class:featured={p.featured}>
			{#if p.featured}<span class="tag"
					><HugeiconsIcon icon={CheckmarkBadge01Icon} size={16} /> Most restaurants pick this</span
				>{/if}
			<h2>{p.name}</h2>
			<p class="for">{p.for}</p>
			<p class="amount"><strong>{taka(p.monthly)}</strong> / month</p>
			<p class="setup-note">+ {taka(setup.price)} one-time setup</p>
			<ul>
				{#each p.includes as i (i)}<li><HugeiconsIcon icon={Tick02Icon} size={18} /> {i}</li>{/each}
			</ul>
			<p class="year">First year in total: {taka(firstYear(p.monthly))}</p>
			<a class="btn" class:primary={p.featured} href={site.whatsapp} target="_blank" rel="noopener"
				><HugeiconsIcon icon={WhatsappIcon} size={18} /> Start with {p.name}</a
			>
		</article>
	{/each}
</section>

<section class="wrap two">
	<article class="box">
		<h2>One-time setup · {taka(setup.price)}</h2>
		<p>Everything done for you, so you open with a finished system.</p>
		<ul>
			{#each setup.includes as i (i)}<li>
					<HugeiconsIcon icon={Tick02Icon} size={18} />
					{i}
				</li>{/each}
		</ul>
	</article>
	<article class="box care">
		<h2><HugeiconsIcon icon={Wrench01Icon} size={26} /> Care plan · optional</h2>
		<p>
			Only if you want us to make changes for you. Most things you can do yourself from the
			dashboard.
		</p>
		<p class="amount">
			<strong>{taka(care.monthly)}</strong> / month, or {taka(care.hourly)} an hour when you need it
		</p>
		<ul>
			{#each care.includes as i (i)}<li>
					<HugeiconsIcon icon={Tick02Icon} size={18} />
					{i}
				</li>{/each}
		</ul>
	</article>
</section>

<section class="wrap promises">
	<h2>Our promises</h2>
	<ul>
		{#each promises as p (p)}<li><HugeiconsIcon icon={Tick02Icon} size={20} /> {p}</li>{/each}
	</ul>
</section>

<style>
	.head {
		padding-top: 64px;
	}
	h1 {
		margin-bottom: 16px;
		font-size: clamp(2.75rem, 7vw, 5rem);
	}
	.plans {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 24px;
		margin-top: 48px;
	}
	.plan {
		position: relative;
		display: flex;
		flex-direction: column;
		padding: 32px;
		border-radius: 24px;
		background: var(--soft);
	}
	.plan.featured {
		box-shadow: inset 0 0 0 3px var(--brand);
	}
	.tag {
		position: absolute;
		top: -14px;
		left: 28px;
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 4px 12px;
		border-radius: 999px;
		background: var(--brand);
		color: var(--cream);
		font-weight: 700;
		font-size: 0.8125rem;
	}
	h2 {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: clamp(1.75rem, 3vw, 2.25rem);
	}
	.for {
		margin: 8px 0 20px;
		color: var(--muted);
	}
	.amount {
		margin: 0;
		font-size: 1.125rem;
	}
	.amount strong {
		font-size: 2.75rem;
		font-weight: 800;
	}
	.setup-note {
		margin: 4px 0 20px;
		color: var(--muted);
	}
	ul {
		display: grid;
		gap: 8px;
		margin: 0 0 20px;
		padding: 0;
		list-style: none;
	}
	li {
		display: flex;
		gap: 8px;
	}
	li :global(svg) {
		flex: none;
		margin-top: 4px;
		color: var(--brand);
	}
	.year {
		margin: auto 0 16px;
		font-weight: 700;
	}
	.two {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 24px;
		margin-top: 56px;
	}
	.box {
		padding: 32px;
		border-radius: 24px;
		box-shadow: inset 0 0 0 2px var(--black);
	}
	.box > p {
		color: var(--muted);
	}
	.care .amount strong {
		font-size: 2rem;
	}
	.care .amount {
		color: var(--ink);
		margin-bottom: 16px;
	}
	.promises {
		margin-top: 56px;
		padding: 40px 32px;
		border-radius: 24px;
		background: var(--black);
		color: var(--cream);
	}
	.promises h2 {
		margin-bottom: 20px;
	}
	.promises ul {
		grid-template-columns: 1fr 1fr;
		margin: 0;
		font-size: 1.125rem;
	}
	.promises li :global(svg) {
		color: var(--mustard);
	}
	@media (max-width: 860px) {
		.plans,
		.two,
		.promises ul {
			grid-template-columns: 1fr;
		}
	}
</style>

<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { WhatsappIcon, Mail01Icon, ArrowUpRight01Icon } from '@hugeicons/core-free-icons';
	import { site } from '$lib/site';

	let { children } = $props();
	const nav = [
		{ href: '/features', label: 'Features' },
		{ href: '/pricing', label: 'Pricing' },
		{ href: '/help', label: 'Help' }
	];
	const here = (href: string) => page.url.pathname.startsWith(href);
</script>

<svelte:head>
	<link rel="icon" href="/favicon.svg" />
</svelte:head>

<header class="top">
	<div class="wrap in">
		<a class="logo poster" href="/">Tavora</a>
		<nav aria-label="Main">
			{#each nav as n (n.href)}
				<a href={n.href} aria-current={here(n.href) ? 'page' : undefined}>{n.label}</a>
			{/each}
		</nav>
		<a class="btn primary talk" href={site.whatsapp} target="_blank" rel="noopener">
			<HugeiconsIcon icon={WhatsappIcon} size={18} /> Talk to us
			<span class="sr">(opens WhatsApp)</span>
		</a>
	</div>
</header>

<main>{@render children()}</main>

<footer>
	<div class="wrap foot">
		<div>
			<p class="logo poster">Tavora</p>
			<p>Website, dashboard and till for restaurants in Bangladesh.</p>
		</div>
		<nav aria-label="Footer">
			{#each nav as n (n.href)}<a href={n.href}>{n.label}</a>{/each}
			<a href={site.demo} target="_blank" rel="noopener"
				>Live demo <HugeiconsIcon icon={ArrowUpRight01Icon} size={14} /></a
			>
		</nav>
		<div class="contact">
			<a href={site.whatsapp} target="_blank" rel="noopener"
				><HugeiconsIcon icon={WhatsappIcon} size={18} /> WhatsApp</a
			>
			<a href="mailto:{site.email}"><HugeiconsIcon icon={Mail01Icon} size={18} /> {site.email}</a>
		</div>
	</div>
	<p class="wrap small">No commission on your orders. No hidden fees. Made in Bangladesh.</p>
</footer>

<style>
	.top {
		position: sticky;
		top: 0;
		z-index: 10;
		background: color-mix(in srgb, var(--cream) 92%, transparent);
		backdrop-filter: blur(10px);
		border-bottom: 2px solid var(--black);
	}
	.in {
		display: flex;
		align-items: center;
		gap: 24px;
		min-height: 68px;
	}
	.logo {
		color: var(--brand);
		font-size: 1.75rem;
		text-decoration: none;
	}
	nav {
		display: flex;
		gap: 4px;
	}
	.top nav {
		margin-left: auto;
	}
	nav a {
		padding: 8px 12px;
		border-radius: 10px;
		font-weight: 700;
		text-decoration: none;
	}
	nav a[aria-current='page'] {
		background: var(--black);
		color: var(--cream);
	}
	.talk {
		min-height: 44px;
		padding: 8px 16px;
	}
	footer {
		margin-top: 96px;
		padding: 48px 0 24px;
		background: var(--black);
		color: var(--cream);
	}
	.foot {
		display: grid;
		grid-template-columns: 2fr 1fr 1fr;
		gap: 32px;
	}
	.foot p {
		margin: 8px 0 0;
		color: rgb(255 249 231 / 0.7);
	}
	.foot nav,
	.contact {
		display: grid;
		align-content: start;
		gap: 6px;
	}
	.foot a {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 0;
		color: var(--cream);
	}
	.small {
		margin-top: 32px;
		padding-top: 16px;
		border-top: 1px solid rgb(255 249 231 / 0.2);
		color: rgb(255 249 231 / 0.6);
		font-size: 0.875rem;
	}
	@media (max-width: 760px) {
		.in {
			flex-wrap: wrap;
			gap: 8px 16px;
			padding: 8px 0;
		}
		.top nav {
			order: 3;
			width: 100%;
			margin: 0;
		}
		.talk {
			margin-left: auto;
		}
		.foot {
			grid-template-columns: 1fr;
		}
	}
</style>

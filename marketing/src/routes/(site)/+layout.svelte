<script lang="ts">
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { WhatsappIcon } from '@hugeicons/core-free-icons';
	import { site } from '$lib/site';

	let { children } = $props();
	const nav = [
		{ href: '/#features', label: 'Features' },
		{ href: '/#pricing', label: 'Pricing' },
		{ href: '/docs', label: 'Docs' }
	];
</script>

<header class="top">
	<div class="wrap in">
		<a class="logo" href="/">Tavora</a>
		<nav aria-label="Main">
			{#each nav as n (n.href)}<a href={n.href}>{n.label}</a>{/each}
		</nav>
		<a class="btn primary" href={site.whatsapp} target="_blank" rel="noopener">
			<HugeiconsIcon icon={WhatsappIcon} size={20} /><span class="label">Talk to us</span>
			<span class="sr">(opens WhatsApp)</span>
		</a>
	</div>
</header>

<main>{@render children()}</main>

<footer class="wrap foot">
	<a class="logo" href="/">Tavora</a>
	<nav aria-label="Footer">
		{#each nav as n (n.href)}<a href={n.href}>{n.label}</a>{/each}
		<a href="mailto:{site.email}">{site.email}</a>
	</nav>
	<p>Made in Bangladesh</p>
</footer>

<style>
	.top {
		position: sticky;
		top: 0;
		z-index: 10;
		border-bottom: 1px solid var(--line);
		background: color-mix(in srgb, var(--bg) 88%, transparent);
		backdrop-filter: blur(12px);
	}
	.in {
		display: flex;
		align-items: center;
		gap: var(--s6);
		height: 64px;
	}
	.logo {
		color: var(--brand);
		font-size: var(--t-lg);
		font-weight: 800;
		letter-spacing: -0.02em;
		text-decoration: none;
	}
	nav {
		display: flex;
		gap: var(--s5);
	}
	.top nav {
		margin-left: auto;
	}
	nav a {
		color: var(--muted);
		font-size: var(--t-sm);
		font-weight: 500;
		text-decoration: none;
	}
	nav a:hover {
		color: var(--ink);
	}
	.foot {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--s5);
		margin-top: var(--s9);
		padding: var(--s6) 0 var(--s7);
		border-top: 1px solid var(--line);
	}
	.foot nav {
		flex-wrap: wrap;
	}
	.foot p {
		margin-left: auto;
		color: var(--faint);
		font-size: var(--t-sm);
	}
	@media (max-width: 720px) {
		.in {
			gap: var(--s4);
		}
		nav {
			gap: var(--s4);
		}
		.top .btn {
			padding: 0 var(--s3);
		}
		.label {
			display: none;
		}
		.foot p {
			margin-left: 0;
		}
	}
</style>

<script lang="ts">
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		Calendar03Icon,
		Logout01Icon,
		Menu01Icon,
		Settings02Icon,
		ShoppingBag01Icon,
		TextFontIcon,
		ViewIcon
	} from '@hugeicons/core-free-icons';
	import { page } from '$app/state';

	let { data, children } = $props();

	const nav = [
		{ href: '/admin', label: 'Orders', icon: ShoppingBag01Icon },
		{ href: '/admin/bookings', label: 'Table bookings', icon: Calendar03Icon },
		{ href: '/admin/menu', label: 'Menu', icon: Menu01Icon },
		{ href: '/admin/content', label: 'Website text', icon: TextFontIcon },
		{ href: '/admin/settings', label: 'Hours & details', icon: Settings02Icon }
	];
</script>

<svelte:head>
	<title>Dashboard · Tavora</title>
	<meta name="robots" content="noindex" />
</svelte:head>

{#if data.admin}
	<div class="shell">
		<aside>
			<a class="logo" href="/admin">Tavora<span>Dashboard</span></a>
			<nav aria-label="Dashboard">
				{#each nav as n (n.href)}
					<a href={n.href} aria-current={page.url.pathname === n.href ? 'page' : undefined}>
						<HugeiconsIcon icon={n.icon} size={20} />{n.label}
					</a>
				{/each}
			</nav>
			<div class="foot">
				<a href="/" target="_blank"><HugeiconsIcon icon={ViewIcon} size={20} />View website</a>
				<form method="POST" action="/admin/logout">
					<button type="submit"><HugeiconsIcon icon={Logout01Icon} size={20} />Sign out</button>
				</form>
				<small>{data.admin.name}</small>
			</div>
		</aside>
		<main>{@render children()}</main>
	</div>
{:else}
	{@render children()}
{/if}

<style>
	.shell {
		display: grid;
		min-height: 100dvh;
		background: var(--soft);
	}
	aside {
		display: flex;
		flex-direction: column;
		gap: 24px;
		padding: 20px 16px;
		background: var(--black);
		color: var(--cream);
	}
	.logo {
		display: grid;
		font: 800 1.75rem var(--display);
		text-transform: uppercase;
		text-decoration: none;
		color: var(--brand);
	}
	.logo span {
		font-size: 0.75rem;
		letter-spacing: 0.12em;
		color: var(--mustard);
	}
	nav {
		display: grid;
		gap: 4px;
	}
	nav a,
	.foot a,
	.foot button {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 12px;
		border: 0;
		border-radius: 10px;
		background: none;
		color: var(--cream);
		font: 600 0.9375rem var(--sans);
		text-decoration: none;
		cursor: pointer;
	}
	nav a:hover,
	.foot a:hover,
	.foot button:hover {
		background: rgb(255 249 231 / 0.1);
	}
	nav a[aria-current='page'] {
		background: var(--brand);
	}
	.foot {
		margin-top: auto;
		display: grid;
		gap: 4px;
	}
	.foot small {
		padding: 8px 12px 0;
		opacity: 0.6;
	}
	main {
		min-width: 0;
		padding: clamp(16px, 3vw, 36px);
	}

	/* Shared building blocks for every dashboard page. */
	main :global(h1) {
		font-size: clamp(2rem, 4vw, 2.75rem);
		margin-bottom: 20px;
	}
	main :global(h2) {
		font-size: 1.375rem;
		margin-bottom: 12px;
	}
	main :global(.card) {
		padding: 20px;
		border-radius: 16px;
		background: var(--cream);
	}
	main :global(.stack) {
		display: grid;
		gap: 16px;
	}
	main :global(label) {
		display: grid;
		gap: 6px;
		font-weight: 600;
		font-size: 0.875rem;
	}
	main :global(input:not([type='checkbox'], [type='radio'], [type='file'])),
	main :global(textarea),
	main :global(select) {
		width: 100%;
		min-height: 44px;
		padding: 10px 12px;
		border: 0;
		border-radius: 10px;
		background: #fffdf6;
		box-shadow: inset 0 0 0 2px var(--line);
		color: var(--ink);
		font: 400 1rem var(--sans);
	}
	main :global(textarea) {
		min-height: 80px;
		resize: vertical;
	}
	main :global(input:focus),
	main :global(textarea:focus),
	main :global(select:focus) {
		outline: none;
		box-shadow: inset 0 0 0 2px var(--black);
	}
	main :global(.hint) {
		color: var(--muted);
		font-size: 0.8125rem;
		font-weight: 400;
	}
	main :global(.field-error) {
		color: var(--brand);
		font-size: 0.8125rem;
		font-weight: 600;
	}
	main :global(.flash) {
		padding: 12px 16px;
		border-radius: 12px;
		font-weight: 600;
		background: var(--black);
		color: var(--cream);
	}
	main :global(.flash.bad) {
		background: var(--brand);
	}
	main :global(.row) {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 10px;
	}
	main :global(.grid2) {
		display: grid;
		gap: 16px;
	}
	main :global(.btn.small) {
		min-height: 38px;
		padding: 6px 14px;
		font-size: 0.8125rem;
	}
	main :global(.btn.ghost) {
		background: transparent;
		color: var(--ink);
		box-shadow: inset 0 0 0 2px var(--black);
	}
	main :global(.empty) {
		padding: 40px 20px;
		text-align: center;
		color: var(--muted);
	}
	@media (min-width: 720px) {
		main :global(.grid2) {
			grid-template-columns: 1fr 1fr;
		}
	}
	@media (min-width: 960px) {
		.shell {
			grid-template-columns: 250px 1fr;
		}
		aside {
			position: sticky;
			top: 0;
			height: 100dvh;
		}
	}
</style>

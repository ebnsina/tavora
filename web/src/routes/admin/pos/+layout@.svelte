<script lang="ts">
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		ArrowLeft01Icon,
		ChefHatIcon,
		ShoppingBag01Icon,
		TableRoundIcon,
		WifiDisconnected01Icon
	} from '@hugeicons/core-free-icons';
	import { page } from '$app/state';
	import { onMount } from 'svelte';

	let { data, children } = $props();

	let now = $state(new Date());
	let online = $state(true);
	const clock = new Intl.DateTimeFormat('en-GB', {
		hour: 'numeric',
		minute: '2-digit',
		timeZone: 'Asia/Dhaka'
	});

	onMount(() => {
		online = navigator.onLine;
		const t = setInterval(() => (now = new Date()), 15_000);
		const on = () => (online = true);
		const off = () => (online = false);
		addEventListener('online', on);
		addEventListener('offline', off);
		return () => {
			clearInterval(t);
			removeEventListener('online', on);
			removeEventListener('offline', off);
		};
	});

	const tabs = [
		{ href: '/admin/pos', label: 'Floor', icon: TableRoundIcon },
		{ href: '/admin/pos/kitchen', label: 'Kitchen', icon: ChefHatIcon },
		{ href: '/admin/orders', label: 'Online orders', icon: ShoppingBag01Icon }
	];
	const active = (href: string) =>
		href === '/admin/pos'
			? page.url.pathname === href || page.url.pathname.startsWith('/admin/pos/ticket')
			: page.url.pathname.startsWith(href);
</script>

<svelte:head>
	<title>POS · Tavora</title>
	<meta name="robots" content="noindex" />
	<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
</svelte:head>

<div class="pos">
	<header>
		<a class="back" href="/admin" aria-label="Back to the dashboard"
			><HugeiconsIcon icon={ArrowLeft01Icon} size={22} /></a
		>
		<strong class="brand">Tavora <span>POS</span></strong>
		<nav aria-label="POS">
			{#each tabs as t (t.href)}
				<a href={t.href} aria-current={active(t.href) ? 'page' : undefined}>
					<HugeiconsIcon icon={t.icon} size={20} /><span>{t.label}</span>
				</a>
			{/each}
		</nav>
		{#if !online}
			<span class="offline" role="status"
				><HugeiconsIcon icon={WifiDisconnected01Icon} size={18} /> No internet</span
			>
		{/if}
		<span class="clock">{clock.format(now)}</span>
		<span class="who">{data.admin.name}</span>
	</header>
	<div class="screen">{@render children()}</div>
</div>

<style>
	.pos {
		height: 100dvh;
		display: grid;
		grid-template-rows: auto 1fr;
		background: var(--soft);
		user-select: none;
		-webkit-tap-highlight-color: transparent;
	}
	header {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 8px 12px;
		background: var(--black);
		color: var(--cream);
	}
	.back {
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		border-radius: 12px;
		color: var(--cream);
	}
	.back:hover {
		background: rgb(255 249 231 / 0.1);
	}
	.brand {
		font: 800 1.25rem var(--display);
		text-transform: uppercase;
		color: var(--brand);
	}
	.brand span {
		color: var(--mustard);
	}
	nav {
		display: flex;
		gap: 4px;
		margin-left: 12px;
	}
	nav a {
		display: flex;
		align-items: center;
		gap: 8px;
		min-height: 44px;
		padding: 0 16px;
		border-radius: 12px;
		color: var(--cream);
		font-weight: 700;
		text-decoration: none;
	}
	nav a[aria-current='page'] {
		background: var(--brand);
	}
	.offline {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		border-radius: 999px;
		background: var(--mustard);
		color: var(--black);
		font-weight: 700;
		font-size: 0.875rem;
	}
	.clock {
		margin-left: auto;
		font: 700 1.125rem var(--sans);
		font-variant-numeric: tabular-nums;
	}
	.who {
		color: rgb(255 249 231 / 0.65);
		font-size: 0.875rem;
	}
	.screen {
		min-height: 0;
		overflow: hidden;
	}
	@media (max-width: 760px) {
		nav a span,
		.who {
			display: none;
		}
	}
</style>

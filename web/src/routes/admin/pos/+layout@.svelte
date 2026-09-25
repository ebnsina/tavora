<script lang="ts">
	import '@fontsource-variable/geist-mono';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		Alert02Icon,
		ArrowLeft01Icon,
		ChefHatIcon,
		Refresh01Icon,
		ShoppingBag01Icon,
		TableRoundIcon,
		Tick02Icon,
		UserSwitchIcon,
		WifiDisconnected01Icon
	} from '@hugeicons/core-free-icons';
	import { page } from '$app/state';
	import { dismiss, start, store } from '$lib/offline.svelte';
	import { alerts, watchAlerts } from '$lib/alerts.svelte';
	import { onMount } from 'svelte';

	let { children } = $props();

	let now = $state(new Date());
	const clock = new Intl.DateTimeFormat('en-GB', {
		hour: 'numeric',
		minute: '2-digit',
		timeZone: 'Asia/Dhaka'
	});

	// Restore the tablet's saved state before any POS page mounts and reads it.
	start();

	onMount(() => {
		const t = setInterval(() => (now = new Date()), 15_000);
		const stop = watchAlerts();
		return () => {
			clearInterval(t);
			stop();
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
	const waiting = $derived(store.queue.length);
</script>

<svelte:head>
	<title>POS · Tavora</title>
	<meta name="robots" content="noindex" />
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
					{#if t.href === '/admin/orders' && alerts.new_orders}<b
							class="count"
							aria-label="{alerts.new_orders} new">{alerts.new_orders}</b
						>{/if}
				</a>
			{/each}
		</nav>

		<!-- Sync status: always visible so staff know whether sales have reached the server. -->
		<button
			class="sync"
			popovertarget="sync-panel"
			class:off={!store.online}
			class:warn={store.failed.length}
		>
			{#if store.failed.length}
				<HugeiconsIcon icon={Alert02Icon} size={18} /><span class="t"
					>{store.failed.length} need attention</span
				><b class="n">{store.failed.length}</b>
			{:else if !store.online}
				<HugeiconsIcon icon={WifiDisconnected01Icon} size={18} /><span class="t"
					>No internet{waiting ? ` · ${waiting} waiting` : ''}</span
				>{#if waiting}<b class="n">{waiting}</b>{/if}
			{:else if waiting || store.syncing}
				<HugeiconsIcon icon={Refresh01Icon} size={18} /><span class="t"
					>Syncing {waiting || ''}</span
				>
			{:else}
				<HugeiconsIcon icon={Tick02Icon} size={18} /><span class="t">All saved</span>
			{/if}
		</button>
		<div id="sync-panel" popover class="panel">
			{#if !store.online}
				<p>
					<strong>Working offline.</strong> Keep taking orders and payments. Kitchen tickets and
					bills print from this tablet. {waiting} change{waiting === 1 ? '' : 's'} will send when the
					internet is back.
				</p>
			{:else if waiting}
				<p>Sending {waiting} change{waiting === 1 ? '' : 's'} to the server…</p>
			{:else}
				<p>Everything on this tablet has reached the server.</p>
			{/if}
			{#each store.failed as f (f.opId)}
				<div class="failed">
					<strong>{f.label} wasn’t saved</strong>
					<span>{f.error}</span>
					<div class="row">
						<a href="/admin/pos/ticket/{f.orderId}">Open ticket</a>
						<button type="button" onclick={() => dismiss(f.opId)}>Dismiss</button>
					</div>
				</div>
			{/each}
		</div>

		<span class="clock">{clock.format(now)}</span>
		{#if store.me}<span class="who">{store.me.name}</span>{/if}
		<!-- Sales sync under whoever is signed in, so the next person waits until this tablet is caught up. -->
		<form method="POST" action="/admin/logout">
			<button
				class="switch"
				disabled={waiting > 0}
				title={waiting ? 'Wait until everything is saved' : 'Hand the till to someone else'}
			>
				<HugeiconsIcon icon={UserSwitchIcon} size={18} /><span>Switch staff</span>
			</button>
		</form>
	</header>
	<div class="screen">{@render children()}</div>
</div>

<style>
	.pos {
		/* Neutral work surfaces (slate): white cards on a light grey page. */
		--cream: #ffffff;
		--soft: #f1f5f9;
		--line: #e2e8f0;
		--ink: #0f172a;
		--muted: #64748b;
		--paper: #ffffff;
		--accent-soft: color-mix(in srgb, var(--brand) 10%, white);
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
		background: rgb(255 255 255 / 0.1);
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
	.sync {
		display: flex;
		align-items: center;
		gap: 6px;
		min-height: 40px;
		margin-left: auto;
		padding: 0 14px;
		border: 0;
		border-radius: 999px;
		background: rgb(255 255 255 / 0.12);
		color: var(--cream);
		font: 700 0.875rem var(--sans);
		cursor: pointer;
	}
	.sync.off {
		background: var(--mustard);
		color: var(--black);
	}
	.sync.warn {
		background: var(--brand);
		color: var(--cream);
	}
	.panel {
		position: fixed;
		inset: 64px 12px auto auto;
		width: min(380px, calc(100vw - 24px));
		margin: 0;
		padding: 16px;
		border: 0;
		border-radius: 16px;
		background: var(--cream);
		color: var(--ink);
		box-shadow: 0 16px 40px rgb(0 0 0 / 0.25);
	}
	.panel p {
		margin: 0 0 10px;
		line-height: 1.45;
	}
	.failed {
		display: grid;
		gap: 4px;
		margin-top: 8px;
		padding: 12px;
		border-radius: 12px;
		background: #fde4e1;
	}
	.failed span {
		font-size: 0.9375rem;
	}
	.failed .row {
		display: flex;
		gap: 14px;
		margin-top: 4px;
	}
	.failed a,
	.failed button {
		padding: 0;
		border: 0;
		background: none;
		color: var(--brand);
		font: 700 0.875rem var(--sans);
		text-decoration: underline;
		cursor: pointer;
	}
	.clock {
		font: 700 1.125rem var(--sans);
		font-variant-numeric: tabular-nums;
	}
	.count {
		min-width: 22px;
		padding: 1px 7px;
		border-radius: 999px;
		background: var(--mustard);
		color: var(--black);
		font-size: 0.75rem;
		text-align: center;
	}
	.switch {
		display: flex;
		align-items: center;
		gap: 6px;
		min-height: 40px;
		padding: 0 12px;
		border: 0;
		border-radius: 12px;
		background: rgb(255 255 255 / 0.12);
		color: var(--cream);
		font: 700 0.875rem var(--sans);
		cursor: pointer;
	}
	.switch:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	.who {
		color: rgb(255 255 255 / 0.65);
		font-size: 0.875rem;
	}
	.screen {
		min-height: 0;
		overflow: hidden;
	}
	.n {
		display: none;
	}
	@media (max-width: 860px) {
		nav a span,
		.switch span,
		.who {
			display: none;
		}
	}
	/* Phone: icons only; the sync badge keeps its colour and count. */
	@media (max-width: 600px) {
		header {
			gap: 6px;
			padding: 6px 8px;
		}
		.brand,
		.clock,
		.sync .t {
			display: none;
		}
		nav {
			margin-left: 0;
		}
		nav a {
			padding: 0 12px;
		}
		.sync {
			padding: 0 10px;
		}
		.n {
			display: inline;
			font-size: 0.8125rem;
		}
	}
	.panel {
		opacity: 0;
		translate: 0 -6px;
		transition:
			opacity 0.18s ease,
			translate 0.18s ease,
			overlay 0.18s allow-discrete,
			display 0.18s allow-discrete;
	}
	.panel:popover-open {
		opacity: 1;
		translate: 0 0;
	}
	@starting-style {
		.panel:popover-open {
			opacity: 0;
			translate: 0 -6px;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.panel {
			transition: none;
		}
	}
</style>

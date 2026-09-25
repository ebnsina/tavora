<script lang="ts">
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		ArrowDown01Icon,
		ArrowRight01Icon,
		ArrowUpRight01Icon,
		Cashier02Icon,
		TableRoundIcon,
		Calendar03Icon,
		DashboardSquare01Icon,
		Logout01Icon,
		Menu01Icon,
		Settings02Icon,
		ShoppingBag01Icon,
		TextFontIcon,
		Menu02Icon,
		HelpCircleIcon,
		Globe02Icon,
		MoreHorizontalCircle01Icon,
		UserGroupIcon,
		Invoice03Icon
	} from '@hugeicons/core-free-icons';
	import { page } from '$app/state';
	import { afterNavigate, onNavigate } from '$app/navigation';
	import { env } from '$env/dynamic/public';
	import { onMount } from 'svelte';
	import { alerts, watchAlerts } from '$lib/alerts.svelte';

	let { data, children } = $props();

	onMount(watchAlerts);
	// Phone: the sidebar becomes a drawer, closed after every navigation.
	let drawer = $state(false);
	afterNavigate(() => (drawer = false));
	// Crossfade the page content between dashboard pages, where the browser supports it.
	onNavigate((nav) => {
		if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches)
			return;
		return new Promise((done) => {
			document.startViewTransition(async () => {
				done();
				await nav.complete;
			});
		});
	});

	const orders = { href: '/admin/orders', label: 'Online orders', icon: ShoppingBag01Icon };
	const bookings = { href: '/admin/bookings', label: 'Table bookings', icon: Calendar03Icon };
	// Staff only get what they need on shift.
	const groups = $derived(
		data.admin?.role === 'staff'
			? [{ label: 'Today', links: [orders, bookings] }]
			: [
					{
						label: 'Today',
						links: [
							{ href: '/admin', label: 'Overview', icon: DashboardSquare01Icon },
							orders,
							bookings,
							{ href: '/admin/reports', label: 'End of day', icon: Invoice03Icon }
						]
					},
					{
						label: 'Restaurant',
						links: [
							{ href: '/admin/menu', label: 'Menu', icon: Menu01Icon },
							{ href: '/admin/tables', label: 'Tables', icon: TableRoundIcon },
							{ href: '/admin/staff', label: 'Staff', icon: UserGroupIcon },
							{ href: '/admin/settings', label: 'Hours & details', icon: Settings02Icon }
						]
					},
					{
						label: 'Website',
						links: [{ href: '/admin/content', label: 'Website text', icon: TextFontIcon }]
					}
				]
	);
	// Phone bottom bar: the few places people go most, plus the till and the full menu.
	const bottom = $derived(
		data.admin?.role === 'staff'
			? [orders, bookings]
			: [{ href: '/admin', label: 'Overview', icon: DashboardSquare01Icon }, orders, bookings]
	);
	const badge = (href: string) =>
		href === orders.href ? alerts.new_orders : href === bookings.href ? alerts.waiting_bookings : 0;

	// Dashboard › section › item; a detail page names itself through `crumb` in its load data.
	const crumbs = $derived.by(() => {
		const out = [{ href: '/admin', label: 'Dashboard' }];
		const path = page.url.pathname;
		const section = groups
			.flatMap((g) => g.links)
			.find((l) => l.href !== '/admin' && path.startsWith(l.href));
		if (section) out.push(section);
		else if (path === '/admin') out.push({ href: '/admin', label: 'Overview' });
		if (page.data.crumb) out.push({ href: path, label: page.data.crumb as string });
		return out;
	});
	const initials = $derived(
		(data.admin?.name ?? '')
			.split(/\s+/)
			.map((w) => w[0])
			.slice(0, 2)
			.join('')
			.toUpperCase()
	);
</script>

<svelte:head>
	<title>Dashboard · Tavora</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<svelte:window onkeydown={(e) => e.key === 'Escape' && (drawer = false)} />

{#if data.admin}
	<div class="shell">
		{#if drawer}<button
				class="scrim"
				type="button"
				aria-label="Close menu"
				onclick={() => (drawer = false)}
			></button>{/if}
		<aside class:open={drawer} aria-label="Dashboard menu">
			<a class="logo" href="/admin"
				><span class="full">Tavora</span><span class="short">T</span><small>Dashboard</small></a
			>
			<a class="pos-link" href="/admin/pos" title="Point of sale">
				<HugeiconsIcon icon={Cashier02Icon} size={20} /><span class="label">Point of sale</span>
			</a>
			<nav aria-label="Dashboard">
				{#each groups as g (g.label)}
					<p class="group">{g.label}</p>
					{#each g.links as n (n.href)}
						<a
							href={n.href}
							title={n.label}
							aria-current={page.url.pathname === n.href ? 'page' : undefined}
						>
							<HugeiconsIcon icon={n.icon} size={20} /><span class="label">{n.label}</span>
							{#if badge(n.href)}<span class="count" aria-label="{badge(n.href)} waiting"
									>{badge(n.href)}</span
								>{/if}
						</a>
					{/each}
				{/each}
			</nav>
			<a class="site" href={env.PUBLIC_HELP_URL} target="_blank" rel="noopener">
				<HugeiconsIcon icon={HelpCircleIcon} size={20} /><span class="label">Help</span>
				<span class="ext"><HugeiconsIcon icon={ArrowUpRight01Icon} size={16} /></span>
				<span class="sr">(opens in a new tab)</span>
			</a>
			<a class="site" href="/" target="_blank" rel="noopener">
				<HugeiconsIcon icon={Globe02Icon} size={20} /><span class="label">View website</span>
				<span class="ext"><HugeiconsIcon icon={ArrowUpRight01Icon} size={16} /></span>
				<span class="sr">(opens in a new tab)</span>
			</a>
		</aside>

		<div class="body">
			<div class="topbar">
				<button
					class="menu-btn"
					type="button"
					aria-label="Open menu"
					aria-expanded={drawer}
					onclick={() => (drawer = true)}><HugeiconsIcon icon={Menu02Icon} size={22} /></button
				>
				<nav class="crumbs" aria-label="Breadcrumb">
					<ol>
						{#each crumbs as c, i (i)}
							<li>
								{#if i === crumbs.length - 1}
									<span aria-current="page">{c.label}</span>
								{:else}
									<a href={c.href}>{c.label}</a>
									<HugeiconsIcon icon={ArrowRight01Icon} size={14} />
								{/if}
							</li>
						{/each}
					</ol>
				</nav>
				<button class="account" popovertarget="account-menu" aria-label="Account menu">
					<span class="avatar" aria-hidden="true">{initials}</span>
					<span class="who">{data.admin.name}</span>
					<HugeiconsIcon icon={ArrowDown01Icon} size={16} />
				</button>
				<div id="account-menu" popover class="menu">
					<div class="me">
						<strong>{data.admin.name}</strong>
						<span>{data.admin.email}</span>
					</div>
					<a href="/" target="_blank" rel="noopener">
						View website <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} />
						<span class="sr">(opens in a new tab)</span>
					</a>
					<form method="POST" action="/admin/logout">
						<button type="submit"><HugeiconsIcon icon={Logout01Icon} size={18} />Sign out</button>
					</form>
				</div>
			</div>
			<main>{@render children()}</main>
		</div>

		<nav class="bottom" aria-label="Quick links">
			{#each bottom as n (n.href)}
				<a href={n.href} aria-current={page.url.pathname === n.href ? 'page' : undefined}>
					<span class="b-ic"
						><HugeiconsIcon icon={n.icon} size={22} />{#if badge(n.href)}<span class="b-count"
								>{badge(n.href)}</span
							>{/if}</span
					>
					{n.label === 'Online orders'
						? 'Orders'
						: n.label === 'Table bookings'
							? 'Bookings'
							: n.label}
				</a>
			{/each}
			<a href="/admin/pos" class="till"
				><span class="b-ic"><HugeiconsIcon icon={Cashier02Icon} size={22} /></span>Till</a
			>
			<button type="button" onclick={() => (drawer = true)}
				><span class="b-ic"><HugeiconsIcon icon={MoreHorizontalCircle01Icon} size={22} /></span
				>More</button
			>
		</nav>
	</div>
{:else}
	{@render children()}
{/if}

<style>
	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
	}
	.shell {
		--pad: clamp(16px, 3vw, 32px);
		display: grid;
		min-height: 100dvh;
		background: var(--soft);
	}
	aside {
		display: flex;
		flex-direction: column;
		gap: 20px;
		padding: 20px 14px;
		background: var(--black);
		color: var(--cream);
	}
	.logo {
		display: grid;
		padding: 0 10px;
		font: 800 1.75rem var(--display);
		text-transform: uppercase;
		text-decoration: none;
		color: var(--brand);
	}
	.logo small {
		font-size: 0.6875rem;
		letter-spacing: 0.14em;
		color: var(--mustard);
	}
	.logo .short,
	.menu-btn,
	.bottom,
	.scrim {
		display: none;
	}
	aside nav {
		display: grid;
		gap: 2px;
	}
	.pos-link {
		display: flex;
		align-items: center;
		gap: 12px;
		margin: 4px 0 8px;
		padding: 12px 14px;
		border-radius: 12px;
		background: var(--mustard);
		color: var(--black);
		font-weight: 700;
		text-decoration: none;
	}
	.pos-link:hover {
		background: color-mix(in srgb, var(--mustard) 85%, white);
	}
	.count {
		min-width: 22px;
		margin-left: auto;
		padding: 1px 7px;
		border-radius: 999px;
		background: var(--mustard);
		color: var(--black);
		font-size: 0.75rem;
		font-weight: 800;
		text-align: center;
	}
	.group {
		margin: 14px 0 6px;
		padding: 0 12px;
		font-size: 0.6875rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: rgb(255 249 231 / 0.45);
	}
	.group:first-child {
		margin-top: 0;
	}
	aside nav a,
	.site {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 12px;
		border-radius: 10px;
		color: var(--cream);
		font: 600 0.9375rem var(--sans);
		text-decoration: none;
	}
	aside nav a:hover,
	.site:hover {
		background: rgb(255 249 231 / 0.08);
	}
	aside nav a[aria-current='page'] {
		background: var(--brand);
	}
	.site {
		margin-top: auto;
		gap: 6px;
		color: rgb(255 249 231 / 0.75);
	}
	.site + .site {
		margin-top: 0;
	}

	.body {
		min-width: 0;
		display: flex;
		flex-direction: column;
	}
	.topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 12px var(--pad);
		border-bottom: 1px solid var(--line);
		background: var(--cream);
	}
	.crumbs ol {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px;
		margin: 0;
		padding: 0;
		list-style: none;
		font-size: 0.875rem;
		font-weight: 600;
	}
	.crumbs li {
		display: flex;
		align-items: center;
		gap: 6px;
		color: var(--muted);
	}
	.crumbs a {
		color: var(--muted);
		text-decoration: none;
	}
	.crumbs a:hover {
		color: var(--ink);
		text-decoration: underline;
	}
	.crumbs [aria-current] {
		color: var(--ink);
	}
	.account {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 4px 10px 4px 4px;
		border: 0;
		border-radius: 999px;
		background: var(--soft);
		color: var(--ink);
		font: 600 0.875rem var(--sans);
		cursor: pointer;
	}
	.account:hover {
		background: var(--line);
	}
	.avatar {
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: var(--brand);
		color: var(--cream);
		font-weight: 800;
		font-size: 0.8125rem;
	}
	.menu {
		position: fixed;
		inset: 60px var(--pad) auto auto;
		margin: 0;
		width: 240px;
		padding: 8px;
		border: 0;
		border-radius: 14px;
		background: var(--cream);
		box-shadow: 0 16px 40px rgb(0 0 0 / 0.18);
	}
	.me {
		display: grid;
		padding: 8px 10px 12px;
		border-bottom: 1px solid var(--line);
		margin-bottom: 6px;
	}
	.me span {
		color: var(--muted);
		font-size: 0.8125rem;
		overflow-wrap: anywhere;
	}
	.menu a,
	.menu button {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		padding: 10px;
		border: 0;
		border-radius: 8px;
		background: none;
		color: var(--ink);
		font: 600 0.9375rem var(--sans);
		text-decoration: none;
		cursor: pointer;
	}
	.menu a:hover,
	.menu button:hover {
		background: var(--soft);
	}
	main {
		flex: 1;
		min-width: 0;
		padding: var(--pad);
	}

	/* ---- Shared building blocks for every dashboard page ---- */
	/* The hidden attribute must win over the display rules below. */
	main :global([hidden]) {
		display: none !important;
	}
	main :global(h2) {
		font-size: 1.25rem;
		margin-bottom: 12px;
	}
	main :global(.card) {
		padding: 20px;
		border-radius: 16px;
		background: var(--cream);
	}
	main :global(.card-head) {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		margin-bottom: 14px;
	}
	main :global(.card-head h2) {
		margin: 0;
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
		margin: 0 0 16px;
		padding: 12px 16px;
		border-radius: 12px;
		font-weight: 600;
		background: var(--black);
		color: var(--cream);
	}
	main :global(.actions .flash) {
		margin: 0;
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
		align-items: start;
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
	main :global(.ext) {
		display: inline-flex;
		align-items: center;
		gap: 2px;
	}

	/* ---- Form controls, drawn to match the brand instead of the browser default ---- */
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
		color-scheme: light;
		accent-color: var(--brand);
		transition: box-shadow 0.15s;
	}
	main :global(textarea) {
		min-height: 80px;
		resize: vertical;
	}
	main :global(input:hover:not([type='checkbox'], [type='radio'], [type='file'])),
	main :global(textarea:hover),
	main :global(select:hover) {
		box-shadow: inset 0 0 0 2px #d4c4a4;
	}
	main :global(input:focus-visible),
	main :global(textarea:focus-visible),
	main :global(select:focus-visible) {
		outline: none;
		box-shadow:
			inset 0 0 0 2px var(--black),
			0 0 0 3px rgb(244 180 0 / 0.5);
	}
	main :global(input:user-invalid),
	main :global(textarea:user-invalid) {
		box-shadow: inset 0 0 0 2px var(--brand);
	}
	/* Select: own chevron. */
	main :global(select) {
		appearance: none;
		padding-right: 40px;
		background: #fffdf6
			url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%23141414' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 6l4 4 4-4'/%3E%3C/svg%3E")
			no-repeat right 14px center;
		cursor: pointer;
	}
	/* Date and time: own calendar / clock icon; the native picker still opens on click. */
	main :global(input[type='date']),
	main :global(input[type='time']) {
		position: relative;
		font-variant-numeric: tabular-nums;
		padding-right: 40px;
		background: #fffdf6 no-repeat right 12px center / 18px;
		cursor: pointer;
	}
	main :global(input[type='date']) {
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23d5161a' stroke-width='2' stroke-linecap='round'%3E%3Crect x='3' y='5' width='18' height='16' rx='3'/%3E%3Cpath d='M3 10h18M8 3v4M16 3v4'/%3E%3C/svg%3E");
	}
	main :global(input[type='time']) {
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23d5161a' stroke-width='2' stroke-linecap='round'%3E%3Ccircle cx='12' cy='12' r='9'/%3E%3Cpath d='M12 7v5l3 2'/%3E%3C/svg%3E");
	}
	main :global(input[type='date']::-webkit-calendar-picker-indicator),
	main :global(input[type='time']::-webkit-calendar-picker-indicator) {
		position: absolute;
		inset: 0;
		width: auto;
		height: auto;
		opacity: 0;
		cursor: pointer;
	}
	/* Checkbox and radio. */
	main :global(input[type='checkbox']),
	main :global(input[type='radio']) {
		appearance: none;
		flex: none;
		width: 20px;
		height: 20px;
		margin: 0;
		border-radius: 6px;
		background: #fffdf6;
		box-shadow: inset 0 0 0 2px var(--black);
		cursor: pointer;
		transition:
			background 0.15s,
			box-shadow 0.15s;
	}
	main :global(input[type='radio']) {
		border-radius: 50%;
	}
	main :global(input[type='checkbox']:checked) {
		background: var(--brand)
			url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none' stroke='%23fff9e7' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 10.5l3.2 3L15 6.5'/%3E%3C/svg%3E")
			center / 100%;
		box-shadow: inset 0 0 0 2px var(--brand);
	}
	main :global(input[type='radio']:checked) {
		background: var(--brand);
		box-shadow:
			inset 0 0 0 2px var(--brand),
			inset 0 0 0 5px #fffdf6;
	}
	main :global(input[type='checkbox']:focus-visible),
	main :global(input[type='radio']:focus-visible) {
		outline: 3px solid var(--mustard);
		outline-offset: 2px;
	}
	/* On/off switch: a checkbox with class="switch". */
	main :global(input[type='checkbox'].switch) {
		width: 40px;
		height: 24px;
		border-radius: 999px;
		background: var(--line);
		box-shadow: none;
		position: relative;
	}
	main :global(input[type='checkbox'].switch::after) {
		content: '';
		position: absolute;
		top: 3px;
		left: 3px;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: #fff;
		box-shadow: 0 1px 3px rgb(0 0 0 / 0.25);
		transition: translate 0.15s;
	}
	main :global(input[type='checkbox'].switch:checked) {
		background: var(--green);
	}
	main :global(input[type='checkbox'].switch:checked::after) {
		translate: 16px 0;
	}
	main :global(.check) {
		display: flex;
		align-items: center;
		gap: 8px;
		font-weight: 500;
		cursor: pointer;
	}
	/* File picker button. */
	main :global(input[type='file']) {
		font: 400 0.875rem var(--sans);
		color: var(--muted);
	}
	main :global(input[type='file']::file-selector-button) {
		margin-right: 10px;
		padding: 8px 14px;
		border: 0;
		border-radius: 10px;
		background: var(--black);
		color: var(--cream);
		font: 600 0.8125rem var(--sans);
		cursor: pointer;
	}

	@media (min-width: 760px) {
		main :global(.grid2) {
			grid-template-columns: 1fr 1fr;
		}
	}
	/* Desktop: full sidebar. */
	@media (min-width: 1100px) {
		.shell {
			grid-template-columns: 240px 1fr;
		}
		aside {
			position: sticky;
			top: 0;
			height: 100dvh;
			overflow-y: auto;
		}
	}
	/* Tablet: a slim icon rail; names show on hover. */
	@media (min-width: 760px) and (max-width: 1099px) {
		.shell {
			grid-template-columns: 76px 1fr;
		}
		aside {
			position: sticky;
			top: 0;
			height: 100dvh;
			align-items: center;
			padding: 16px 10px;
			overflow-y: auto;
		}
		.logo {
			padding: 0;
		}
		.logo .full,
		.logo small,
		.label,
		.group,
		.site .ext {
			display: none;
		}
		.logo .short {
			display: block;
		}
		aside nav {
			gap: 6px;
		}
		aside nav a,
		.pos-link,
		.site {
			position: relative;
			justify-content: center;
			width: 52px;
			height: 48px;
			margin: 0;
			padding: 0;
		}
		.count {
			position: absolute;
			top: 3px;
			right: 2px;
			min-width: 18px;
			padding: 0 5px;
			font-size: 0.6875rem;
		}
	}
	/* Phone: a drawer for the full menu and a bottom bar for the common places. */
	@media (max-width: 759px) {
		.shell {
			display: block;
		}
		aside {
			position: fixed;
			inset: 0 auto 0 0;
			z-index: 60;
			width: min(300px, 86vw);
			overflow-y: auto;
			translate: -100% 0;
			transition: translate 0.28s cubic-bezier(0.2, 0.8, 0.2, 1);
		}
		aside.open {
			translate: 0 0;
			box-shadow: 24px 0 48px rgb(0 0 0 / 0.3);
		}
		.scrim {
			position: fixed;
			inset: 0;
			z-index: 55;
			display: block;
			border: 0;
			background: rgb(0 0 0 / 0.45);
			animation: fade 0.2s both;
		}
		.menu-btn {
			display: grid;
			flex: none;
			place-items: center;
			width: 40px;
			height: 40px;
			margin-left: -8px;
			border: 0;
			border-radius: 10px;
			background: none;
			color: var(--ink);
			cursor: pointer;
		}
		.topbar {
			position: sticky;
			top: 0;
			z-index: 20;
			justify-content: flex-start;
		}
		.crumbs {
			min-width: 0;
			flex: 1;
			overflow: hidden;
		}
		.crumbs li:not(:last-child) {
			display: none;
		}
		.who {
			display: none;
		}
		main {
			padding-bottom: calc(96px + env(safe-area-inset-bottom));
		}
		.bottom {
			position: fixed;
			inset: auto 0 0;
			z-index: 40;
			display: grid;
			grid-auto-columns: 1fr;
			grid-auto-flow: column;
			padding: 6px 6px calc(6px + env(safe-area-inset-bottom));
			border-top: 1px solid var(--line);
			background: color-mix(in srgb, var(--cream) 94%, transparent);
			backdrop-filter: blur(12px);
		}
		.bottom a,
		.bottom button {
			display: grid;
			justify-items: center;
			gap: 2px;
			padding: 6px 0;
			border: 0;
			border-radius: 12px;
			background: none;
			color: var(--muted);
			font: 600 0.6875rem var(--sans);
			text-decoration: none;
			cursor: pointer;
		}
		.bottom [aria-current='page'] {
			color: var(--brand);
		}
		.bottom .till {
			color: var(--ink);
		}
		.bottom .till .b-ic {
			border-radius: 10px;
			background: var(--mustard);
		}
		.b-ic {
			position: relative;
			display: grid;
			place-items: center;
			width: 44px;
			height: 30px;
		}
		.b-count {
			position: absolute;
			top: -4px;
			right: 2px;
			min-width: 18px;
			padding: 0 5px;
			border-radius: 999px;
			background: var(--brand);
			color: var(--cream);
			font-size: 0.625rem;
			line-height: 16px;
			text-align: center;
		}
	}
	@keyframes fade {
		from {
			opacity: 0;
		}
	}
	/* Printing: only the page content, never the app's navigation. */
	@media print {
		aside,
		.topbar,
		.bottom,
		.scrim {
			display: none !important;
		}
	}
	.ext {
		display: inline-flex;
		margin-left: auto;
		opacity: 0.7;
	}
	/* Motion: content eases in; menus and messages don't just blink. */
	/* Not on phones: it would layer the page above the bottom bar and trap sheets under it. */
	@media (min-width: 760px) {
		main {
			view-transition-name: dash-main;
		}
	}
	:global(::view-transition-old(dash-main)),
	:global(::view-transition-new(dash-main)) {
		animation-duration: 0.18s;
	}
	main :global([id^='panel-']:not([hidden])),
	main :global(.flash) {
		animation: rise-in 0.25s cubic-bezier(0.2, 0.8, 0.2, 1) both;
	}
	.menu {
		opacity: 0;
		translate: 0 -6px;
		transition:
			opacity 0.18s ease,
			translate 0.18s ease,
			overlay 0.18s allow-discrete,
			display 0.18s allow-discrete;
	}
	.menu:popover-open {
		opacity: 1;
		translate: 0 0;
	}
	@starting-style {
		.menu:popover-open {
			opacity: 0;
			translate: 0 -6px;
		}
	}
	@keyframes rise-in {
		from {
			opacity: 0;
			translate: 0 6px;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		main :global([id^='panel-']:not([hidden])),
		main :global(.flash) {
			animation: none;
		}
		.menu {
			transition: none;
		}
	}
</style>

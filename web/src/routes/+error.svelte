<script lang="ts">
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		DashboardSquare01Icon,
		Home01Icon,
		Menu01Icon,
		Refresh01Icon
	} from '@hugeicons/core-free-icons';
	import { page } from '$app/state';
	import Storefront from '$lib/Storefront.svelte';

	const lost = $derived(page.status === 404);
	const inDashboard = $derived(page.url.pathname.startsWith('/admin'));
	// Our own 404s carry a friendly message ("That order doesn't exist."); anything else stays generic.
	const message = $derived(
		lost
			? page.error?.message && page.error.message !== 'Not Found'
				? page.error.message
				: 'This page isn’t on our menu. It may have moved, or the link has a typo.'
			: 'Something went wrong on our side. Please try again in a minute.'
	);
</script>

<svelte:head>
	<title>{lost ? 'Page not found' : 'Something went wrong'} · Tavora</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main>
	<div class="art">
		<Storefront
			name="Tavora"
			sign={{
				open: false,
				word: lost ? 'LOST?' : 'OOPS',
				line: lost ? 'page not found' : 'back soon',
				label: lost ? 'Page not found' : 'Something went wrong'
			}}
		/>
	</div>
	<h1>{lost ? 'Wrong door!' : 'Kitchen hiccup'}</h1>
	<p>{message}</p>
	<div class="actions">
		{#if inDashboard}
			<a class="btn cream" href="/admin"
				><HugeiconsIcon icon={DashboardSquare01Icon} size={18} /> Back to the dashboard</a
			>
		{:else}
			<a class="btn cream" href="/"
				><HugeiconsIcon icon={Home01Icon} size={18} /> Go to the homepage</a
			>
			<a class="btn ghost-cream" href="/#menu"
				><HugeiconsIcon icon={Menu01Icon} size={18} /> See the menu</a
			>
		{/if}
		{#if !lost}<button class="btn ghost-cream" type="button" onclick={() => location.reload()}
				><HugeiconsIcon icon={Refresh01Icon} size={18} /> Try again</button
			>{/if}
	</div>
	<span class="code">Error {page.status}</span>
</main>

<style>
	main {
		min-height: 100dvh;
		display: grid;
		place-content: center;
		justify-items: center;
		gap: 16px;
		padding: 32px 16px;
		background: var(--brand);
		color: var(--cream);
		text-align: center;
	}
	.art {
		width: min(460px, 100%);
	}
	h1 {
		margin: 0;
		font-size: clamp(2.75rem, 9vw, 5.5rem);
		line-height: 0.95;
		text-transform: uppercase;
	}
	p {
		max-width: 40ch;
		margin: 0;
		font-size: 1.125rem;
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 10px;
		margin-top: 8px;
	}
	.ghost-cream {
		background: transparent;
		color: var(--cream);
		box-shadow: inset 0 0 0 2px var(--cream);
	}
	.code {
		opacity: 0.7;
		font-size: 0.875rem;
		font-weight: 600;
	}
</style>

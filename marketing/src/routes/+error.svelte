<script lang="ts">
	import { page } from '$app/state';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { Home01Icon, HelpCircleIcon } from '@hugeicons/core-free-icons';
	import Storefront from '$lib/Storefront.svelte';
</script>

<svelte:head>
	<title>Page not found · Tavora</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<section class="err">
	<div class="art">
		<Storefront
			name="Tavora"
			sign={{ open: false, word: 'LOST?', line: 'page not found', label: 'Page not found' }}
		/>
	</div>
	<h1>{page.status === 404 ? 'Wrong door!' : 'Something went wrong'}</h1>
	<p>That page isn’t here. It may have moved, or the link has a typo.</p>
	<div class="actions">
		<a class="btn light" href="/"><HugeiconsIcon icon={Home01Icon} size={20} /> Home</a>
		<a class="btn outline" href="/help"><HugeiconsIcon icon={HelpCircleIcon} size={18} /> Help</a>
	</div>
</section>

<style>
	.err {
		display: grid;
		justify-items: center;
		gap: 16px;
		padding: 48px 16px 64px;
		background: var(--brand);
		color: var(--cream);
		text-align: center;
	}
	.art {
		width: min(440px, 100%);
	}
	h1 {
		font-size: var(--t-3xl);
	}
	p {
		margin: 0;
		font-size: 1.125rem;
	}
	.actions {
		display: flex;
		gap: 10px;
	}
	.light {
		background: var(--bg);
		color: var(--brand);
	}
	.light:hover {
		background: #fff;
	}
	.outline {
		background: transparent;
		color: var(--cream);
		box-shadow: inset 0 0 0 2px var(--cream);
	}
</style>

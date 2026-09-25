<script lang="ts">
	import type { Snippet } from 'svelte';

	let { title, sub, actions }: { title: string; sub?: string; actions?: Snippet } = $props();
</script>

<!-- Sticky page title with the page's main actions on the right, so they stay in reach while scrolling. -->
<header class="page-head">
	<div>
		<h1>{title}</h1>
		{#if sub}<p>{sub}</p>{/if}
	</div>
	{#if actions}<div class="actions">{@render actions()}</div>{/if}
</header>

<style>
	.page-head {
		position: sticky;
		top: 0;
		z-index: 5;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 12px 20px;
		margin: calc(-1 * var(--pad)) calc(-1 * var(--pad)) 20px;
		padding: 18px var(--pad);
		background: color-mix(in srgb, var(--soft) 92%, transparent);
		backdrop-filter: blur(10px);
	}
	h1 {
		margin: 0 !important;
		font-size: clamp(1.75rem, 3vw, 2.25rem) !important;
	}
	p {
		margin: 4px 0 0;
		color: var(--muted);
		font-size: 0.9375rem;
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 10px;
	}
</style>

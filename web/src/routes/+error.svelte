<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head><title>Something went wrong</title></svelte:head>

<main>
	<h1>Oops!</h1>
	<p>{page.status === 404 ? "We couldn't find that page." : page.error?.message}</p>
	<a class="btn cream" href="/">Try again</a>
</main>

<style>
	main {
		min-height: 100dvh;
		display: grid;
		place-content: center;
		justify-items: center;
		gap: 16px;
		padding: 24px;
		background: var(--brand);
		color: var(--cream);
		text-align: center;
	}
	h1 {
		font-size: clamp(5rem, 18vw, 12rem);
	}
	p {
		max-width: 36ch;
		margin: 0 0 8px;
		font-size: 1.25rem;
	}
</style>

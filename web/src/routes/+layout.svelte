<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();

	// In-page links glide to their section without adding #section to the URL; runs before SvelteKit's router.
	function inPage(e: MouseEvent) {
		const a = (e.target as Element).closest?.('a[href^="#"]');
		const el = a && document.getElementById(a.getAttribute('href')!.slice(1));
		if (!el) return;
		e.preventDefault();
		el.scrollIntoView();
		el.setAttribute('tabindex', '-1');
		el.focus({ preventScroll: true });
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<svelte:window onclickcapture={inPage} />

{@render children()}

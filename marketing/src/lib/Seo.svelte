<script lang="ts">
	import { site } from '$lib/site';

	let { title, description, path }: { title: string; description: string; path: string } = $props();
	const full = $derived(`${title} · ${site.name}`);
	const url = $derived(site.url + path);
</script>

<svelte:head>
	<title>{full}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={url} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={site.name} />
	<meta property="og:title" content={full} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={url} />
	<meta property="og:image" content="{site.url}/shots/website.webp" />
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<script lang="ts">
	// A real screenshot of the app.
	let { name, alt, caption }: { name: string; alt: string; caption?: string } = $props();
</script>

<figure class="shot">
	<img src="/shots/{name}.webp" {alt} width="1280" height="800" loading="lazy" />
	{#if caption}<figcaption>{caption}</figcaption>{/if}
</figure>

<style>
	.shot {
		margin: 0;
	}
	img {
		width: 100%;
		border-radius: 12px;
		box-shadow:
			0 0 0 1px var(--line),
			0 24px 48px -24px rgb(40 20 0 / 0.25);
	}
	figcaption {
		margin-top: var(--s3);
		color: var(--muted);
		font-size: var(--t-xs);
		text-align: center;
	}
</style>

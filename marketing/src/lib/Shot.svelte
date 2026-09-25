<script lang="ts">
	// A real screenshot of the app in a browser-window frame.
	let { name, alt }: { name: string; alt: string } = $props();
</script>

<figure class="shot">
	<div class="bar" aria-hidden="true"><i></i><i></i><i></i></div>
	<img src="/shots/{name}.webp" {alt} width="1280" height="800" loading="lazy" />
</figure>

<style>
	.shot {
		margin: 0;
		overflow: hidden;
		border-radius: 16px;
		background: var(--black);
		box-shadow:
			0 0 0 2px var(--black),
			8px 8px 0 var(--black);
	}
	.bar {
		display: flex;
		gap: 6px;
		padding: 10px 12px;
	}
	.bar i {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: var(--cream);
		opacity: 0.5;
	}
	img {
		width: 100%;
		height: auto;
	}
</style>

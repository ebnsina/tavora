<script lang="ts">
	// Text with `backticks` around button and screen names; those render in mono.
	let { text }: { text: string } = $props();
	const parts = $derived(text.split(/`([^`]+)`/));
</script>

{#each parts as p, i (i)}{#if i % 2}<code>{p}</code>{:else}{p}{/if}{/each}

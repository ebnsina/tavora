<script lang="ts">
	import type { Snippet } from 'svelte';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { Cancel01Icon } from '@hugeicons/core-free-icons';

	// Native modal dialog: focus trap, Esc to close and the backdrop come from the browser.
	let {
		open,
		title,
		onclose,
		children
	}: { open: boolean; title: string; onclose: () => void; children: Snippet } = $props();

	let el = $state<HTMLDialogElement>();
	$effect(() => {
		if (open && !el?.open) el?.showModal();
		if (!open && el?.open) el.close();
	});
	// Clicks on the dialog's own padding also target it, so check the pointer is outside the box.
	function outside(e: MouseEvent) {
		const r = el!.getBoundingClientRect();
		const inBox =
			e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
		if (e.target === el && !inBox) el.close();
	}
</script>

<dialog bind:this={el} {onclose} onclick={outside} aria-labelledby="dialog-title">
	{#if open}
		<header>
			<h2 id="dialog-title">{title}</h2>
			<button type="button" class="x" aria-label="Close" onclick={() => el?.close()}
				><HugeiconsIcon icon={Cancel01Icon} size={20} /></button
			>
		</header>
		{@render children()}
	{/if}
</dialog>

<style>
	dialog {
		width: min(560px, calc(100vw - 32px));
		max-height: calc(100dvh - 32px);
		padding: 22px;
		border: 0;
		border-radius: 20px;
		background: var(--cream);
		color: var(--ink);
	}
	dialog::backdrop {
		background: rgb(0 0 0 / 0.45);
	}
	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 16px;
	}
	h2 {
		margin: 0;
		font-size: 1.375rem;
	}
	.x {
		display: grid;
		place-items: center;
		width: 40px;
		height: 40px;
		border: 0;
		border-radius: 12px;
		background: var(--soft);
		cursor: pointer;
	}
</style>

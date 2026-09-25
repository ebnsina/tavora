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
		<div class="body">{@render children()}</div>
	{/if}
</dialog>

<style>
	dialog {
		width: min(560px, calc(100vw - 32px));
		max-height: calc(100dvh - 32px);
		/* A soft outer frame holds the title and the buttons; the fields sit on a white panel inside it. */
		padding: 6px;
		border: 0;
		border-radius: 22px;
		background: var(--soft);
		color: var(--ink);
	}
	.body {
		overflow: hidden;
		padding: 20px;
		border-radius: 17px;
		background: var(--cream);
		box-shadow: 0 0 0 1px var(--line);
	}
	dialog::backdrop {
		background: rgb(0 0 0 / 0.45);
	}
	/* Scale and fade in and out; the backdrop fades with it. */
	dialog {
		opacity: 0;
		scale: 0.97;
		translate: 0 8px;
		transition:
			opacity 0.2s ease,
			scale 0.2s ease,
			translate 0.2s ease,
			overlay 0.2s allow-discrete,
			display 0.2s allow-discrete;
	}
	dialog[open] {
		opacity: 1;
		scale: 1;
		translate: 0 0;
	}
	dialog::backdrop {
		opacity: 0;
		transition:
			opacity 0.2s ease,
			overlay 0.2s allow-discrete,
			display 0.2s allow-discrete;
	}
	dialog[open]::backdrop {
		opacity: 1;
	}
	@starting-style {
		dialog[open] {
			opacity: 0;
			scale: 0.97;
			translate: 0 8px;
		}
		dialog[open]::backdrop {
			opacity: 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		dialog,
		dialog::backdrop {
			transition: none;
		}
	}
	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 10px 10px 12px 14px;
	}
	h2 {
		margin: 0;
		font: 700 1.25rem var(--sans);
		text-transform: none;
		letter-spacing: -0.01em;
	}
	.x {
		display: grid;
		place-items: center;
		width: 40px;
		height: 40px;
		border: 0;
		border-radius: 12px;
		background: var(--cream);
		box-shadow: 0 0 0 1px var(--line);
		cursor: pointer;
	}
</style>

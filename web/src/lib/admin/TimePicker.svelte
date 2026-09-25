<script lang="ts">
	import { time } from '$lib/api';

	// `value` is 24-hour HH:MM; the hidden input submits it with the form under `name`.
	let {
		name,
		value = $bindable('12:00'),
		label
	}: { name: string; value?: string; label: string } = $props();

	let open = $state(false);
	let root: HTMLDivElement;

	const h24 = $derived(+value.slice(0, 2));
	const minute = $derived(value.slice(3, 5));
	const pm = $derived(h24 >= 12);
	const h12 = $derived(h24 % 12 || 12);
	const hours = Array.from({ length: 12 }, (_, i) => i + 1);
	const minutes = ['00', '15', '30', '45'];
	const pad = (n: number) => String(n).padStart(2, '0');

	function set(h: number, m: string, isPm: boolean) {
		value = `${pad((h % 12) + (isPm ? 12 : 0))}:${m}`;
	}

	// Close on a click outside or Escape, like a native menu.
	function onWindowClick(e: MouseEvent) {
		if (open && !root.contains(e.target as Node)) open = false;
	}
</script>

<svelte:window onclick={onWindowClick} onkeydown={(e) => e.key === 'Escape' && (open = false)} />

<div class="picker" bind:this={root}>
	<input type="hidden" {name} {value} />
	<button
		type="button"
		class="field"
		aria-haspopup="dialog"
		aria-expanded={open}
		aria-label="{label}: {time(value)}"
		onclick={() => (open = !open)}
	>
		{time(value)}
	</button>
	{#if open}
		<div class="pop" role="dialog" aria-label={label}>
			<div class="col" role="listbox" aria-label="Hour">
				{#each hours as h (h)}
					<button
						type="button"
						role="option"
						aria-selected={h === h12}
						onclick={() => set(h, minute, pm)}>{h}</button
					>
				{/each}
			</div>
			<div class="col" role="listbox" aria-label="Minute">
				{#each minutes as m (m)}
					<button
						type="button"
						role="option"
						aria-selected={m === minute}
						onclick={() => set(h12, m, pm)}>:{m}</button
					>
				{/each}
			</div>
			<div class="col" role="listbox" aria-label="Morning or evening">
				{#each [false, true] as isPm (isPm)}
					<button
						type="button"
						role="option"
						aria-selected={isPm === pm}
						onclick={() => set(h12, minute, isPm)}
					>
						{isPm ? 'PM' : 'AM'}
					</button>
				{/each}
				<button type="button" class="done" onclick={() => (open = false)}>Done</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.picker {
		position: relative;
	}
	.field {
		width: 100%;
		min-height: 44px;
		padding: 10px 40px 10px 12px;
		border: 0;
		border-radius: 10px;
		background: #fffdf6
			url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23d5161a' stroke-width='2' stroke-linecap='round'%3E%3Ccircle cx='12' cy='12' r='9'/%3E%3Cpath d='M12 7v5l3 2'/%3E%3C/svg%3E")
			no-repeat right 12px center / 18px;
		box-shadow: inset 0 0 0 2px var(--line);
		color: var(--ink);
		font: 400 1rem var(--sans);
		font-variant-numeric: tabular-nums;
		text-align: left;
		cursor: pointer;
	}
	.field:hover {
		box-shadow: inset 0 0 0 2px #d4c4a4;
	}
	.field[aria-expanded='true'],
	.field:focus-visible {
		outline: none;
		box-shadow:
			inset 0 0 0 2px var(--black),
			0 0 0 3px rgb(244 180 0 / 0.5);
	}
	.pop {
		position: absolute;
		z-index: 20;
		top: calc(100% + 6px);
		left: 0;
		display: flex;
		gap: 6px;
		padding: 8px;
		border-radius: 14px;
		background: var(--black);
		box-shadow: 0 16px 40px rgb(0 0 0 / 0.25);
	}
	.col {
		display: grid;
		align-content: start;
		gap: 2px;
		max-height: 232px;
		overflow-y: auto;
		scrollbar-width: none;
	}
	.col button {
		min-width: 52px;
		padding: 8px 10px;
		border: 0;
		border-radius: 8px;
		background: none;
		color: var(--cream);
		font: 600 0.9375rem var(--sans);
		font-variant-numeric: tabular-nums;
		cursor: pointer;
	}
	.col button:hover {
		background: rgb(255 249 231 / 0.12);
	}
	.col button[aria-selected='true'] {
		background: var(--brand);
	}
	.col button:focus-visible {
		outline: 2px solid var(--mustard);
		outline-offset: -2px;
	}
	.col .done {
		margin-top: 8px;
		background: var(--mustard);
		color: var(--black);
	}
	.col .done:hover {
		background: #ffc933;
	}
</style>

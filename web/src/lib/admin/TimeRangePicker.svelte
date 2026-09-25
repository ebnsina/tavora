<script lang="ts">
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { ArrowDown01Icon, Clock01Icon } from '@hugeicons/core-free-icons';
	import { time } from '$lib/api';

	// Opening and closing time in one field: pick when you open, then when you close. Values are 24-hour HH:MM.
	let {
		opens = $bindable(),
		closes = $bindable(),
		openName,
		closeName,
		label
	}: {
		opens: string;
		closes: string;
		openName: string;
		closeName: string;
		label: string;
	} = $props();

	let open = $state(false);
	let step = $state<'opens' | 'closes'>('opens');
	let root = $state<HTMLDivElement>();
	let lists = $state<HTMLDivElement>();

	const pad = (n: number) => String(n).padStart(2, '0');
	// Every 15 minutes from 5 AM to 11:45 PM, plus whatever is saved if it's off that grid.
	const grid = Array.from(
		{ length: 76 },
		(_, i) => `${pad(5 + Math.floor(i / 4))}:${pad((i % 4) * 15)}`
	);
	const slots = $derived([...new Set([...grid, opens, closes])].sort());

	function toggle() {
		open = !open;
		step = 'opens';
		// Bring the chosen times into view in both columns.
		requestAnimationFrame(() =>
			lists
				?.querySelectorAll('[aria-selected="true"]')
				.forEach((el) => el.scrollIntoView({ block: 'center' }))
		);
	}
	function pickOpen(t: string) {
		opens = t;
		if (closes <= t) closes = slots.find((s) => s > t) ?? closes;
		step = 'closes';
	}
	function pickClose(t: string) {
		closes = t;
		open = false;
	}
	function outside(e: MouseEvent) {
		if (open && root && !root.contains(e.target as Node)) open = false;
	}
</script>

<svelte:window onclick={outside} onkeydown={(e) => e.key === 'Escape' && (open = false)} />

<div class="trp" bind:this={root}>
	<input type="hidden" name={openName} value={opens} />
	<input type="hidden" name={closeName} value={closes} />
	<button
		type="button"
		class="trigger"
		aria-haspopup="dialog"
		aria-expanded={open}
		aria-label="{label}: {time(opens)} to {time(closes)}"
		onclick={toggle}
	>
		<HugeiconsIcon icon={Clock01Icon} size={16} />
		<span>{time(opens)} – {time(closes)}</span>
		<span class="chev"><HugeiconsIcon icon={ArrowDown01Icon} size={16} /></span>
	</button>

	{#if open}
		<div class="panel" role="dialog" aria-label={label}>
			<div class="cols" bind:this={lists}>
				{#each [['opens', 'Opens', opens], ['closes', 'Closes', closes]] as const as [key, title, current] (key)}
					<div class="col" class:active={step === key}>
						<button type="button" class="col-head" onclick={() => (step = key)}>{title}</button>
						<div class="list" role="listbox" aria-label={title}>
							{#each slots as t (t)}
								<button
									type="button"
									role="option"
									aria-selected={t === current}
									disabled={key === 'closes' && t <= opens}
									onclick={() => (key === 'opens' ? pickOpen(t) : pickClose(t))}>{time(t)}</button
								>
							{/each}
						</div>
					</div>
				{/each}
			</div>
			<p class="hint">{step === 'opens' ? 'Pick when you open' : 'Now pick when you close'}</p>
		</div>
	{/if}
</div>

<style>
	.trp {
		position: relative;
	}
	.trigger {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		min-height: 40px;
		padding: 0 12px;
		border: 0;
		border-radius: 10px;
		background: #ffffff;
		box-shadow: inset 0 0 0 1px var(--line);
		color: var(--ink);
		font: 500 0.9375rem var(--sans);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
		cursor: pointer;
	}
	.trigger:hover {
		box-shadow: inset 0 0 0 1px #cbd5e1;
	}
	.trigger[aria-expanded='true'],
	.trigger:focus-visible {
		outline: 2px solid var(--brand);
		outline-offset: 2px;
		box-shadow: inset 0 0 0 1px #e2e8f0;
	}
	.trigger :global(svg:first-child) {
		color: var(--brand);
	}
	.chev {
		display: grid;
		color: var(--muted);
		transition: rotate 0.2s;
	}
	[aria-expanded='true'] .chev {
		rotate: 180deg;
	}
	.panel {
		position: absolute;
		z-index: 30;
		top: calc(100% + 8px);
		left: 0;
		width: 280px;
		padding: 10px;
		border-radius: 14px;
		background: #ffffff;
		box-shadow:
			0 0 0 1px var(--line),
			0 24px 48px -16px rgb(15 23 42 / 0.3);
		animation: pop 0.18s cubic-bezier(0.2, 0.8, 0.2, 1) both;
	}
	@keyframes pop {
		from {
			opacity: 0;
			translate: 0 -6px;
		}
	}
	.cols {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
	}
	.col-head {
		width: 100%;
		margin-bottom: 6px;
		padding: 6px;
		border: 0;
		border-radius: 8px;
		background: none;
		color: var(--muted);
		font: 700 0.75rem var(--sans);
		letter-spacing: 0.06em;
		text-transform: uppercase;
		cursor: pointer;
	}
	.col.active .col-head {
		background: var(--soft);
		color: var(--ink);
	}
	.list {
		display: grid;
		gap: 2px;
		height: 240px;
		overflow-y: auto;
		overscroll-behavior: contain;
		scrollbar-width: thin;
	}
	.list button {
		padding: 8px 10px;
		border: 0;
		border-radius: 8px;
		background: none;
		color: var(--ink);
		font: 600 0.875rem var(--sans);
		font-variant-numeric: tabular-nums;
		text-align: left;
		cursor: pointer;
	}
	.list button:hover:not(:disabled) {
		box-shadow: inset 0 0 0 2px var(--brand);
	}
	.list [aria-selected='true'] {
		background: var(--brand);
		color: var(--cream);
	}
	.list button:disabled {
		color: var(--line);
		cursor: not-allowed;
	}
	.col:not(.active) .list {
		opacity: 0.6;
	}
	.hint {
		margin: 8px 4px 0;
		color: var(--muted);
		font-size: 0.8125rem;
	}
	@media (prefers-reduced-motion: reduce) {
		.panel {
			animation: none;
		}
	}
</style>

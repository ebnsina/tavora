<script lang="ts">
	type Point = { label: string; tip: string; value: number; display: string };
	let { points, caption }: { points: Point[]; caption: string } = $props();

	let width = $state(600);
	const height = 240;
	const pad = { top: 16, right: 8, bottom: 28, left: 56 };
	let hover = $state<number | null>(null);

	// Round the top of the axis up to a clean step (1, 2, 5 × 10ⁿ) so tick labels read naturally.
	const ticks = $derived.by(() => {
		const max = Math.max(1, ...points.map((p) => p.value));
		const raw = max / 4;
		const mag = 10 ** Math.floor(Math.log10(raw));
		const step = [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw)!;
		return Array.from({ length: Math.ceil(max / step) + 1 }, (_, i) => i * step);
	});
	const top = $derived(ticks[ticks.length - 1]);
	const plotW = $derived(Math.max(0, width - pad.left - pad.right));
	const plotH = height - pad.top - pad.bottom;
	const slot = $derived(plotW / Math.max(1, points.length));
	const barW = $derived(Math.min(24, slot * 0.7));
	const y = (v: number) => pad.top + plotH - (v / top) * plotH;
	// Label every nth day so dates never collide.
	const every = $derived(
		Math.max(1, Math.ceil(points.length / Math.max(1, Math.floor(plotW / 56))))
	);
	const compact = new Intl.NumberFormat('en-BD', { notation: 'compact', maximumFractionDigits: 1 });

	// Columns: 4px rounded data-end, square at the baseline.
	function column(x: number, v: number) {
		const h = Math.max(0, pad.top + plotH - y(v));
		if (h === 0) return '';
		const r = Math.min(4, h, barW / 2);
		const base = pad.top + plotH;
		return `M${x} ${base}V${base - h + r}q0 ${-r} ${r} ${-r}h${barW - 2 * r}q${r} 0 ${r} ${r}V${base}z`;
	}
</script>

<figure class="chart" bind:clientWidth={width}>
	<svg {width} {height} role="img" aria-label={caption}>
		{#each ticks as t (t)}
			<line class="grid" x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} />
			<text class="tick" x={pad.left - 8} y={y(t)} dy="0.32em" text-anchor="end"
				>৳{compact.format(t)}</text
			>
		{/each}
		{#each points as p, i (p.label)}
			{@const x = pad.left + i * slot + (slot - barW) / 2}
			<path class="bar" class:dim={hover !== null && hover !== i} d={column(x, p.value)} />
			{#if i % every === 0}
				<text class="tick" x={x + barW / 2} y={height - 8} text-anchor="middle">{p.label}</text>
			{/if}
			<!-- Hit target covers the whole slot, far larger than the bar. -->
			<rect
				class="hit"
				x={pad.left + i * slot}
				y={pad.top}
				width={slot}
				height={plotH}
				role="presentation"
				onmouseenter={() => (hover = i)}
				onmouseleave={() => (hover = null)}
			/>
		{/each}
	</svg>
	{#if hover !== null}
		{@const p = points[hover]}
		<div
			class="tip"
			style="left: {Math.min(
				width - 150,
				Math.max(0, pad.left + hover * slot + slot / 2 - 75)
			)}px; top: {Math.max(0, y(p.value) - 64)}px"
		>
			<span>{p.tip}</span><strong>{p.display}</strong>
		</div>
	{/if}
	<details class="table">
		<summary>Show as a table</summary>
		<table>
			<thead><tr><th>Day</th><th>Revenue</th></tr></thead>
			<tbody>
				{#each points as p (p.label)}<tr><td>{p.tip}</td><td>{p.display}</td></tr>{/each}
			</tbody>
		</table>
	</details>
</figure>

<style>
	.chart {
		position: relative;
		margin: 0;
	}
	svg {
		display: block;
		overflow: visible;
	}
	.grid {
		stroke: var(--line);
		stroke-width: 1;
	}
	.tick {
		fill: var(--muted);
		font: 500 11px var(--sans);
		font-variant-numeric: tabular-nums;
	}
	.bar {
		fill: var(--brand);
		transition: opacity 0.15s;
	}
	.bar.dim {
		opacity: 0.35;
	}
	.hit {
		fill: transparent;
	}
	.tip {
		position: absolute;
		display: grid;
		width: 150px;
		padding: 8px 12px;
		border-radius: 10px;
		background: var(--black);
		color: var(--cream);
		font-size: 0.8125rem;
		pointer-events: none;
	}
	.tip strong {
		font-size: 1rem;
		font-variant-numeric: tabular-nums;
	}
	.table {
		margin-top: 8px;
		font-size: 0.8125rem;
		color: var(--muted);
	}
	.table summary {
		cursor: pointer;
	}
	table {
		margin-top: 8px;
		border-collapse: collapse;
		width: 100%;
		max-width: 360px;
	}
	th,
	td {
		padding: 4px 8px;
		text-align: left;
		border-bottom: 1px solid var(--line);
	}
	td:last-child,
	th:last-child {
		text-align: right;
		font-variant-numeric: tabular-nums;
	}
</style>

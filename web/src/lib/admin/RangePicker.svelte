<script lang="ts">
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		ArrowDown01Icon,
		ArrowLeft01Icon,
		ArrowRight01Icon,
		Calendar03Icon,
		Tick02Icon
	} from '@hugeicons/core-free-icons';

	type Preset = { key: string; label: string; from: string; to: string };
	// One button for dates: presets on the left, a calendar on the right. In range mode the first click
	// sets the start and the second the end; in single mode one click picks the day. Dates are YYYY-MM-DD.
	let {
		mode = 'range',
		from,
		to,
		presets,
		active,
		maxDays = 366,
		onchange
	}: {
		mode?: 'range' | 'single';
		from: string;
		to: string;
		presets: Preset[];
		active?: string;
		maxDays?: number;
		onchange: (v: { preset?: string; from: string; to: string }) => void;
	} = $props();

	const iso = (d: Date) =>
		`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	const date = (s: string) => new Date(`${s}T00:00`);
	const today = iso(new Date());
	const days = (a: string, b: string) =>
		Math.round((date(b).getTime() - date(a).getTime()) / 86_400_000);

	const short = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
	const dayOnly = new Intl.DateTimeFormat('en-GB', { day: 'numeric' });
	const long = new Intl.DateTimeFormat('en-GB', {
		weekday: 'short',
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	});
	const monthName = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' });
	// Week starts on Saturday, the way it's read in Bangladesh.
	const weekdays = [6, 0, 1, 2, 3, 4, 5].map((d) =>
		new Intl.DateTimeFormat('en-GB', { weekday: 'narrow' }).format(new Date(2024, 0, 7 + d))
	);

	let open = $state(false);
	// Open towards whichever side has room.
	let alignRight = $state(false);
	let root = $state<HTMLDivElement>();
	let start = $state<string | null>(null);
	let hover = $state<string | null>(null);
	// The month on the right is the one holding the end date; range mode shows the month before it too.
	// svelte-ignore state_referenced_locally
	let view = $state(new Date(date(to).getFullYear(), date(to).getMonth(), 1));

	const sameMonth = $derived(from.slice(0, 7) === to.slice(0, 7));
	const rangeText = $derived(
		mode === 'single' || from === to
			? long.format(date(to))
			: `${sameMonth ? dayOnly.format(date(from)) : short.format(date(from))} – ${short.format(date(to))}`
	);
	const presetLabel = $derived(presets.find((p) => p.key === active)?.label);

	const months = $derived(
		mode === 'range' ? [new Date(view.getFullYear(), view.getMonth() - 1, 1), view] : [view]
	);
	function cells(m: Date) {
		const lead = (new Date(m.getFullYear(), m.getMonth(), 1).getDay() + 1) % 7;
		const count = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
		return [
			...Array.from({ length: lead }, () => null),
			...Array.from({ length: count }, (_, i) =>
				iso(new Date(m.getFullYear(), m.getMonth(), i + 1))
			)
		];
	}
	const shift = (n: number) => (view = new Date(view.getFullYear(), view.getMonth() + n, 1));

	// What the calendar highlights: the saved range, or the one being picked (start → hovered day).
	const lo = $derived(start ? (hover && hover < start ? hover : start) : from);
	const hi = $derived(start ? (hover && hover > start ? hover : start) : to);
	const tooLong = (d: string) => !!start && Math.abs(days(start, d)) >= maxDays;

	function toggle() {
		open = !open;
		if (root) alignRight = root.getBoundingClientRect().left + 720 > innerWidth;
		start = null;
		view = new Date(date(to).getFullYear(), date(to).getMonth(), 1);
	}
	function choose(p: Preset) {
		open = false;
		onchange({ preset: p.key, from: p.from, to: p.to });
	}
	function pick(d: string) {
		if (mode === 'single') {
			open = false;
			return onchange({ from: d, to: d });
		}
		if (!start) {
			start = d;
			return;
		}
		const [a, b] = d < start ? [d, start] : [start, d];
		start = null;
		open = false;
		onchange({ from: a, to: b });
	}
	function outside(e: MouseEvent) {
		if (open && root && !root.contains(e.target as Node)) open = false;
	}
</script>

<svelte:window onclick={outside} onkeydown={(e) => e.key === 'Escape' && (open = false)} />

<div class="rp" bind:this={root}>
	<button
		type="button"
		class="trigger"
		aria-haspopup="dialog"
		aria-expanded={open}
		onclick={toggle}
	>
		<HugeiconsIcon icon={Calendar03Icon} size={18} />
		{#if presetLabel}<strong>{presetLabel}</strong><span class="dot">·</span>{/if}
		<span class="range">{rangeText}</span>
		<span class="chev"><HugeiconsIcon icon={ArrowDown01Icon} size={16} /></span>
	</button>

	{#if open}
		<button class="scrim" type="button" aria-label="Close" onclick={() => (open = false)}></button>
		<div
			class="panel"
			class:single={mode === 'single'}
			class:right={alignRight}
			role="dialog"
			aria-label="Choose dates"
		>
			<div class="presets" role="listbox" aria-label="Quick ranges">
				{#each presets as p (p.key)}
					<button
						type="button"
						role="option"
						aria-selected={p.key === active}
						onclick={() => choose(p)}
					>
						{p.label}
						{#if p.key === active}<HugeiconsIcon icon={Tick02Icon} size={16} />{/if}
					</button>
				{/each}
			</div>

			<div class="cal">
				<div class="months">
					{#each months as m, mi (m.getTime())}
						<div class="month">
							<div class="head">
								{#if mi === 0}
									<button
										type="button"
										class="nav"
										aria-label="Previous month"
										onclick={() => shift(-1)}
										><HugeiconsIcon icon={ArrowLeft01Icon} size={16} /></button
									>
								{:else}<span class="nav-space"></span>{/if}
								<strong>{monthName.format(m)}</strong>
								{#if mi === months.length - 1}
									<button
										type="button"
										class="nav"
										aria-label="Next month"
										disabled={iso(new Date(view.getFullYear(), view.getMonth() + 1, 1)) > today}
										onclick={() => shift(1)}
										><HugeiconsIcon icon={ArrowRight01Icon} size={16} /></button
									>
								{:else}<span class="nav-space"></span>{/if}
							</div>
							<div class="grid">
								{#each weekdays as w, i (i)}<span class="wd" aria-hidden="true">{w}</span>{/each}
								{#each cells(m) as d, i (d ?? `b-${i}`)}
									{#if d}
										<button
											type="button"
											class="day"
											class:in={d > lo && d < hi}
											class:edge={d === lo || d === hi}
											class:start={d === lo && lo !== hi}
											class:end={d === hi && lo !== hi}
											class:today={d === today}
											aria-pressed={d === lo || d === hi}
											aria-label={long.format(date(d))}
											disabled={d > today || tooLong(d)}
											onmouseenter={() => (hover = d)}
											onclick={() => pick(d)}>{+d.slice(8)}</button
										>
									{:else}<span></span>{/if}
								{/each}
							</div>
						</div>
					{/each}
				</div>
				<p class="hint" aria-live="polite">
					{#if mode === 'single'}Pick a day
					{:else if start}Now pick the last day · {short.format(date(start))} –
					{:else}Pick the first day, then the last{/if}
				</p>
			</div>
		</div>
	{/if}
</div>

<style>
	.rp {
		position: relative;
		max-width: 100%;
	}
	.trigger {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		max-width: 100%;
		min-height: 40px;
		padding: 0 12px;
		border: 0;
		border-radius: 10px;
		background: #fffdf6;
		box-shadow: inset 0 0 0 1px var(--line);
		color: var(--ink);
		font: 500 0.9375rem var(--sans);
		white-space: nowrap;
		cursor: pointer;
	}
	.trigger:hover {
		box-shadow: inset 0 0 0 1px #d4c4a4;
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
	.trigger strong {
		font-weight: 700;
	}
	.dot {
		color: var(--muted);
	}
	.range {
		overflow: hidden;
		text-overflow: ellipsis;
		color: var(--muted);
	}
	.chev {
		display: grid;
		margin-left: 2px;
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
		display: grid;
		grid-template-columns: 160px auto;
		overflow: hidden;
		border-radius: 16px;
		background: #fffdf6;
		box-shadow:
			0 0 0 1px var(--line),
			0 24px 48px -16px rgb(40 20 0 / 0.3);
		animation: pop 0.18s cubic-bezier(0.2, 0.8, 0.2, 1) both;
	}
	@keyframes pop {
		from {
			opacity: 0;
			translate: 0 -6px;
			scale: 0.98;
		}
	}
	.panel.right {
		right: 0;
		left: auto;
	}
	.presets {
		display: grid;
		align-content: start;
		gap: 2px;
		padding: 12px;
		border-right: 1px solid var(--line);
		background: var(--cream);
	}
	.presets button {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 9px 12px;
		border: 0;
		border-radius: 8px;
		background: none;
		color: var(--ink);
		font: 600 0.875rem var(--sans);
		text-align: left;
		white-space: nowrap;
		cursor: pointer;
	}
	.presets button:hover {
		background: var(--soft);
	}
	.presets [aria-selected='true'] {
		background: var(--ink);
		color: var(--cream);
	}
	.cal {
		padding: 14px 16px 12px;
	}
	.months {
		display: flex;
		gap: 24px;
	}
	.month {
		width: 252px;
	}
	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 8px;
	}
	.head strong {
		font-size: 0.9375rem;
	}
	.nav,
	.nav-space {
		width: 32px;
		height: 32px;
	}
	.nav {
		display: grid;
		place-items: center;
		border: 0;
		border-radius: 8px;
		background: var(--soft);
		color: var(--ink);
		cursor: pointer;
	}
	.nav:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		row-gap: 2px;
	}
	.wd {
		padding: 4px 0 6px;
		color: var(--muted);
		font-size: 0.75rem;
		font-weight: 700;
		text-align: center;
	}
	.day {
		height: 36px;
		border: 0;
		background: none;
		color: var(--ink);
		font: 600 0.875rem var(--sans);
		font-variant-numeric: tabular-nums;
		cursor: pointer;
	}
	/* Hover is a ring, so it never breaks the range band or hides a selected end. */
	.day:hover:not(:disabled) {
		border-radius: 8px;
		box-shadow: inset 0 0 0 2px var(--brand);
	}
	.day.today {
		text-decoration: underline 2px var(--mustard);
		text-underline-offset: 4px;
	}
	/* The range: a soft band between two solid ends. */
	.day.in {
		background: var(--accent-soft);
		border-radius: 0;
	}
	.day.edge {
		border-radius: 8px;
		background: var(--brand);
		color: var(--cream);
	}
	.day.start {
		border-radius: 8px 0 0 8px;
	}
	.day.end {
		border-radius: 0 8px 8px 0;
	}
	.day:disabled {
		color: var(--line);
		cursor: not-allowed;
	}
	.day:focus-visible,
	.nav:focus-visible,
	.presets button:focus-visible {
		outline: 2px solid var(--brand);
		outline-offset: 2px;
	}
	.hint {
		margin: 10px 0 0;
		color: var(--muted);
		font-size: 0.8125rem;
	}
	.panel.single {
		grid-template-columns: 140px auto;
	}
	.scrim {
		display: none;
	}

	/* Tablet: one month is enough. */
	@media (max-width: 900px) {
		.months .month:first-child:not(:last-child) {
			display: none;
		}
	}
	/* Phone: a bottom sheet, presets as chips across the top. */
	@media (max-width: 759px) {
		.scrim {
			position: fixed;
			inset: 0;
			z-index: 65;
			display: block;
			border: 0;
			background: rgb(0 0 0 / 0.45);
			animation: pop 0.2s both;
		}
		.panel,
		.panel.right {
			position: fixed;
			inset: auto 0 0;
			z-index: 70;
			grid-template-columns: 1fr;
			border-radius: 20px 20px 0 0;
			padding-bottom: env(safe-area-inset-bottom);
			animation-name: sheet;
		}
		.panel.single {
			grid-template-columns: 1fr;
		}
		@keyframes sheet {
			from {
				translate: 0 100%;
			}
		}
		.presets {
			display: flex;
			gap: 6px;
			overflow-x: auto;
			border-right: 0;
			border-bottom: 1px solid var(--line);
		}
		.presets button :global(svg) {
			display: none;
		}
		.presets button {
			flex: none;
			border-radius: 999px;
			box-shadow: inset 0 0 0 1px var(--line);
		}
		.month {
			width: 100%;
		}
		.day {
			height: 42px;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.panel {
			animation: none;
		}
	}
</style>

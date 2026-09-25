<script lang="ts">
	// `value` is YYYY-MM-DD; the hidden input submits it with the form under `name`.
	let {
		name,
		value = $bindable(''),
		label,
		max
	}: { name: string; value?: string; label: string; max?: string } = $props();

	let open = $state(false);
	let root: HTMLDivElement;
	// svelte-ignore state_referenced_locally
	let month = $state(new Date(`${value || new Date().toISOString().slice(0, 10)}T00:00`));

	const iso = (d: Date) =>
		`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	const today = iso(new Date());
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

	const cells = $derived.by(() => {
		const first = new Date(month.getFullYear(), month.getMonth(), 1);
		const lead = (first.getDay() + 1) % 7;
		const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
		return [
			...Array.from({ length: lead }, () => null),
			...Array.from({ length: count }, (_, i) =>
				iso(new Date(month.getFullYear(), month.getMonth(), i + 1))
			)
		];
	});

	const shift = (n: number) => (month = new Date(month.getFullYear(), month.getMonth() + n, 1));
	function pick(d: string) {
		value = d;
		open = false;
	}
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
		aria-label="{label}: {value ? long.format(new Date(`${value}T00:00`)) : 'not set'}"
		onclick={() => (open = !open)}
	>
		{value ? long.format(new Date(`${value}T00:00`)) : 'Pick a date'}
	</button>
	{#if open}
		<div class="pop" role="dialog" aria-label={label}>
			<div class="head">
				<button type="button" class="nav" aria-label="Previous month" onclick={() => shift(-1)}
					>‹</button
				>
				<strong>{monthName.format(month)}</strong>
				<button type="button" class="nav" aria-label="Next month" onclick={() => shift(1)}>›</button
				>
			</div>
			<div class="grid">
				{#each weekdays as w, i (i)}<span class="wd" aria-hidden="true">{w}</span>{/each}
				{#each cells as d, i (d ?? `blank-${i}`)}
					{#if d}
						<button
							type="button"
							class="day"
							class:today={d === today}
							aria-pressed={d === value}
							aria-label={long.format(new Date(`${d}T00:00`))}
							disabled={!!max && d > max}
							onclick={() => pick(d)}>{+d.slice(8)}</button
						>
					{:else}
						<span></span>
					{/if}
				{/each}
			</div>
			<button type="button" class="jump" onclick={() => pick(today)}>Today</button>
		</div>
	{/if}
</div>

<style>
	.picker {
		position: relative;
	}
	.field {
		width: 100%;
		min-height: 38px;
		padding: 6px 40px 6px 12px;
		border: 0;
		border-radius: 10px;
		background: #fffdf6
			url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23d5161a' stroke-width='2' stroke-linecap='round'%3E%3Crect x='3' y='5' width='18' height='16' rx='3'/%3E%3Cpath d='M3 10h18M8 3v4M16 3v4'/%3E%3C/svg%3E")
			no-repeat right 12px center / 18px;
		box-shadow: inset 0 0 0 2px var(--line);
		color: var(--ink);
		font: 400 0.9375rem var(--sans);
		text-align: left;
		white-space: nowrap;
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
		right: 0;
		width: 280px;
		padding: 12px;
		border-radius: 14px;
		background: var(--black);
		color: var(--cream);
		box-shadow: 0 16px 40px rgb(0 0 0 / 0.25);
	}
	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 8px;
	}
	.nav {
		width: 32px;
		height: 32px;
		border: 0;
		border-radius: 8px;
		background: rgb(255 249 231 / 0.1);
		color: var(--cream);
		font-size: 1.25rem;
		line-height: 1;
		cursor: pointer;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 2px;
	}
	.wd {
		padding: 4px 0;
		text-align: center;
		font-size: 0.75rem;
		font-weight: 700;
		color: rgb(255 249 231 / 0.5);
	}
	.day {
		aspect-ratio: 1;
		border: 0;
		border-radius: 8px;
		background: none;
		color: var(--cream);
		font: 600 0.875rem var(--sans);
		font-variant-numeric: tabular-nums;
		cursor: pointer;
	}
	.day:hover:not(:disabled) {
		background: rgb(255 249 231 / 0.12);
	}
	.day.today {
		box-shadow: inset 0 0 0 2px var(--mustard);
	}
	.day[aria-pressed='true'] {
		background: var(--brand);
	}
	.day:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}
	.day:focus-visible,
	.nav:focus-visible,
	.jump:focus-visible {
		outline: 2px solid var(--mustard);
		outline-offset: -2px;
	}
	.jump {
		width: 100%;
		margin-top: 8px;
		padding: 8px;
		border: 0;
		border-radius: 8px;
		background: var(--mustard);
		color: var(--black);
		font: 700 0.875rem var(--sans);
		cursor: pointer;
	}
</style>

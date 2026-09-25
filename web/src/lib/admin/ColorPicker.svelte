<script lang="ts">
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { Alert02Icon, Tick02Icon } from '@hugeicons/core-free-icons';

	// Brand colour: curated swatches, any custom colour, and a live readability check (same 4.5:1 rule as the API).
	let {
		name,
		value = $bindable(),
		ok = $bindable(true)
	}: { name: string; value: string; ok?: boolean } = $props();

	const presets = [
		['#d5161a', 'Chili red'],
		['#c2410c', 'Tomato'],
		['#be185d', 'Berry'],
		['#7e22ce', 'Plum'],
		['#1d4ed8', 'Royal blue'],
		['#0f766e', 'Teal'],
		['#1f7a3f', 'Leaf green'],
		['#262626', 'Charcoal']
	];
	// svelte-ignore state_referenced_locally
	let hex = $state(value);
	const valid = $derived(/^#[0-9a-f]{6}$/i.test(hex));
	$effect(() => {
		if (valid) value = hex.toLowerCase();
	});
	const pick = (c: string) => (hex = c);

	function lum(c: string) {
		const ch = (i: number) => {
			const x = parseInt(c.slice(i, i + 2), 16) / 255;
			return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
		};
		return 0.2126 * ch(1) + 0.7152 * ch(3) + 0.0722 * ch(5);
	}
	const ratio = $derived(valid ? (lum('#fff9e7') + 0.05) / (lum(value) + 0.05) : 0);
	const readable = $derived(ratio >= 4.5);
	$effect(() => {
		ok = valid && readable;
	});
	const presetName = $derived(presets.find(([c]) => c === value)?.[1] ?? 'Custom colour');
	const fmt = new Intl.NumberFormat('en', { maximumFractionDigits: 1 });
</script>

<div class="picker" style="--c: {value}">
	<div class="swatches" role="radiogroup" aria-label="Brand colour">
		{#each presets as [c, label] (c)}
			<button
				type="button"
				role="radio"
				class="sw"
				style="--s: {c}"
				aria-checked={value === c}
				aria-label={label}
				title={label}
				onclick={() => pick(c)}
			>
				{#if value === c}<HugeiconsIcon icon={Tick02Icon} size={16} strokeWidth={2.5} />{/if}
			</button>
		{/each}
		<label class="sw custom" title="Pick any colour" class:on={!presets.some(([c]) => c === value)}>
			<input
				type="color"
				{value}
				oninput={(e) => pick(e.currentTarget.value)}
				aria-label="Pick any colour"
			/>
		</label>
	</div>

	<div class="row">
		<label class="hex">
			<span class="chip" aria-hidden="true"></span>
			<input
				bind:value={hex}
				maxlength="7"
				spellcheck="false"
				autocomplete="off"
				aria-label="Colour code"
				aria-invalid={!valid}
			/>
		</label>
		<span class="name">{presetName}</span>
		{#if !valid}
			<span class="status bad"
				><HugeiconsIcon icon={Alert02Icon} size={14} /> Use a code like #d5161a</span
			>
		{:else if readable}
			<span class="status ok"
				><HugeiconsIcon icon={Tick02Icon} size={14} /> Easy to read · {fmt.format(ratio)}:1</span
			>
		{:else}
			<span class="status bad"
				><HugeiconsIcon icon={Alert02Icon} size={14} /> Too light to read text on · {fmt.format(
					ratio
				)}:1</span
			>
		{/if}
	</div>

	<div class="preview" aria-label="Preview">
		<span class="p-label">Preview</span>
		<div class="p-row">
			<span class="p-btn">Order now</span>
			<span class="p-ghost">See menu</span>
			<span class="p-badge">New</span>
			<span class="p-link">Book a table</span>
		</div>
	</div>

	<input type="hidden" {name} {value} />
</div>

<style>
	.picker {
		display: grid;
		gap: 16px;
	}
	.swatches {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}
	.sw {
		display: grid;
		place-items: center;
		width: 36px;
		height: 36px;
		padding: 0;
		border: 0;
		border-radius: 50%;
		background: var(--s);
		color: #fff;
		box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.12);
		cursor: pointer;
		transition: transform 0.12s;
	}
	.sw:hover {
		transform: scale(1.08);
	}
	.sw[aria-checked='true'],
	.custom.on {
		box-shadow:
			0 0 0 2px var(--cream),
			0 0 0 4px var(--ink);
	}
	.custom {
		position: relative;
		overflow: hidden;
		background: conic-gradient(#e11d48, #f59e0b, #16a34a, #0ea5e9, #7c3aed, #e11d48);
	}
	.custom input {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		opacity: 0;
		cursor: pointer;
	}
	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 10px 14px;
	}
	.hex {
		display: flex !important;
		align-items: center;
		gap: 8px;
		width: 150px;
		height: 40px;
		padding: 0 12px 0 8px;
		border-radius: 10px;
		background: #fffdf6;
		box-shadow: inset 0 0 0 1px var(--line);
	}
	.hex:focus-within {
		outline: 2px solid var(--brand);
		outline-offset: 2px;
		box-shadow: inset 0 0 0 1px #e2e8f0;
	}
	.hex input:focus-visible {
		outline: none;
	}
	.chip {
		width: 24px;
		height: 24px;
		flex: none;
		border-radius: 6px;
		background: var(--c);
	}
	.hex input {
		width: 100%;
		min-height: 0 !important;
		padding: 0 !important;
		border: 0 !important;
		background: none !important;
		box-shadow: none !important;
		font:
			500 0.9375rem ui-monospace,
			'Geist Mono',
			monospace !important;
		text-transform: lowercase;
		outline: none;
	}
	.name {
		font-weight: 600;
	}
	.status {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 4px 10px;
		border-radius: 999px;
		font-size: 0.8125rem;
		font-weight: 600;
	}
	.status.ok {
		background: #e3f6ec;
		color: #1f7a45;
	}
	.status.bad {
		background: #fde4e1;
		color: #b3261e;
	}
	.preview {
		display: grid;
		gap: 10px;
		padding: 14px 16px;
		border-radius: 12px;
		background: var(--cream);
		box-shadow: inset 0 0 0 1px var(--line);
	}
	.p-label {
		color: var(--muted);
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}
	.p-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 12px;
	}
	.p-btn,
	.p-ghost {
		padding: 8px 14px;
		border-radius: 10px;
		font-size: 0.875rem;
		font-weight: 700;
	}
	.p-btn {
		background: var(--c);
		color: var(--cream);
	}
	.p-ghost {
		color: var(--c);
		box-shadow: inset 0 0 0 2px var(--c);
	}
	.p-badge {
		padding: 3px 10px;
		border-radius: 999px;
		background: var(--c);
		color: var(--cream);
		font-size: 0.75rem;
		font-weight: 700;
	}
	.p-link {
		color: var(--c);
		font-weight: 700;
		text-decoration: underline;
	}
</style>

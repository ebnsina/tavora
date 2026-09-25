<script lang="ts">
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { ColorPickerIcon } from '@hugeicons/core-free-icons';
	import { fly } from 'svelte/transition';
	import { ms } from '$lib/motion';

	// A colour panel: drag in the square for shade, the slider for hue, or type the code. `hex` is #rrggbb.
	let { hex = $bindable() }: { hex: string } = $props();

	const clamp = (n: number, a = 0, b = 1) => Math.min(b, Math.max(a, n));
	const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0');

	function hsvToRgb(h: number, s: number, v: number) {
		const f = (n: number) => {
			const k = (n + h / 60) % 6;
			return (v - v * s * Math.max(0, Math.min(k, 4 - k, 1))) * 255;
		};
		return [f(5), f(3), f(1)];
	}
	function rgbToHsv(r: number, g: number, b: number) {
		[r, g, b] = [r / 255, g / 255, b / 255];
		const max = Math.max(r, g, b);
		const d = max - Math.min(r, g, b);
		const h = !d
			? 0
			: max === r
				? ((g - b) / d) % 6
				: max === g
					? (b - r) / d + 2
					: (r - g) / d + 4;
		return [(h * 60 + 360) % 360, max ? d / max : 0, max];
	}
	const rgbOf = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));

	// svelte-ignore state_referenced_locally
	const start = rgbToHsv(...(rgbOf(hex) as [number, number, number]));
	let h = $state(start[0]);
	let s = $state(start[1]);
	let v = $state(start[2]);
	const rgb = $derived(hsvToRgb(h, s, v));
	// Moving the controls writes the code; typing a code moves the controls.
	function commit() {
		hex = `#${rgb.map(toHex).join('')}`;
	}
	function fromHex(c: string) {
		if (!/^#[0-9a-f]{6}$/i.test(c)) return;
		[h, s, v] = rgbToHsv(...(rgbOf(c) as [number, number, number]));
		hex = c.toLowerCase();
	}

	let area = $state<HTMLDivElement>();
	function drag(e: PointerEvent) {
		if (e.type === 'pointerdown') area!.setPointerCapture(e.pointerId);
		else if (!area!.hasPointerCapture(e.pointerId)) return;
		const r = area!.getBoundingClientRect();
		s = clamp((e.clientX - r.left) / r.width);
		v = 1 - clamp((e.clientY - r.top) / r.height);
		commit();
	}
	function nudge(e: KeyboardEvent) {
		const d = e.shiftKey ? 0.1 : 0.02;
		const moves: Record<string, () => void> = {
			ArrowLeft: () => (s = clamp(s - d)),
			ArrowRight: () => (s = clamp(s + d)),
			ArrowUp: () => (v = clamp(v + d)),
			ArrowDown: () => (v = clamp(v - d))
		};
		if (!moves[e.key]) return;
		e.preventDefault();
		moves[e.key]();
		commit();
	}
	function setChannel(i: number, n: number) {
		const next = [...rgb];
		next[i] = clamp(n || 0, 0, 255);
		fromHex(`#${next.map(toHex).join('')}`);
	}

	// Chrome and Edge can sample any pixel on screen; elsewhere the button is left out.
	const canSample = typeof window !== 'undefined' && 'EyeDropper' in window;
	async function sample() {
		try {
			// @ts-expect-error EyeDropper is not in the DOM typings yet.
			const { sRGBHex } = await new window.EyeDropper().open();
			fromHex(sRGBHex);
		} catch {
			// Cancelled with Escape: nothing to do.
		}
	}
</script>

<div
	class="panel"
	role="dialog"
	aria-label="Pick a colour"
	transition:fly={{ y: -6, duration: ms(160) }}
>
	<div
		class="area"
		bind:this={area}
		style="--hue: {h}"
		role="slider"
		tabindex="0"
		aria-label="Shade: left and right for colourfulness, up and down for brightness"
		aria-valuetext="{Math.round(s * 100)}% colour, {Math.round(v * 100)}% brightness"
		aria-valuenow={Math.round(v * 100)}
		onpointerdown={drag}
		onpointermove={drag}
		onkeydown={nudge}
	>
		<span class="thumb" style="left: {s * 100}%; top: {(1 - v) * 100}%; background: {hex}"></span>
	</div>

	<div class="controls">
		{#if canSample}
			<button
				type="button"
				class="dropper"
				title="Pick a colour from the screen"
				aria-label="Pick a colour from the screen"
				onclick={sample}><HugeiconsIcon icon={ColorPickerIcon} size={18} /></button
			>
		{/if}
		<span class="swatch" style="background: {hex}" aria-hidden="true"></span>
		<input
			class="hue"
			type="range"
			min="0"
			max="359"
			bind:value={h}
			oninput={commit}
			aria-label="Hue"
			style="--thumb: hsl({h} 100% 50%)"
		/>
	</div>

	<div class="fields">
		<label class="f wide">
			<input
				value={hex}
				maxlength="7"
				spellcheck="false"
				onchange={(e) => fromHex(e.currentTarget.value.trim())}
			/>
			<span>Hex</span>
		</label>
		{#each ['R', 'G', 'B'] as ch, i (ch)}
			<label class="f">
				<input
					type="number"
					min="0"
					max="255"
					value={Math.round(rgb[i])}
					onchange={(e) => setChannel(i, +e.currentTarget.value)}
				/>
				<span>{ch}</span>
			</label>
		{/each}
	</div>
</div>

<style>
	.panel {
		position: absolute;
		z-index: 30;
		top: calc(100% + 8px);
		left: 0;
		display: grid;
		gap: 12px;
		width: 272px;
		padding: 12px;
		border-radius: 16px;
		background: var(--cream);
		box-shadow:
			0 0 0 1px var(--line),
			0 24px 48px -16px rgb(15 23 42 / 0.3);
	}
	/* Saturation left to right, brightness bottom to top, over the chosen hue. */
	.area {
		position: relative;
		height: 160px;
		border-radius: 10px;
		background:
			linear-gradient(to top, #000, transparent),
			linear-gradient(to right, #fff, hsl(var(--hue) 100% 50%));
		cursor: crosshair;
		touch-action: none;
	}
	.area:focus-visible {
		outline: 2px solid var(--brand);
		outline-offset: 2px;
	}
	.thumb {
		position: absolute;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		box-shadow:
			0 0 0 3px #fff,
			0 0 0 4px rgb(0 0 0 / 0.25),
			0 2px 6px rgb(0 0 0 / 0.3);
		translate: -50% -50%;
		pointer-events: none;
	}
	.controls {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.dropper {
		display: grid;
		flex: none;
		place-items: center;
		width: 34px;
		height: 34px;
		border: 0;
		border-radius: 10px;
		background: var(--soft);
		color: var(--ink);
		cursor: pointer;
	}
	.swatch {
		flex: none;
		width: 30px;
		height: 30px;
		border-radius: 50%;
		box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.12);
	}
	/* The hue slider: a native range input wearing a rainbow. */
	.hue {
		flex: 1;
		height: 12px;
		margin: 0;
		border-radius: 999px;
		background: linear-gradient(
			to right,
			#f00,
			#ff0 17%,
			#0f0 33%,
			#0ff 50%,
			#00f 67%,
			#f0f 83%,
			#f00
		);
		appearance: none;
		cursor: pointer;
	}
	.hue::-webkit-slider-thumb {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--thumb);
		box-shadow:
			0 0 0 3px #fff,
			0 1px 4px rgb(0 0 0 / 0.35);
		appearance: none;
	}
	.hue::-moz-range-thumb {
		width: 18px;
		height: 18px;
		border: 0;
		border-radius: 50%;
		background: var(--thumb);
		box-shadow:
			0 0 0 3px #fff,
			0 1px 4px rgb(0 0 0 / 0.35);
	}
	.fields {
		display: grid;
		grid-template-columns: 1.6fr 1fr 1fr 1fr;
		gap: 6px;
	}
	.f {
		display: grid !important;
		gap: 4px !important;
		justify-items: center;
	}
	.f input {
		width: 100%;
		min-height: 34px !important;
		padding: 4px 6px !important;
		border-radius: 8px !important;
		font: 500 0.8125rem var(--code) !important;
		text-align: center;
		text-transform: lowercase;
		appearance: textfield;
	}
	.f input::-webkit-inner-spin-button {
		appearance: none;
	}
	.f span {
		color: var(--muted);
		font-size: 0.6875rem;
		font-weight: 600;
	}
</style>

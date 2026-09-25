<script lang="ts">
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { Call02Icon } from '@hugeicons/core-free-icons';

	import type { SiteContent } from '$lib/api';

	let { phone, freeOver, call }: { phone: string; freeOver: string; call: SiteContent['call'] } =
		$props();

	// Side wall runs 330 wide and drops 80; windows and sign follow that slope.
	const slope = 80 / 330;
	const skew = (Math.atan(slope) * 180) / Math.PI;
	const windows = [650, 725].flatMap((x) => [400, 490, 580].map((y) => [x, y + (x - 470) * slope]));
	const stripes = Array.from({ length: 10 }, (_, i) => 40 + i * 39);
	// Bunting flags hang from a sagging string across the front wall.
	const flags = Array.from({ length: 11 }, (_, i) => {
		const t = (i + 0.5) / 11,
			x = 20 + t * 430;
		return {
			x,
			y: 240 - t * 66 + Math.sin(t * Math.PI) * 20,
			tone: ['mustard', 'cream', 'black'][i % 3]
		};
	});
	const lit = new Set([1, 4, 5]);
</script>

<!-- A corner shop building: slogan painted on the front, sign and windows on the side wall, tank on the roof. -->
<div class="building">
	<svg viewBox="0 0 800 780" aria-hidden="true">
		<g class="cloud">
			<path d="M20 90c4-16 26-18 32-6 8-14 30-12 32 4 12-2 18 10 12 16H22c-10-2-10-12-2-14z" />
			<path d="M640 50c4-16 26-18 32-6 8-14 30-12 32 4 12-2 18 10 12 16h-74c-10-2-10-12-2-14z" />
		</g>

		<!-- rooftop water tank -->
		<g class="tank">
			<path d="M318 150v-22M392 140v-22" class="legs" />
			<rect x="306" y="46" width="98" height="84" rx="14" />
			<ellipse cx="355" cy="46" rx="49" ry="12" class="lid" />
			<path d="M308 74h94M308 102h94" class="rib" />
		</g>

		<!-- faces -->
		<path class="front" d="M0 190L470 120V780H0z" />
		<path class="side" d="M470 120L800 200V780H470z" />
		<path class="roof" d="M0 190L470 120V150L0 222z" />
		<path class="roof-side" d="M470 120L800 200V230L470 150z" />
		<path class="corner" d="M470 120V780" />

		<!-- side-wall windows, skewed with the wall -->
		{#each windows as [x, y], i (`${x}-${y}`)}
			<path
				class="win"
				class:lit={lit.has(i)}
				class:flicker={i === 4}
				d="M{x} {y}l54 {54 * slope}v56l-54 {-54 * slope}z"
			/>
			<path class="win-line" d="M{x + 27} {y + 27 * slope}v56" />
			{#if i % 2 === 0}
				<path class="ac" d="M{x + 8} {y + 64 + 8 * slope}l38 {38 * slope}v18l-38 {-38 * slope}z" />
				<path
					class="ac-grill"
					d="M{x + 14} {y + 72 + 14 * slope}l26 {26 * slope}M{x + 14} {y + 78 + 14 * slope}l26 {26 *
						slope}"
				/>
			{/if}
		{/each}

		<!-- bunting across the front -->
		<path class="string" d="M20 240Q235 236 450 174" />
		{#each flags as fl, i (i)}
			<path class="flag {fl.tone}" style="--d: {i * -0.25}s" d="M{fl.x - 13} {fl.y}h26l-13 26z" />
		{/each}

		<!-- neon OPEN sign by the shop -->
		<g class="neon">
			<rect x="330" y="490" width="96" height="44" rx="10" />
			<text x="378" y="522">OPEN</text>
		</g>

		<!-- ground-floor shop: striped awning over a half-open shutter -->
		<rect class="shop" x="40" y="600" width="390" height="180" />
		<rect class="shutter" x="40" y="600" width="390" height="70" />
		{#each [614, 628, 642, 656] as y (y)}<path class="shutter-line" d="M40 {y}h390" />{/each}
		<path class="awning" d="M28 560h414l-12 40H40z" />
		{#each stripes as x (x)}<path class="stripe" d="M{x} 560l-2 40h20l2-40z" />{/each}
		<path class="awning-edge" d="M40 600 {'a9.75 9.75 0 0 0 19.5 0 '.repeat(20)}" />
	</svg>

	<!-- Sign board on the side wall, skewed to sit flat against it. -->
	<a class="sign" href="#menu" style="--skew: {skew}deg">
		<span class="s-top">{call.sign_top}</span>
		<span class="s-small">Free delivery<br />over {freeOver}</span>
		<span class="s-big">{call.sign_big}</span>
		<span class="s-pill">Open the menu</span>
	</a>

	<p class="khida">{call.slogan[0]}<br /><span>{call.slogan[1]}</span><br />{call.slogan[2]}</p>

	<a class="bulbs poster" href="tel:{phone}">
		<span class="ring"><HugeiconsIcon icon={Call02Icon} size={26} strokeWidth={2.2} /></span>
		<span class="b-text">Call the kitchen<small>{phone}</small></span>
	</a>
</div>

<style>
	.building {
		position: relative;
		container-type: inline-size;
		width: min(820px, 100%);
		margin-inline: auto;
	}
	svg {
		display: block;
		width: 100%;
		height: auto;
		overflow: visible;
	}
	.front {
		fill: var(--brand);
	}
	.side {
		fill: var(--brand-dark);
	}
	.roof {
		fill: #e8423f;
	}
	.roof-side {
		fill: #7d0b0e;
	}
	.corner {
		stroke: rgb(0 0 0 / 0.25);
		stroke-width: 3;
	}
	.cloud path {
		fill: none;
		stroke: var(--black);
		stroke-width: 4;
		stroke-linejoin: round;
	}
	.tank rect,
	.tank .lid {
		fill: var(--black);
	}
	.tank .rib {
		stroke: #333;
		stroke-width: 4;
	}
	.tank .legs {
		stroke: var(--black);
		stroke-width: 8;
	}
	.win.lit {
		fill: var(--mustard);
	}
	.win.flicker {
		animation: flicker 3.4s steps(1) infinite;
	}
	@keyframes flicker {
		0%,
		46%,
		52%,
		100% {
			fill: var(--mustard);
		}
		48%,
		50% {
			fill: #5c0709;
		}
	}
	.ac {
		fill: var(--cream);
		stroke: var(--black);
		stroke-width: 3;
	}
	.ac-grill {
		stroke: var(--black);
		stroke-width: 2;
	}
	.string {
		fill: none;
		stroke: var(--black);
		stroke-width: 3;
	}
	.flag {
		stroke: var(--black);
		stroke-width: 2.5;
		stroke-linejoin: round;
		transform-box: fill-box;
		transform-origin: top center;
		animation: sway 2.6s ease-in-out infinite;
		animation-delay: var(--d);
	}
	.flag.mustard {
		fill: var(--mustard);
	}
	.flag.cream {
		fill: var(--cream);
	}
	.flag.black {
		fill: var(--black);
	}
	@keyframes sway {
		50% {
			rotate: 10deg;
		}
	}
	.neon rect {
		fill: var(--black);
		stroke: var(--mustard);
		stroke-width: 3;
	}
	.neon text {
		fill: var(--mustard);
		font: 800 26px var(--display);
		text-anchor: middle;
		letter-spacing: 2px;
		animation: neon 2.2s steps(1) infinite;
	}
	@keyframes neon {
		0%,
		70%,
		76%,
		100% {
			opacity: 1;
		}
		72%,
		74% {
			opacity: 0.25;
		}
	}
	.win {
		fill: #5c0709;
		stroke: var(--cream);
		stroke-width: 4;
	}
	.win-line {
		stroke: var(--cream);
		stroke-width: 3;
	}
	.shop {
		fill: #3a0506;
	}
	.shutter {
		fill: #c9c3b3;
	}
	.shutter-line {
		stroke: #8f887a;
		stroke-width: 3;
	}
	.awning {
		fill: var(--cream);
		stroke: var(--black);
		stroke-width: 4;
		stroke-linejoin: round;
	}
	.stripe {
		fill: var(--mustard);
	}
	.awning-edge {
		fill: var(--cream);
		stroke: var(--black);
		stroke-width: 4;
	}

	.sign {
		position: absolute;
		left: 63.5cqw;
		top: 22cqw;
		width: 15cqw;
		height: 30cqw;
		overflow: hidden;
		display: grid;
		align-content: start;
		justify-items: center;
		gap: 0.8cqw;
		padding: 2cqw 1cqw;
		background: var(--cream);
		outline: max(2px, 0.5cqw) solid var(--black);
		color: var(--black);
		text-align: center;
		text-decoration: none;
		text-transform: uppercase;
		font-family: var(--display);
		font-weight: 800;
		font-stretch: 85%;
		line-height: 0.95;
		transform-origin: top left;
		transform: skewY(var(--skew));
		transition: background 0.2s;
	}
	.sign:hover {
		background: var(--paper);
	}
	.s-top {
		font-size: max(8px, 1.9cqw);
		color: var(--brand-dark);
	}
	.s-small {
		font-size: max(6px, 1.05cqw);
		font-weight: 700;
		line-height: 1.2;
	}
	.s-big {
		margin-top: 1cqw;
		font-size: max(11px, 3.1cqw);
		color: var(--brand);
	}
	.s-pill {
		margin-top: 1cqw;
		padding: 0.8cqw 1.2cqw;
		border-radius: 99px;
		background: var(--black);
		color: var(--cream);
		font-size: max(6px, 1cqw);
	}

	.khida span {
		color: var(--mustard);
	}
	.khida {
		position: absolute;
		left: 5cqw;
		top: 38cqw;
		margin: 0;
		color: var(--cream);
		text-align: left;
		font: 800 9.5cqw / 0.86 var(--display);
		text-transform: uppercase;
		font-stretch: 85%;
		rotate: -8deg;
		transform-origin: left top;
	}
	/* The loudest thing on the building: mustard pill, ringing phone, pulsing halo, blinking bulbs. */
	.bulbs {
		position: absolute;
		left: 7cqw;
		top: 76cqw;
		display: inline-flex;
		align-items: center;
		gap: max(10px, 1.6cqw);
		padding: max(10px, 1.6cqw) max(18px, 3.2cqw) max(10px, 1.6cqw) max(10px, 1.6cqw);
		border-radius: 999px;
		background: var(--mustard);
		color: var(--black);
		text-decoration: none;
		white-space: nowrap;
		rotate: -4deg;
		outline: max(3px, 0.45cqw) dotted var(--cream);
		outline-offset: max(5px, 0.7cqw);
		animation:
			lights 0.8s steps(2) infinite,
			halo 1.8s ease-out infinite;
		transition: scale 0.2s;
	}
	.bulbs:hover {
		scale: 1.06;
	}
	.ring {
		display: grid;
		place-items: center;
		width: max(36px, 6cqw);
		aspect-ratio: 1;
		border-radius: 50%;
		background: var(--black);
		color: var(--mustard);
		animation: ring 1.6s ease-in-out infinite;
	}
	.b-text {
		display: grid;
		font-size: max(1rem, 3.4cqw);
		line-height: 0.95;
	}
	.b-text small {
		margin-top: 4px;
		font-size: max(0.6875rem, 1.5cqw);
		letter-spacing: 0.06em;
	}
	@keyframes lights {
		50% {
			outline-color: var(--black);
		}
	}
	@keyframes halo {
		0% {
			box-shadow: 0 0 0 0 rgb(244 180 0 / 0.7);
		}
		100% {
			box-shadow: 0 0 0 max(18px, 3cqw) rgb(244 180 0 / 0);
		}
	}
	@keyframes ring {
		0%,
		60%,
		100% {
			rotate: 0deg;
		}
		10%,
		30%,
		50% {
			rotate: -16deg;
		}
		20%,
		40% {
			rotate: 16deg;
		}
	}
</style>

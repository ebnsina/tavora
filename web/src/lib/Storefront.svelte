<script lang="ts">
	type Sign = { open: boolean; line: string; label: string };
	let { name, sign }: { name: string; sign?: Sign | false | null } = $props();
	const stripes = Array.from({ length: 12 }, (_, i) => 118 + i * 34);
</script>

<!-- Hand-drawn shopfront: cream fill, ink outline, a smiling burger on the sign. -->
<svg class="store" viewBox="0 0 640 420" role="img" aria-label="{name} restaurant shopfront">
	<g class="line">
		<!-- clouds -->
		<path
			d="M20 150c4-14 22-16 28-6 6-12 26-10 28 4 10-2 16 8 10 14H22c-8-2-8-10-2-12z"
			class="nofill"
		/>
		<path
			d="M548 118c4-14 22-16 28-6 6-12 26-10 28 4 10-2 16 8 10 14h-64c-8-2-8-10-2-12z"
			class="nofill"
		/>

		<!-- sign -->
		<path d="M230 150v-24M410 150v-24" />
		<rect x="170" y="30" width="300" height="100" rx="6" transform="rotate(-3 320 80)" />
		<text x="320" y="102" transform="rotate(-3 320 80)">{name.toUpperCase()}</text>

		<!-- smiling burger -->
		<g class="burger">
			<path d="M398 22c0-24 22-38 44-38s44 14 44 38z" />
			<path d="M394 30h96" />
			<path d="M396 40c10 8 22-6 32 2s22-6 32 2 22-6 30 0" class="nofill" />
			<rect x="398" y="44" width="88" height="14" rx="7" />
			<circle cx="430" cy="6" r="3" class="dot" />
			<circle cx="454" cy="6" r="3" class="dot" />
			<path d="M432 14c6 6 14 6 20 0" class="nofill" />
		</g>

		<!-- parapet and walls -->
		<rect x="70" y="150" width="500" height="36" rx="3" />
		<rect x="92" y="186" width="456" height="210" />
		<path
			d="M100 168h40M170 160h50M300 172h60M420 162h40M500 170h50M110 330h30M500 300h30M110 220h24"
			class="thin"
		/>

		<!-- awning -->
		<path d="M100 200h440l-20 50H120z" />
		{#each stripes as x (x)}<path d="M{x} 200l-4 50" class="thin" />{/each}
		<path d="M120 250 {'a17 17 0 0 0 34 0 '.repeat(12)}" class="nofill" />

		<!-- windows and door -->
		<rect x="128" y="282" width="120" height="100" />
		<rect x="392" y="282" width="120" height="100" />
		<path d="M150 300l30-14M160 320l40-20M414 300l30-14M424 320l40-20" class="thin" />
		<rect x="284" y="276" width="72" height="120" />
		<circle cx="344" cy="340" r="4" class="dot" />

		<!-- open/closed sign hanging on the awning, over the door -->
		{#if sign}
			<g class="sign" class:closed={!sign.open} role="status" aria-label={sign.label}>
				<path d="M284 262v12M356 262v12" class="thin" />
				<rect x="262" y="272" width="116" height="40" rx="8" />
				<text class="big" x="320" y="294">{sign.open ? 'OPEN' : 'CLOSED'}</text>
				<text class="small" x="320" y="306">{sign.line.toUpperCase()}</text>
			</g>
		{/if}

		<!-- ground and bushes -->
		<path d="M30 396h580" />
		<path d="M60 396c-6-18 10-30 22-20 4-16 26-14 26 2 12-6 22 6 16 18" />
		<path d="M530 396c-6-18 10-30 22-20 4-16 26-14 26 2 12-6 22 6 16 18" />
	</g>
</svg>

<style>
	.store {
		width: min(640px, 100%);
		height: auto;
		overflow: visible;
	}
	.line * {
		fill: var(--cream);
		stroke: var(--black);
		stroke-width: 5;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.line .nofill {
		fill: none;
	}
	.line .thin {
		stroke-width: 3;
		fill: none;
	}
	.line .dot {
		fill: var(--black);
		stroke: none;
	}
	text {
		fill: var(--black) !important;
		stroke: none !important;
		font: 800 56px var(--display);
		font-stretch: 85%;
		text-anchor: middle;
	}
	.sign {
		transform-origin: 320px 262px;
		animation: swing 3s ease-in-out infinite;
	}
	.line .sign rect {
		fill: var(--brand);
	}
	.line .sign.closed rect {
		fill: var(--black);
	}
	.sign text {
		fill: var(--cream) !important;
		font-stretch: 100%;
	}
	.sign .big {
		font-size: 22px;
	}
	.sign .small {
		font: 700 10px var(--sans);
		letter-spacing: 0.04em;
	}
	@keyframes swing {
		0%,
		100% {
			rotate: -3deg;
		}
		50% {
			rotate: 3deg;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.sign {
			animation: none;
		}
	}
	.burger {
		transform-origin: 442px 58px;
		animation: wiggle 2.4s ease-in-out infinite;
	}
	@keyframes wiggle {
		0%,
		100% {
			rotate: -4deg;
		}
		50% {
			rotate: 4deg;
			translate: 0 -6px;
		}
	}
</style>

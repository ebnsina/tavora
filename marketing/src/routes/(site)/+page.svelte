<script lang="ts">
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		ArrowRight02Icon,
		CheckmarkCircle02Icon,
		DeliveryTruck01Icon,
		Invoice03Icon,
		MinusSignIcon,
		Notification03Icon,
		ArrowDown01Icon,
		SmartPhone01Icon,
		Tick02Icon,
		WhatsappIcon,
		WifiDisconnected01Icon
	} from '@hugeicons/core-free-icons';
	import Seo from '$lib/Seo.svelte';
	import Storefront from '$lib/Storefront.svelte';
	import { features, plans, promises, setup, yearlyMonths } from '$lib/pricing';
	import { site, taka } from '$lib/site';

	let yearly = $state(false);
	const perMonth = (m: number) => (yearly ? Math.round((m * yearlyMonths) / 12) : m);

	const local = [
		{ icon: DeliveryTruck01Icon, label: 'Cash on delivery' },
		{ icon: SmartPhone01Icon, label: 'bKash and Nagad' },
		{ icon: WifiDisconnected01Icon, label: 'Works offline' },
		{ icon: Invoice03Icon, label: 'Mushak-6.3 VAT bills' },
		{ icon: WhatsappIcon, label: 'WhatsApp orders' }
	];

	const faqs = [
		{
			q: 'Do you take a cut of my orders?',
			a: 'No. You pay a fixed monthly price; every taka from your orders is yours.'
		},
		{
			q: 'Do I need a payment gateway?',
			a: 'No. Online orders are cash on delivery or pickup. Card, bKash and Nagad payments at the till are recorded against your own machine or number.'
		},
		{
			q: 'What if the internet goes down?',
			a: 'The till keeps taking orders, sending to the kitchen, taking payment and printing. It catches up by itself when the connection is back.'
		},
		{
			q: 'What does the setup include?',
			a: `Your website in your colours, your full menu entered for you, the till set up on your tablets, and two hours of training for your team. It’s ${taka(setup)}, once.`
		},
		{
			q: 'Can I switch plans later?',
			a: 'Yes, up or down, from the next month. Nothing is lost when you switch.'
		}
	];
</script>

<Seo
	title="Website, dashboard and till for restaurants"
	description="Tavora gives restaurants in Bangladesh a website that takes orders, a dashboard, and a till that works offline. Cash on delivery, bKash, Nagad and VAT invoices built in."
	path="/"
/>

<!-- Hero: a dark inset panel, the real dashboard, and a few live-looking details around it. -->
<section class="wrap">
	<div class="hero">
		<div class="hero-copy">
			<span class="chip"><span class="dot"></span> Made for restaurants in Bangladesh</span>
			<h1>Run your whole restaurant from one screen</h1>
			<p>
				A website that takes orders, a dashboard for the day, and a till for the counter and
				kitchen. On the tablets you already have.
			</p>
			<div class="ctas">
				<a class="btn primary" href="#pricing"
					>Get started <HugeiconsIcon icon={ArrowRight02Icon} size={20} /></a
				>
				<a class="btn light" href={site.demo} target="_blank" rel="noopener">See the live demo</a>
			</div>
		</div>
		<div class="hero-art">
			<img
				class="screen"
				src="/shots/overview.webp"
				alt="The Tavora dashboard"
				width="1280"
				height="800"
			/>
			<div class="float f1">
				<span class="ic red"><HugeiconsIcon icon={Notification03Icon} size={16} /></span>
				<div><strong>New online order</strong><small>TV-1422 · ৳1,446</small></div>
			</div>
			<div class="float f2">
				<small>This week</small>
				<strong class="num">৳61,620</strong>
			</div>
			<div class="float f3">
				<span class="ic green"><HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} /></span>
				<strong>All saved</strong>
			</div>
		</div>
	</div>
	<ul class="local" aria-label="Built for Bangladesh">
		{#each local as l (l.label)}<li><HugeiconsIcon icon={l.icon} size={20} /> {l.label}</li>{/each}
	</ul>
</section>

<!-- Features as a bento grid: one big till tile, the rest in pairs. -->
<section id="features" class="wrap block">
	<div class="head">
		<span class="eyebrow">Features</span>
		<h2>Everything the day needs, nothing it doesn’t</h2>
	</div>
	<div class="bento">
		<article class="tile t-till">
			<div class="txt">
				<h3>A till for tables and takeaway</h3>
				<p>Tap dishes, add notes for the cook, send to the kitchen, split the bill.</p>
			</div>
			<img
				src="/shots/pos-ticket.webp"
				alt="Taking an order at the till"
				loading="lazy"
				width="1280"
				height="800"
			/>
		</article>

		<article class="tile t-offline">
			<h3>Keeps selling offline</h3>
			<p>When the internet drops, nothing stops. It catches up by itself.</p>
			<ul class="sync">
				<li>
					<span class="pill amber"
						><HugeiconsIcon icon={WifiDisconnected01Icon} size={16} /> No internet · 3 waiting</span
					>
				</li>
				<li>
					<span class="pill ok"><HugeiconsIcon icon={Tick02Icon} size={16} /> All saved</span>
				</li>
			</ul>
		</article>

		<article class="tile t-shot">
			<h3>Kitchen screen</h3>
			<p>Every ticket, with timers and the cook’s notes.</p>
			<img
				src="/shots/pos-kitchen.webp"
				alt="The kitchen screen"
				loading="lazy"
				width="1280"
				height="800"
			/>
		</article>

		<article class="tile">
			<h3>Every way to pay</h3>
			<p>Change worked out for you; transaction IDs kept.</p>
			<div class="pay">
				<span>Cash</span><span>Card</span><span>bKash</span><span>Nagad</span>
				<span class="muted">÷2</span><span class="muted">÷3</span><span class="muted">+ Tip</span>
			</div>
		</article>

		<article class="tile t-shot">
			<h3>Orders and bookings</h3>
			<p>New orders chime; one tap moves them along.</p>
			<img
				src="/shots/orders.webp"
				alt="Online orders in the dashboard"
				loading="lazy"
				width="1280"
				height="800"
			/>
		</article>

		<article class="tile t-drawer">
			<h3>End of day in one look</h3>
			<p>Cash that should be in the drawer</p>
			<strong class="num big">৳3,150</strong>
			<small>Card, bKash and Nagad · By staff · Voids · VAT</small>
		</article>

		<article class="tile">
			<h3>A PIN for every staff member</h3>
			<p>They see the till; you see who took what.</p>
			<div class="pin" aria-hidden="true">
				<i></i><i></i><i></i><i></i><i class="off"></i><i class="off"></i>
			</div>
		</article>

		<article class="tile t-receipt">
			<h3>VAT invoices</h3>
			<p>Add your BIN; bills print as Mushak-6.3.</p>
			<div class="receipt mono" aria-hidden="true">
				<b>VAT INVOICE (MUSHAK-6.3)</b>
				<span><em>Subtotal</em><em>৳1,320</em></span>
				<span><em>VAT 5%</em><em>৳66</em></span>
				<span class="tot"><em>TOTAL</em><em>৳1,446</em></span>
			</div>
		</article>
	</div>
</section>

<section id="pricing" class="wrap block">
	<div class="head center">
		<span class="eyebrow">Pricing</span>
		<h2>Simple prices. No commission.</h2>
		<p>One fixed price a month. Every taka from your orders stays yours.</p>
		<div class="toggle" role="radiogroup" aria-label="Billing">
			<button type="button" role="radio" aria-checked={!yearly} onclick={() => (yearly = false)}
				>Monthly</button
			>
			<button type="button" role="radio" aria-checked={yearly} onclick={() => (yearly = true)}>
				Yearly <span class="save">2 months free</span>
			</button>
		</div>
	</div>

	<div class="plans">
		{#each plans as p (p.name)}
			<article class="plan" class:featured={p.featured}>
				<header>
					<div>
						<h3>{p.name}</h3>
						<p>{p.for}</p>
					</div>
					{#if p.featured}<span class="badge">Most popular</span>{/if}
				</header>
				<div class="inner">
					<p class="price"><span class="num">{taka(perMonth(p.monthly))}</span> / month</p>
					<p class="bill">
						{yearly ? `${taka(p.monthly * yearlyMonths)} billed yearly` : 'Billed monthly'}
					</p>
					<ul>
						{#each features as f, i (f)}
							<li class:no={i >= p.upTo}>
								<HugeiconsIcon icon={i < p.upTo ? Tick02Icon : MinusSignIcon} size={16} />
								{f}
							</li>
						{/each}
					</ul>
					<a
						class="btn"
						class:primary={p.featured}
						class:ghost={!p.featured}
						href={site.whatsapp}
						target="_blank"
						rel="noopener">{p.cta}</a
					>
				</div>
			</article>
		{/each}
	</div>
	<p class="setup">
		Every plan starts with a one-time setup of <strong class="num">{taka(setup)}</strong>: design,
		menu entry, tablets and training.
	</p>
	<ul class="promises">
		{#each promises as p (p)}<li><HugeiconsIcon icon={Tick02Icon} size={16} /> {p}</li>{/each}
	</ul>
</section>

<section class="wrap block faq">
	<div>
		<span class="eyebrow">Questions</span>
		<h2>Good to know</h2>
		<p class="ask">
			Something else? <a href={site.whatsapp} target="_blank" rel="noopener">Ask us on WhatsApp</a>.
		</p>
	</div>
	<div class="qs">
		{#each faqs as f (f.q)}
			<details>
				<summary
					>{f.q}<span class="plus"><HugeiconsIcon icon={ArrowDown01Icon} size={16} /></span></summary
				>
				<p>{f.a}</p>
			</details>
		{/each}
	</div>
</section>

<section class="wrap block">
	<div class="cta">
		<div>
			<h2>Open your doors online</h2>
			<p>
				Tell us about your restaurant. We reply on WhatsApp and can have you running within a week.
			</p>
			<a class="btn light" href={site.whatsapp} target="_blank" rel="noopener"
				><HugeiconsIcon icon={WhatsappIcon} size={20} /> Message us</a
			>
		</div>
		<div class="cta-art" aria-hidden="true">
			<Storefront name="Tavora" sign={{ open: true, line: 'come in', label: 'Open' }} />
		</div>
	</div>
</section>

<style>
	.mono {
		font-family: var(--mono);
	}
	.num {
		font-variant-numeric: tabular-nums;
		letter-spacing: -0.03em;
	}

	/* Hero */
	.hero {
		display: grid;
		grid-template-columns: 1fr 1.15fr;
		align-items: center;
		gap: var(--s7);
		margin-top: var(--s5);
		padding: var(--s8) 0 var(--s8) var(--s8);
		overflow: hidden;
		border-radius: 28px;
		background:
			radial-gradient(120% 90% at 100% 0%, rgb(213 22 26 / 0.35), transparent 55%), var(--ink);
		color: #fff;
	}
	.chip {
		display: inline-flex;
		align-items: center;
		gap: var(--s2);
		padding: 6px 12px;
		border-radius: 999px;
		background: rgb(255 255 255 / 0.08);
		box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.14);
		font-size: var(--t-xs);
		font-weight: 500;
	}
	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #34c77b;
		box-shadow: 0 0 0 3px rgb(52 199 123 / 0.25);
	}
	h1 {
		margin-top: var(--s5);
		font-size: clamp(2.5rem, 4.8vw, 3.75rem);
	}
	.hero-copy > p {
		max-width: 30em;
		margin-top: var(--s5);
		color: rgb(255 255 255 / 0.72);
		font-size: var(--t-lg);
	}
	.ctas {
		display: flex;
		flex-wrap: wrap;
		gap: var(--s3);
		margin-top: var(--s6);
	}
	.btn.light {
		background: #fff;
		color: var(--ink);
	}
	.btn.light:hover {
		background: var(--soft);
	}
	.hero-art {
		position: relative;
		padding: var(--s5) 0;
	}
	.screen {
		width: 100%;
		border-radius: 14px 0 0 14px;
		box-shadow:
			0 0 0 1px rgb(255 255 255 / 0.1),
			0 30px 60px -20px rgb(0 0 0 / 0.6);
	}
	.float {
		position: absolute;
		display: flex;
		align-items: center;
		gap: var(--s3);
		padding: var(--s3) var(--s4);
		border-radius: 12px;
		background: #fff;
		color: var(--ink);
		box-shadow: 0 18px 40px -12px rgb(0 0 0 / 0.45);
		font-size: var(--t-sm);
	}
	.float div,
	.f2 {
		display: grid;
		line-height: 1.3;
	}
	.float small {
		color: var(--muted);
		font-size: var(--t-xs);
	}
	.f1 {
		top: 0;
		left: -32px;
	}
	.f2 {
		bottom: 0;
		left: 12%;
		gap: 2px;
	}
	.f2 strong {
		font-size: var(--t-xl);
	}
	.f3 {
		top: 38%;
		right: 24px;
		padding: var(--s2) var(--s3);
	}
	.ic {
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		border-radius: 9px;
	}
	.ic.red {
		background: var(--brand-soft);
		color: var(--brand);
	}
	.ic.green {
		width: 24px;
		height: 24px;
		background: #e3f6ec;
		color: #1f8a53;
	}
	.local {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: var(--s3) var(--s6);
		margin: var(--s6) 0 0;
		padding: 0;
		list-style: none;
		color: var(--muted);
		font-size: var(--t-sm);
		font-weight: 500;
	}
	.local li {
		display: flex;
		align-items: center;
		gap: var(--s2);
	}
	.local :global(svg) {
		color: var(--brand);
	}

	/* Sections */
	.block {
		padding-top: var(--s9);
	}
	.head {
		max-width: 40em;
		margin-bottom: var(--s7);
	}
	.head.center {
		margin-inline: auto;
		text-align: center;
	}
	h2 {
		font-size: var(--t-2xl);
	}
	.head p {
		margin-top: var(--s3);
		color: var(--muted);
		font-size: var(--t-lg);
	}

	/* Bento */
	.bento {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: var(--s4);
	}
	.tile {
		grid-column: span 2;
		display: flex;
		flex-direction: column;
		min-height: 260px;
		padding: var(--s5);
		overflow: hidden;
		border-radius: 20px;
		background: var(--surface);
		box-shadow: 0 0 0 1px var(--line);
	}
	.tile h3 {
		font-size: var(--t-lg);
		letter-spacing: -0.01em;
	}
	.tile p {
		margin-top: var(--s2);
		color: var(--muted);
		font-size: var(--t-sm);
	}
	.t-shot p {
		margin-bottom: var(--s5);
	}
	/* Screenshot bleeds off the tile's bottom-right edge. */
	.t-shot > img {
		width: calc(100% + var(--s5));
		margin: auto calc(-1 * var(--s5)) calc(-1 * var(--s5)) 0;
		aspect-ratio: 16 / 10;
		object-fit: cover;
		object-position: left top;
		border-radius: 10px 0 0 0;
		box-shadow: 0 0 0 1px var(--line);
	}
	.t-till {
		grid-column: span 4;
		display: grid;
		grid-template-columns: 0.8fr 1.4fr;
		gap: var(--s5);
		padding-right: 0;
		padding-bottom: 0;
	}
	.t-till .txt {
		padding-bottom: var(--s5);
	}
	.t-till img {
		align-self: end;
		width: 100%;
		border-radius: 12px 0 0 0;
		box-shadow: 0 0 0 1px var(--line);
	}
	.t-offline {
		background: var(--ink);
		color: #fff;
		box-shadow: none;
	}
	.t-offline p {
		color: rgb(255 255 255 / 0.65);
	}
	.sync {
		display: grid;
		justify-items: start;
		gap: var(--s2);
		margin: auto 0 0;
		padding: 0;
		list-style: none;
	}
	.pill {
		display: inline-flex;
		align-items: center;
		gap: var(--s2);
		padding: 8px 14px;
		border-radius: 999px;
		font-size: var(--t-sm);
		font-weight: 600;
	}
	.pill.amber {
		background: var(--mustard);
		color: var(--ink);
	}
	.pill.ok {
		background: rgb(255 255 255 / 0.1);
		color: #fff;
	}
	.pay {
		display: flex;
		flex-wrap: wrap;
		gap: var(--s2);
		margin-top: auto;
	}
	.pay span {
		padding: 10px 14px;
		border-radius: 10px;
		background: var(--ink);
		color: #fff;
		font-size: var(--t-sm);
		font-weight: 600;
	}
	.pay span:first-child {
		background: var(--brand);
	}
	.pay .muted {
		background: var(--soft);
		color: var(--ink);
		font-family: var(--mono);
	}
	.t-drawer {
		background: var(--brand-soft);
		box-shadow: none;
	}
	.t-drawer p {
		margin-top: auto;
		color: var(--ink);
	}
	.big {
		font-size: 3rem;
		line-height: 1.1;
	}
	.t-drawer small {
		margin-top: var(--s2);
		color: var(--muted);
		font-size: var(--t-xs);
	}
	.pin {
		display: flex;
		gap: var(--s3);
		margin-top: auto;
	}
	.pin i {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--ink);
	}
	.pin .off {
		background: none;
		box-shadow: inset 0 0 0 2px var(--line);
	}
	.receipt {
		display: grid;
		gap: 4px;
		margin-top: auto;
		padding: var(--s4);
		border-radius: 10px;
		background: var(--bg);
		box-shadow: inset 0 0 0 1px var(--line);
		font-size: var(--t-xs);
	}
	.receipt b {
		margin-bottom: 6px;
		font-weight: 600;
	}
	.receipt span {
		display: flex;
		justify-content: space-between;
	}
	.receipt em {
		font-style: normal;
	}
	.receipt .tot {
		margin-top: 4px;
		padding-top: 6px;
		border-top: 1px dashed var(--faint);
		font-weight: 700;
	}

	/* Pricing */
	.toggle {
		display: inline-flex;
		gap: 4px;
		margin-top: var(--s5);
		padding: 4px;
		border-radius: 999px;
		background: var(--soft);
	}
	.toggle button {
		display: inline-flex;
		align-items: center;
		gap: var(--s2);
		height: 36px;
		padding: 0 var(--s4);
		border: 0;
		border-radius: 999px;
		background: none;
		color: var(--muted);
		font: 600 var(--t-sm) var(--sans);
		cursor: pointer;
	}
	.toggle [aria-checked='true'] {
		background: #fff;
		color: var(--ink);
		box-shadow: 0 1px 3px rgb(0 0 0 / 0.12);
	}
	.save {
		padding: 2px 8px;
		border-radius: 999px;
		background: #e3f6ec;
		color: #1f8a53;
		font-size: var(--t-xs);
	}
	.plans {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		align-items: stretch;
		gap: var(--s4);
	}
	.plan {
		display: flex;
		flex-direction: column;
		padding: 6px;
		border-radius: 22px;
		background: var(--soft);
	}
	.plan header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--s3);
		padding: var(--s4) var(--s4) var(--s5);
	}
	.plan h3 {
		font-size: var(--t-lg);
		letter-spacing: -0.01em;
	}
	.plan header p {
		margin-top: 2px;
		color: var(--muted);
		font-size: var(--t-sm);
	}
	.badge {
		flex: none;
		padding: 4px 10px;
		border-radius: 999px;
		background: var(--mustard);
		color: var(--ink);
		font-size: var(--t-xs);
		font-weight: 600;
	}
	.inner {
		display: flex;
		flex: 1;
		flex-direction: column;
		padding: var(--s5);
		border-radius: 17px;
		background: #fff;
		color: var(--ink);
		box-shadow: 0 0 0 1px var(--line);
	}
	.price {
		color: var(--muted);
	}
	.price .num {
		color: var(--ink);
		font-size: 2.5rem;
		font-weight: 600;
	}
	.bill {
		color: var(--faint);
		font-size: var(--t-xs);
	}
	.inner ul {
		display: grid;
		gap: 10px;
		margin: var(--s5) 0 var(--s6);
		padding: var(--s5) 0 0;
		border-top: 1px solid var(--line);
		list-style: none;
		font-size: var(--t-sm);
	}
	.inner li {
		display: flex;
		align-items: center;
		gap: var(--s2);
	}
	.inner li :global(svg) {
		flex: none;
		color: var(--brand);
	}
	.inner li.no {
		color: var(--faint);
	}
	.inner li.no :global(svg) {
		color: var(--line);
	}
	.inner .btn {
		margin-top: auto;
	}
	.plan.featured {
		background: var(--ink);
		color: #fff;
	}
	.plan.featured header p {
		color: rgb(255 255 255 / 0.6);
	}
	.setup {
		margin-top: var(--s6);
		color: var(--muted);
		text-align: center;
	}
	.setup strong {
		color: var(--ink);
	}
	.promises {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: var(--s2) var(--s5);
		margin: var(--s4) 0 0;
		padding: 0;
		list-style: none;
		color: var(--muted);
		font-size: var(--t-sm);
	}
	.promises li {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.promises :global(svg) {
		color: #1f8a53;
	}

	/* FAQ */
	.faq {
		display: grid;
		grid-template-columns: 1fr 1.6fr;
		gap: var(--s7);
	}
	.ask {
		margin-top: var(--s4);
		color: var(--muted);
	}
	.ask a {
		color: var(--brand);
		font-weight: 600;
	}
	.qs {
		display: grid;
		gap: var(--s3);
	}
	details {
		padding: var(--s4) var(--s5);
		border-radius: 14px;
		background: #fff;
		box-shadow: 0 0 0 1px var(--line);
	}
	summary {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--s4);
		font-weight: 600;
		list-style: none;
		cursor: pointer;
	}
	summary::-webkit-details-marker {
		display: none;
	}
	.plus {
		display: grid;
		flex: none;
		place-items: center;
		width: 28px;
		height: 28px;
		border-radius: 8px;
		background: var(--soft);
	}
	.plus :global(svg) {
		transition: rotate 0.3s ease;
	}
	details[open] .plus :global(svg) {
		rotate: 180deg;
	}
	/* Smooth open and close where the browser supports animating details content. */
	details {
		interpolate-size: allow-keywords;
	}
	details::details-content {
		height: 0;
		overflow: clip;
		opacity: 0;
		transition:
			height 0.3s ease,
			opacity 0.3s ease,
			content-visibility 0.3s allow-discrete;
	}
	details[open]::details-content {
		height: auto;
		opacity: 1;
	}
	@media (prefers-reduced-motion: reduce) {
		details::details-content,
		.plus :global(svg) {
			transition: none;
		}
	}
	details p {
		margin-top: var(--s3);
		color: var(--muted);
	}

	/* Closing panel */
	.cta {
		display: grid;
		grid-template-columns: 1fr 0.8fr;
		align-items: center;
		gap: var(--s6);
		padding: var(--s8);
		overflow: hidden;
		border-radius: 28px;
		background: var(--brand);
		color: #fff;
	}
	.cta p {
		max-width: 26em;
		margin: var(--s4) 0 var(--s6);
		color: rgb(255 255 255 / 0.85);
		font-size: var(--t-lg);
	}
	.cta-art {
		margin-bottom: calc(-1 * var(--s8));
	}

	@media (max-width: 1000px) {
		.hero {
			grid-template-columns: 1fr;
			padding: var(--s7) 0 0 var(--s6);
		}
		.hero-copy {
			padding-right: var(--s6);
		}
		.f1 {
			left: -12px;
		}
		.bento {
			grid-template-columns: 1fr 1fr;
		}
		.tile {
			grid-column: span 1;
		}
		.t-till {
			grid-column: span 2;
		}
		.plans {
			grid-template-columns: 1fr;
			max-width: 480px;
			margin-inline: auto;
		}
		.faq,
		.cta {
			grid-template-columns: 1fr;
		}
	}
	@media (max-width: 640px) {
		.hero {
			padding: var(--s6) 0 0 var(--s5);
			border-radius: 20px;
		}
		.hero-copy {
			padding-right: var(--s5);
		}
		.f2,
		.f3 {
			display: none;
		}
		.bento {
			grid-template-columns: 1fr;
		}
		.tile,
		.t-till {
			grid-column: span 1;
			min-height: 0;
		}
		.t-till {
			grid-template-columns: 1fr;
		}
		.tile .pay,
		.tile .pin,
		.tile .receipt,
		.tile .sync {
			margin-top: var(--s5);
		}
		.cta {
			padding: var(--s6);
		}
	}
</style>

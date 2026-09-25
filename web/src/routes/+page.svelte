<script lang="ts">
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		Calendar03Icon,
		Call02Icon,
		ChickenThighsIcon,
		DrinkIcon,
		Facebook01Icon,
		FireIcon,
		FrenchFries01Icon,
		Hamburger01Icon,
		InstagramIcon,
		Leaf01Icon,
		Mail01Icon,
		RiceBowl01Icon,
		SandwichIcon,
		ShoppingBag01Icon,
		SoupIcon,
		StarIcon
	} from '@hugeicons/core-free-icons';
	import { onMount } from 'svelte';
	import AddButton from '$lib/AddButton.svelte';
	import Booking from '$lib/Booking.svelte';
	import Building from '$lib/Building.svelte';
	import Cart from '$lib/Cart.svelte';
	import Storefront from '$lib/Storefront.svelte';
	import { groupHours, openState, price, time, type Tag } from '$lib/api';
	import { cart, clock, count, subtotal, load, save } from '$lib/order.svelte';
	import { site } from '$lib/site';

	let { data } = $props();
	const r = $derived(data.restaurant);
	const menu = $derived(data.menu);
	const all = $derived(menu.flatMap((c) => c.items));
	const items = $derived(new Map(all.map((i) => [i.id, i])));
	const loved = $derived(all.filter((i) => i.tags.includes('popular') && i.image));
	const hours = $derived(groupHours(r.hours));
	const n = $derived(count());

	onMount(() => {
		load(items);
		clock.now = new Date();
		const t = setInterval(() => (clock.now = new Date()), 60_000);
		return () => clearInterval(t);
	});
	const status = $derived(clock.now && openState(r.hours, clock.now));
	$effect(save);

	const tags: Record<Tag, { label: string; icon: typeof StarIcon }> = {
		popular: { label: 'Most loved', icon: StarIcon },
		spicy: { label: 'Spicy', icon: FireIcon },
		veg: { label: 'Vegetarian', icon: Leaf01Icon }
	};
	const ticker = [
		{ label: 'Burger', icon: Hamburger01Icon },
		{ label: 'Kacchi', icon: RiceBowl01Icon },
		{ label: 'Bhuna', icon: SoupIcon },
		{ label: 'Fried chicken', icon: ChickenThighsIcon },
		{ label: 'Shawarma', icon: SandwichIcon },
		{ label: 'Fries', icon: FrenchFries01Icon },
		{ label: 'Borhani', icon: DrinkIcon }
	];
	const doodles = [
		Hamburger01Icon,
		RiceBowl01Icon,
		ChickenThighsIcon,
		FrenchFries01Icon,
		DrinkIcon,
		SandwichIcon,
		SoupIcon,
		Hamburger01Icon
	];
	const slogans = [
		{ text: 'Slow-cooked, fast-served.', tone: 'red' },
		{ text: 'Big plates. Bigger smiles.', tone: 'black' }
	];
	const tilt = [-3, 2, -2, 3];
	const rings = [230, 186, 142];

	const ld = $derived(
		JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'Restaurant',
			name: r.name,
			description: site.description,
			url: site.url,
			image: `${site.url}${site.heroImage}`,
			telephone: r.phone,
			email: r.email,
			address: r.address,
			servesCuisine: ['Fast food', 'Bangladeshi'],
			hasMenu: `${site.url}/#menu`,
			acceptsReservations: true
		}).replace(/</g, '\\u003c')
	);
</script>

<svelte:head>
	<title>{r.name} · {site.tagline}</title>
	<meta name="description" content={site.description} />
	<link rel="canonical" href={site.url} />
	<meta property="og:type" content="restaurant" />
	<meta property="og:site_name" content={r.name} />
	<meta property="og:title" content="{r.name} · {site.tagline}" />
	<meta property="og:description" content={site.description} />
	<meta property="og:url" content={site.url} />
	<meta property="og:image" content="{site.url}{site.heroImage}" />
	<meta name="twitter:card" content="summary_large_image" />
	{@html `<script type="application/ld+json">${ld}</script>`}
</svelte:head>

<a class="skip" href="#menu">Skip to menu</a>

<header class="top">
	<nav class="bar-nav wrap" aria-label="Main">
		<a class="logo" href="/">{r.name}</a>
		<div class="links">
			<a href="#menu">Menu</a>
			<a href="#book">Book a table</a>
			<a href="#visit">Find us</a>
		</div>
		<button class="order-btn" type="button" onclick={() => (cart.open = true)}>
			<HugeiconsIcon icon={ShoppingBag01Icon} size={18} />
			<span>Your order</span>
			{#if n}{#key n}<span class="badge">{n}</span>{/key}{/if}
		</button>
	</nav>
</header>

<main>
	<!-- 1. Hero: poster wordmark over the shopfront, red dripping into cream -->
	<section class="hero">
		<div class="wrap hero-in">
			<h1 class="enter" style="--d: 0.06s">{r.name}</h1>
			<p class="sub poster enter" style="--d: 0.12s">{site.tagline}</p>
			{#if status}
				<p class="status" class:closed={!status.open}>
					<span class="dot" aria-hidden="true"></span>
					{status.open
						? `Open now · until ${time(status.closes)}`
						: status.when
							? `Closed now · opens ${status.when} at ${time(status.at)}`
							: 'Closed today'}
				</p>
			{/if}
			<div class="store enter" style="--d: 0.2s">
				<Storefront name={r.name} />
				<a class="btn primary find" href="#menu">Order now</a>
			</div>
		</div>
	</section>
	<div class="drips" aria-hidden="true"></div>

	<!-- 2. Giant scrolling line -->
	<div class="crave marquee" aria-hidden="true" style="--speed: 38s">
		{#each [0, 1] as i (i)}
			<span class="poster"
				>Smash burgers · Crispy chicken · Loaded fries · Handi kacchi ·&nbsp;</span
			>
		{/each}
	</div>

	<!-- 3. Card rail: most-loved dishes with slogan cards in between -->
	<section aria-labelledby="loved-title">
		<h2 id="loved-title" class="sr">Most loved dishes</h2>
		<ul class="rail">
			{#each loved as item, i (item.id)}
				{#if i === 1 || i === 4}
					{@const s = slogans[i === 1 ? 0 : 1]}
					<li class="slogan {s.tone}" aria-hidden="true">
						<p class="poster">{s.text}</p>
						<span class="stamp-name poster">{r.name}</span>
					</li>
				{/if}
				<li class="dish">
					<img src={item.image} alt={item.name} width="800" height="600" loading="lazy" />
					<div class="dish-info">
						<strong class="poster">{item.name}</strong>
						<span class="price">{price(item.price)}</span>
					</div>
					<div class="dish-add"><AddButton {item} /></div>
				</li>
			{/each}
		</ul>
	</section>

	<!-- 4. Spinning rings of the name, with stickers -->
	<section class="spin-wrap" aria-labelledby="story-title">
		<div class="spin" aria-hidden="true">
			<svg viewBox="0 0 500 500">
				<defs>
					{#each rings as rad (rad)}
						<path
							id="ring{rad}"
							d="M250 {250 - rad}a{rad} {rad} 0 1 1 0 {2 * rad}a{rad} {rad} 0 1 1 0 {-2 * rad}"
						/>
					{/each}
					<clipPath id="plate"><circle cx="250" cy="250" r="96" /></clipPath>
				</defs>
				{#each rings as rad, i (rad)}
					<g
						class="ring"
						style="--t: {40 + i * 12}s; animation-direction: {i % 2 ? 'reverse' : 'normal'}"
					>
						<text style="font-size: {50 - i * 8}px">
							<textPath
								href="#ring{rad}"
								textLength={2 * Math.PI * rad - 2}
								lengthAdjust="spacingAndGlyphs"
							>
								{r.name.toUpperCase().repeat(7 - i)}
							</textPath>
						</text>
					</g>
				{/each}
				<image
					href="/img/kacchi.jpg"
					x="154"
					y="154"
					width="192"
					height="192"
					preserveAspectRatio="xMidYMid slice"
					clip-path="url(#plate)"
				/>
			</svg>
			<span class="sticker s1 poster">Kacchiii!</span>
			<span class="sticker s2 poster">Borhaniii</span>
			<span class="sticker s3 poster">Extra jhal!</span>
		</div>
		<div class="story">
			<h2 id="story-title" class="poster">Nothing on the menu is rushed</h2>
			{#each site.story as p (p)}<p>{p}</p>{/each}
		</div>
	</section>

	<!-- 5. Menu -->
	<section id="menu" class="menu" aria-labelledby="menu-title">
		<div class="wrap">
			<h2 id="menu-title" class="section-title">The menu</h2>
			<p class="menu-sub">
				Tap <strong>+</strong> on anything you fancy. Cash on delivery, always.
			</p>
			<ul class="legend" aria-label="What the icons mean">
				{#each Object.entries(tags) as [key, t] (key)}
					<li class="tag {key}"><HugeiconsIcon icon={t.icon} size={16} />{t.label}</li>
				{/each}
			</ul>
		</div>
		<nav class="cats" aria-label="Menu categories">
			<div class="wrap">
				{#each menu as c (c.slug)}<a href="#{c.slug}">{c.name}</a>{/each}
			</div>
		</nav>
		<div class="wrap courses">
			{#each menu as c, ci (c.slug)}
				<div id={c.slug} class="course">
					<h3 class="label" style="rotate: {ci % 2 ? 2 : -2}deg">{c.name}</h3>
					<ul>
						{#each c.items as item (item.id)}
							<li class:gone={!item.available}>
								<div class="line">
									<span class="name">
										{item.name}
										{#each item.tags as t (t)}
											<span class="tag {t}" title={tags[t].label}>
												<HugeiconsIcon icon={tags[t].icon} size={14} />
												<span class="sr">{tags[t].label}</span>
											</span>
										{/each}
									</span>
									<span class="leader" aria-hidden="true"></span>
									<span class="price">{price(item.price)}</span>
								</div>
								<p>{item.description}</p>
								<div class="add"><AddButton {item} compact /></div>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>
	</section>

	<!-- 6. Red zig-zag banner holding the booking card -->
	<section id="book" class="adventure" aria-labelledby="book-title">
		<div class="doodles" aria-hidden="true">
			{#each doodles as icon, i (i)}
				<span style="--x: {(i * 13 + 4) % 96}%; --y: {(i * 37) % 80}%; rotate: {i * 23}deg">
					<HugeiconsIcon {icon} size={56} />
				</span>
			{/each}
		</div>
		<div class="wrap adv-in">
			<h2 id="book-title" class="section-title">Bring the whole gang</h2>
			<p class="adv-sub poster">Save a seat. Fill in the blanks and we'll hold your table.</p>
			<div class="book-card"><Booking restaurant={r} /></div>
		</div>
	</section>

	<!-- 7. Round food stickers over a big scrolling line -->
	<section class="collage" aria-labelledby="tawa-title">
		<h2 id="tawa-title" class="sr">Fresh off the tawa</h2>
		<div class="tawa marquee" aria-hidden="true" style="--speed: 28s">
			{#each [0, 1] as k (k)}<span class="poster"
					>Fresh off the tawa ✦ Fresh off the tawa ✦&nbsp;</span
				>{/each}
		</div>
		<ul class="cuts">
			{#each loved.slice(-3) as item, i (item.id)}
				<li style="--r: {[-8, 5, -4][i]}deg; --d: {i * -1.4}s">
					<img src={item.image} alt={item.name} width="800" height="600" loading="lazy" />
					<span class="tag-price poster">{item.name} · {price(item.price)}</span>
				</li>
			{/each}
		</ul>
	</section>

	<!-- 8. Reviews on receipt slips -->
	<section class="reviews" aria-labelledby="reviews-title">
		<div class="wrap reviews-head">
			<h2 id="reviews-title" class="section-title">What our<br />regulars say</h2>
		</div>
		<div class="slips marquee" style="--speed: 50s">
			{#each [0, 1] as k (k)}
				<ul aria-hidden={k === 1}>
					{#each site.reviews as rv, i (i)}
						<li class="slip" class:dark={i % 2 === 1} style="--r: {tilt[i]}deg">
							<span class="stars" aria-label="5 stars">★★★★★</span>
							<p class="poster">{rv.text}</p>
							<span class="by">{rv.by}</span>
						</li>
					{/each}
				</ul>
			{/each}
		</div>
	</section>

	<!-- 9. Crossing ticker bands -->
	<div class="bands" aria-hidden="true">
		{#each ['red', 'black'] as tone (tone)}
			<div class="band {tone} marquee" style="--speed: {tone === 'red' ? 26 : 22}s">
				{#each [0, 1] as k (k)}
					<span>
						{#each ticker as t (t.label)}<b>{t.label}</b><HugeiconsIcon
								icon={t.icon}
								size={26}
							/>{/each}
					</span>
				{/each}
			</div>
		{/each}
	</div>

	<!-- 10. Call-to-order tower -->
	<section class="call" aria-labelledby="call-title">
		<p class="poster small-top">Too hungry to scroll?</p>
		<h2 id="call-title" class="poster fuel">Dinner is one call away</h2>
		<Building phone={r.phone} freeOver={price(r.delivery.free_over)} />
	</section>
</main>

<!-- 11. Footer: black drips rising into the tower, compact links, giant bleeding wordmark -->
<footer id="visit">
	<div class="drip-up" aria-hidden="true"></div>
	<div class="wrap foot-grid">
		<nav class="foot-links" aria-label="Footer">
			<h3>Explore</h3>
			<a href="#menu">Menu</a>
			<a href="#book">Book a table</a>
			<button class="linkish" type="button" onclick={() => (cart.open = true)}>Your order</button>
			<a href="https://wa.me/{r.whatsapp}" target="_blank" rel="noopener">WhatsApp</a>
		</nav>
		<div>
			<h3>Hours</h3>
			{#each hours as h (h.days)}
				<p>{h.days}<br /><strong>{time(h.opens)} – {time(h.closes)}</strong></p>
			{/each}
		</div>
		<div class="contact">
			<h3>Contact</h3>
			<p>{r.address}</p>
			<p>
				<a href="tel:{r.phone}">{r.phone}</a><br />
				<a href="mailto:{r.email}">{r.email}</a><br />
				<a
					href="https://maps.google.com/?q={encodeURIComponent(r.address)}"
					target="_blank"
					rel="noopener">Get directions →</a
				>
			</p>
			<span class="social">
				<a href={site.facebook} target="_blank" rel="noopener" aria-label="Facebook"
					><HugeiconsIcon icon={Facebook01Icon} size={20} /></a
				>
				<a href={site.instagram} target="_blank" rel="noopener" aria-label="Instagram"
					><HugeiconsIcon icon={InstagramIcon} size={20} /></a
				>
				<a href="mailto:{r.email}" aria-label="Email"
					><HugeiconsIcon icon={Mail01Icon} size={20} /></a
				>
			</span>
			<p class="copy">© {new Date().getFullYear()} {r.name} · {r.area}</p>
		</div>
	</div>
	<svg class="giant" viewBox="0 0 1000 200" aria-hidden="true">
		<text x="0" y="262" textLength="1000" lengthAdjust="spacingAndGlyphs"
			>{r.name.toUpperCase()}</text
		>
	</svg>
</footer>

{#if n}
	<button class="mbar cartbar" type="button" onclick={() => (cart.open = true)}>
		{#key n}<span class="badge">{n}</span>{/key}
		<span>View your order</span>
		<strong>{price(subtotal(items))}</strong>
	</button>
{:else}
	<nav class="mbar" aria-label="Quick actions">
		<a href="tel:{r.phone}"><HugeiconsIcon icon={Call02Icon} size={22} />Call</a>
		<a class="main" href="#menu"><HugeiconsIcon icon={ShoppingBag01Icon} size={22} />Order now</a>
		<a href="#book"><HugeiconsIcon icon={Calendar03Icon} size={22} />Book</a>
	</nav>
{/if}

<Cart restaurant={r} {items} />

<style>
	.skip {
		position: absolute;
		left: -999px;
	}
	.skip:focus {
		left: 16px;
		top: 16px;
		z-index: 20;
		background: var(--cream);
		padding: 8px 12px;
	}
	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
	}

	/* Black navbar floating over the page. */
	.top {
		position: sticky;
		top: 0;
		z-index: 10;
		height: 0;
	}
	.bar-nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		height: 72px;
		translate: 0 12px;
		padding: 0 14px 0 24px;
		background: var(--black);
		border-radius: 16px;
	}
	.logo {
		font: 800 1.75rem var(--display);
		font-stretch: 85%;
		text-transform: uppercase;
		text-decoration: none;
		color: var(--brand);
		-webkit-text-stroke: 5px var(--cream);
		paint-order: stroke fill;
	}
	.links {
		display: flex;
		gap: 32px;
	}
	.links a {
		color: var(--cream);
		text-decoration: none;
		font-weight: 700;
		font-stretch: 85%;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.links a:hover {
		color: var(--brand);
	}
	.order-btn {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 8px;
		height: 44px;
		padding: 0 18px;
		border: 0;
		border-radius: 10px;
		background: var(--cream);
		color: var(--brand);
		font: 800 1rem var(--display);
		font-stretch: 85%;
		text-transform: uppercase;
		cursor: pointer;
	}
	.order-btn .badge {
		position: absolute;
		top: -8px;
		right: -8px;
	}
	.badge {
		display: grid;
		place-items: center;
		min-width: 24px;
		height: 24px;
		padding: 0 6px;
		border-radius: 99px;
		background: var(--brand);
		color: var(--cream);
		font-size: 0.8125rem;
		font-weight: 800;
		animation: bump 0.35s cubic-bezier(0.3, 1.6, 0.5, 1);
	}
	@keyframes bump {
		from {
			scale: 0.4;
		}
	}

	/* 1. Hero */
	.hero {
		background: var(--brand);
		color: var(--cream);
		padding-top: 140px;
		overflow: hidden;
	}
	.hero-in {
		display: grid;
		justify-items: center;
		text-align: center;
	}
	h1 {
		font-size: clamp(5rem, 19vw, 15rem);
		line-height: 0.85;
		letter-spacing: -0.02em;
	}
	.sub {
		margin-top: 18px;
		font-size: clamp(1.125rem, 2.4vw, 1.75rem);
	}
	.status {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		margin: 16px 0 0;
		padding: 6px 14px;
		border-radius: 999px;
		background: var(--cream);
		color: var(--black);
		font: 700 0.9375rem var(--sans);
		animation: enter 0.5s both;
	}
	.dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: var(--green);
		box-shadow: 0 0 0 3px rgb(46 139 87 / 0.25);
	}
	.status.closed .dot {
		background: var(--brand);
		box-shadow: 0 0 0 3px rgb(213 22 26 / 0.25);
	}
	.store {
		position: relative;
		width: min(640px, 100%);
		margin-top: 40px;
	}
	.find {
		position: absolute;
		left: 50%;
		bottom: 6%;
		translate: -50% 0;
	}
	.drips {
		height: 36px;
		background: radial-gradient(circle 36px at 50% 0, var(--brand) 98%, transparent) 0 0 / 72px 36px
			repeat-x;
	}

	/* 2. Crave line */
	.crave {
		margin-top: 48px;
		font-size: clamp(3rem, 8vw, 6.5rem);
		color: var(--black);
	}

	/* 3. Rail */
	.rail {
		list-style: none;
		margin: 40px 0 0;
		padding: 0 16px 8px;
		display: flex;
		gap: 16px;
		overflow-x: auto;
		scroll-snap-type: x mandatory;
		scrollbar-width: none;
	}
	.rail > li {
		flex: none;
		position: relative;
		width: 280px;
		height: 340px;
		border-radius: 28px;
		overflow: hidden;
		scroll-snap-align: start;
	}
	.dish img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: scale 0.5s;
	}
	.dish:hover img {
		scale: 1.06;
	}
	.dish-info {
		position: absolute;
		inset: auto 0 0;
		display: grid;
		gap: 4px;
		padding: 80px 18px 18px;
		background: linear-gradient(transparent, rgb(0 0 0 / 0.85));
		color: var(--cream);
	}
	.dish-info strong {
		font-size: 1.25rem;
		max-width: 150px;
	}
	.dish-info .price {
		color: var(--cream);
		font-size: 1.25rem;
	}
	.dish-add {
		position: absolute;
		right: 14px;
		bottom: 18px;
	}
	.slogan {
		display: grid;
		align-content: space-between;
		padding: 28px;
		color: var(--cream);
	}
	.slogan.red {
		background-color: var(--brand);
	}
	.slogan.black {
		background-color: var(--black);
		color: var(--brand);
	}
	.slogan p {
		margin: 0;
		font-size: 2rem;
	}
	.stamp-name {
		justify-self: center;
		padding: 4px 12px;
		border-radius: 8px;
		background: var(--cream);
		color: var(--brand);
		font-size: 1rem;
		rotate: -4deg;
	}

	/* 4. Spin rings */
	.spin-wrap {
		display: grid;
		justify-items: center;
		gap: 40px;
		padding: 100px 16px 60px;
		text-align: center;
	}
	.spin {
		position: relative;
		width: min(500px, 100%);
	}
	.spin svg {
		display: block;
		width: 100%;
		overflow: visible;
	}
	.ring {
		transform-origin: 250px 250px;
		animation: turn var(--t) linear infinite;
	}
	.ring text {
		font-family: var(--display);
		font-weight: 800;
		font-stretch: 85%;
		fill: var(--black);
	}
	@keyframes turn {
		to {
			rotate: 360deg;
		}
	}
	.sticker {
		position: absolute;
		padding: 8px 18px;
		border-radius: 999px;
		background: var(--mustard);
		color: var(--black);
		font-size: clamp(1rem, 2.4vw, 1.375rem);
		box-shadow: 0 0 0 3px var(--cream);
		animation: bob 3.2s ease-in-out infinite;
	}
	.s1 {
		top: 8%;
		right: -4%;
		rotate: 12deg;
	}
	.s2 {
		top: 52%;
		left: -8%;
		rotate: -14deg;
		animation-delay: -1s;
	}
	.s3 {
		bottom: 4%;
		right: 6%;
		rotate: -6deg;
		animation-delay: -2s;
	}
	@keyframes bob {
		50% {
			translate: 0 -10px;
		}
	}
	.story {
		max-width: 560px;
	}
	.story h2 {
		font-size: clamp(2rem, 5vw, 3rem);
		margin-bottom: 12px;
	}
	.story p {
		margin: 10px 0 0;
		color: var(--muted);
		font-size: 1.125rem;
	}

	/* 5. Menu */
	.menu {
		padding-top: 80px;
	}
	.menu .section-title {
		text-align: center;
	}
	.menu-sub {
		text-align: center;
		color: var(--muted);
		font-size: 1.125rem;
		margin: 12px 0 0;
	}
	.legend {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
		gap: 18px;
		list-style: none;
		padding: 0;
		margin: 14px 0 0;
		font-size: 0.9375rem;
	}
	.legend li {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		color: var(--muted);
	}
	.legend li :global(svg) {
		color: var(--c);
	}
	.cats {
		position: sticky;
		top: 96px;
		z-index: 4;
		margin-top: 24px;
	}
	.cats .wrap {
		display: flex;
		justify-content: center;
		gap: 8px;
		overflow-x: auto;
		padding-block: 10px;
		scrollbar-width: none;
	}
	.cats a {
		flex: none;
		padding: 10px 18px;
		border-radius: 12px;
		background: var(--black);
		color: var(--cream);
		text-decoration: none;
		font-weight: 800;
		font-stretch: 85%;
		text-transform: uppercase;
		font-size: 0.9375rem;
		transition:
			background 0.2s,
			rotate 0.2s;
	}
	.cats a:hover {
		background: var(--brand);
		rotate: -3deg;
	}
	.courses {
		columns: 1;
		column-gap: 64px;
		padding-top: 24px;
	}
	.course {
		break-inside: avoid;
		padding-top: 36px;
	}
	.label {
		display: inline-block;
		padding: 8px 20px;
		margin-bottom: 18px;
		border-radius: 999px;
		background: var(--brand);
		color: var(--cream);
		font-size: 1.625rem;
	}
	.course ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 12px;
	}
	.course li {
		display: grid;
		grid-template-columns: 1fr auto;
		column-gap: 16px;
		align-items: start;
		padding: 10px 12px;
		margin-inline: -12px;
		border-radius: 14px;
		transition: background 0.2s;
	}
	.course li:hover {
		background: var(--soft);
	}
	.course li.gone {
		opacity: 0.55;
	}
	.line {
		display: flex;
		align-items: baseline;
		gap: 8px;
		font-weight: 800;
		font-stretch: 90%;
		font-size: 1.125rem;
		text-transform: uppercase;
	}
	.name {
		display: inline-flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 5px;
	}
	.leader {
		flex: 1;
		min-width: 12px;
		height: 3px;
		translate: 0 -3px;
		background: radial-gradient(circle, rgb(0 0 0 / 0.35) 1px, transparent 1.4px) 0 0 / 7px 3px
			repeat-x;
	}
	.course p {
		grid-column: 1;
		margin: 2px 0 0;
		color: var(--muted);
		font-size: 0.9375rem;
	}
	.course .add {
		grid-column: 2;
		grid-row: 1 / span 2;
		align-self: center;
	}
	.tag {
		--c: currentColor;
		display: inline-flex;
		align-self: center;
		color: var(--c);
	}
	.tag.popular {
		--c: #e8a400;
	}
	.tag.spicy {
		--c: var(--chili);
	}
	.tag.veg {
		--c: var(--green);
	}

	/* 6. Adventure banner: red with a zig-zag bottom edge */
	.adventure {
		position: relative;
		margin-top: 96px;
		padding: 88px 0 120px;
		background: var(--brand);
		color: var(--cream);
		overflow: hidden;
		mask: conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) 50% / 36px 100%;
	}
	.doodles span {
		position: absolute;
		left: var(--x);
		top: var(--y);
		color: rgb(255 255 255 / 0.12);
	}
	.adv-in {
		position: relative;
		display: grid;
		justify-items: center;
		text-align: center;
	}
	.adv-sub {
		margin: 16px 0 36px;
		font-size: clamp(1rem, 2vw, 1.375rem);
	}
	.book-card {
		width: min(820px, 100%);
		padding: clamp(20px, 4vw, 36px);
		border-radius: 24px;
		background: var(--cream);
		color: var(--black);
		text-align: left;
	}

	/* 7. Round food stickers over a big scrolling line */
	.collage {
		position: relative;
		display: grid;
		place-items: center;
		margin-top: 80px;
		padding-block: 40px 60px;
		overflow: hidden;
	}
	.tawa {
		position: absolute;
		inset: 50% 0 auto;
		translate: 0 -50%;
		font-size: clamp(4rem, 12vw, 10rem);
		color: var(--brand);
	}
	.cuts {
		position: relative;
		display: flex;
		justify-content: space-between;
		gap: 16px;
		width: min(1000px, 100% - 32px);
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.cuts li {
		display: grid;
		flex: 1;
		min-width: 0;
		justify-items: center;
		rotate: var(--r);
		animation: bob 5s ease-in-out infinite;
		animation-delay: var(--d);
	}
	.cuts img {
		width: clamp(110px, 20vw, 240px);
		aspect-ratio: 1;
		object-fit: cover;
		border-radius: 50%;
		border: clamp(4px, 0.6vw, 8px) solid var(--cream);
		transition: scale 0.3s;
	}
	.cuts li:hover img {
		scale: 1.05;
	}
	.tag-price {
		margin-top: -18px;
		padding: 6px 14px;
		border-radius: 999px;
		background: var(--mustard);
		color: var(--black);
		font-size: clamp(0.75rem, 1.4vw, 1rem);
		text-align: center;
		rotate: 4deg;
	}

	/* 8. Reviews */
	.reviews {
		display: grid;
		justify-items: center;
		padding: 60px 0 40px;
		text-align: center;
	}
	.reviews .section-title {
		font-size: clamp(2.25rem, 5vw, 3.5rem);
	}
	/* Reviews printed on receipt slips, drifting sideways; hover pauses the drift. */
	.reviews-head {
		display: grid;
		justify-items: center;
	}
	.slips {
		width: 100%;
		margin-top: 40px;
		padding-block: 16px 28px;
	}
	.slips:hover > * {
		animation-play-state: paused;
	}
	.slips ul {
		display: flex;
		gap: 28px;
		margin: 0;
		padding: 0 14px;
		list-style: none;
	}
	.slip {
		flex: none;
		white-space: normal;
		display: grid;
		grid-template-rows: auto 1fr auto;
		gap: 16px;
		width: 280px;
		min-height: 340px;
		padding: 28px;
		border-radius: 28px;
		background: var(--brand);
		color: var(--cream);
		text-align: left;
		rotate: var(--r);
		transition:
			rotate 0.3s,
			translate 0.3s;
	}
	.slip.dark {
		background: var(--black);
	}
	.slip:hover {
		rotate: 0deg;
		translate: 0 -6px;
	}
	.stars {
		color: var(--mustard);
		font-size: 1.25rem;
		letter-spacing: 3px;
	}
	.slip p {
		margin: 0;
		font-size: 1.375rem;
		line-height: 1.05;
	}
	.slip.dark p {
		color: var(--cream);
	}
	.by {
		justify-self: start;
		padding: 4px 12px;
		border-radius: 8px;
		background: var(--cream);
		color: var(--brand);
		font: 800 0.875rem var(--display);
		font-stretch: 85%;
		text-transform: uppercase;
		rotate: -3deg;
	}
	.slip.dark .by {
		background: var(--mustard);
		color: var(--black);
	}
	@media (prefers-reduced-motion: reduce) {
		.slips {
			overflow-x: auto;
		}
	}

	/* 9. Crossing bands */
	.bands {
		position: relative;
		height: 150px;
		margin: 40px 0;
		overflow: hidden;
	}
	.band {
		position: absolute;
		left: -5%;
		width: 110%;
		top: 50%;
		padding: 14px 0;
		font: 800 1.25rem var(--display);
		font-stretch: 85%;
		text-transform: uppercase;
		translate: 0 -50%;
	}
	.band span {
		display: inline-flex;
		align-items: center;
		gap: 22px;
		padding-right: 22px;
	}
	.band.red {
		background: var(--brand);
		color: var(--cream);
		rotate: 3deg;
	}
	.band.red span {
		animation-direction: reverse;
	}
	.band.black {
		background: var(--charcoal);
		color: var(--cream);
		rotate: -2deg;
	}
	.band :global(svg) {
		color: var(--mustard);
	}

	/* 10. Call-to-order */
	.call {
		display: grid;
		justify-items: center;
		padding: 60px 0 0;
		text-align: center;
	}
	.small-top {
		margin: 0;
		font-size: 1rem;
	}
	.fuel {
		margin-bottom: 24px;
		margin-top: 6px;
		font-size: clamp(2.25rem, 6vw, 4rem);
	}
	/* 11. Footer */
	footer {
		position: relative;
		background: var(--black);
		color: var(--cream);
	}
	/* Black blobs rising over the base of the building and the cream around it. */
	.drip-up {
		position: absolute;
		inset: -43px 0 auto;
		height: 44px;
		background:
			radial-gradient(circle 24px at 50% 100%, var(--black) 98%, transparent) 0 100% / 48px 30px
				repeat-x,
			radial-gradient(circle 16px at 50% 100%, var(--black) 98%, transparent) 24px 100% / 48px 44px
				repeat-x;
	}
	.foot-grid {
		display: grid;
		gap: 28px;
		padding-top: 48px;
		font-size: 1rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.foot-grid h3 {
		margin-bottom: 14px;
		font-size: 1.25rem;
		color: var(--mustard);
	}
	.foot-grid p {
		margin: 0 0 10px;
		color: rgb(255 249 231 / 0.75);
		line-height: 1.6;
	}
	.foot-grid strong {
		color: var(--cream);
	}
	.foot-links {
		display: grid;
		align-content: start;
		gap: 10px;
	}
	.foot-grid a,
	.linkish {
		color: var(--cream);
		text-decoration: none;
	}
	.foot-grid a:hover,
	.linkish:hover {
		color: var(--mustard);
	}
	.linkish {
		justify-self: start;
		padding: 0;
		border: 0;
		background: none;
		font: inherit;
		text-transform: inherit;
		letter-spacing: inherit;
		cursor: pointer;
	}
	.social {
		display: flex;
		gap: 14px;
		margin: 4px 0 12px;
	}
	.social a {
		color: var(--brand);
	}
	.social a:hover {
		color: var(--mustard);
	}
	.copy {
		font-size: 0.75rem;
		opacity: 0.7;
	}
	/* Giant wordmark stretched edge to edge, cropped by the bottom. */
	.giant {
		display: block;
		width: 100%;
		height: auto;
		margin-top: 48px;
	}
	.giant text {
		fill: var(--cream);
		font: 800 300px var(--display);
		font-stretch: 85%;
	}

	/* Mobile bottom bar */
	.mbar {
		display: none;
	}
	@media (max-width: 859px) {
		.links,
		.order-btn span:not(.badge) {
			display: none;
		}
		.order-btn {
			padding: 0 12px;
		}
		footer {
			padding-bottom: 88px;
		}
		.mbar {
			display: grid;
			grid-template-columns: 1fr 1.4fr 1fr;
			align-items: center;
			position: fixed;
			inset: auto 12px 12px;
			z-index: 12;
			padding: 6px;
			background: var(--black);
			border-radius: 18px;
		}
		.mbar a {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 2px;
			padding: 8px 0;
			color: var(--cream);
			text-decoration: none;
			font-size: 0.8125rem;
			font-weight: 700;
			text-transform: uppercase;
			border-radius: 12px;
		}
		.mbar .main {
			background: var(--brand);
		}
		.cartbar {
			display: flex;
			gap: 12px;
			padding: 16px 18px;
			border: 0;
			background: var(--brand);
			color: var(--cream);
			font: 800 1rem var(--display);
			text-transform: uppercase;
			cursor: pointer;
			animation: enter 0.4s both;
		}
		.cartbar .badge {
			background: var(--cream);
			color: var(--brand);
		}
		.cartbar span:nth-child(2) {
			flex: 1;
			text-align: left;
		}
	}
	@media (min-width: 860px) {
		.courses {
			columns: 2;
		}
		.foot-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}
</style>

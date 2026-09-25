<script lang="ts">
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		ArrowRight01Icon,
		Cash01Icon,
		DeliveryTruck01Icon,
		Invoice03Icon,
		PlayIcon,
		SmartPhone01Icon,
		Tick02Icon,
		WhatsappIcon,
		WifiDisconnected01Icon
	} from '@hugeicons/core-free-icons';
	import Seo from '$lib/Seo.svelte';
	import Shot from '$lib/Shot.svelte';
	import Storefront from '$lib/Storefront.svelte';
	import { plans, setup } from '$lib/pricing';
	import { site, taka } from '$lib/site';

	const pillars = [
		{
			title: 'A website that takes orders',
			shot: 'website',
			alt: 'A restaurant website built with Tavora',
			points: [
				'Your full menu with photos and prices',
				'Orders with cash on delivery or pickup',
				'Table bookings, opening hours, open or closed right now'
			]
		},
		{
			title: 'A dashboard that runs the day',
			shot: 'orders',
			alt: 'Online orders in the Tavora dashboard',
			points: [
				'New orders ring and show a count, wherever you are',
				'Change the menu, prices and photos yourself',
				'Revenue, best sellers and the end-of-day cash count'
			]
		},
		{
			title: 'A till for the counter and kitchen',
			shot: 'pos-floor',
			alt: 'The Tavora till showing tables',
			points: [
				'Tables, takeaway and a kitchen screen',
				'Cash, card, bKash, Nagad, split bills and tips',
				'Keeps working when the internet drops'
			]
		}
	];

	const local = [
		{
			icon: DeliveryTruck01Icon,
			title: 'Cash on delivery first',
			text: 'Customers order online and pay the rider. No card or gateway needed.'
		},
		{
			icon: Cash01Icon,
			title: 'bKash and Nagad',
			text: 'Record the transaction ID with every mobile payment, so it can be checked later.'
		},
		{
			icon: WifiDisconnected01Icon,
			title: 'Works without internet',
			text: 'The till keeps taking orders and payments offline and catches up by itself.'
		},
		{
			icon: Invoice03Icon,
			title: 'VAT invoices',
			text: 'Add your BIN and bills print as Mushak-6.3 VAT invoices with the VAT shown.'
		},
		{
			icon: WhatsappIcon,
			title: 'WhatsApp built in',
			text: 'Customers send their order to your WhatsApp in one tap; you reply the way you already do.'
		},
		{
			icon: SmartPhone01Icon,
			title: 'On the tablets you have',
			text: 'Runs in the browser on any Android tablet or phone. Nothing to install.'
		}
	];

	const steps = [
		{
			title: 'We set it up',
			text: 'Your colours, your menu, your tables, your tablets. Usually within a week.'
		},
		{
			title: 'You run it',
			text: 'Two hours of training and your team is taking orders. Most changes you make yourself.'
		},
		{
			title: 'We look after it',
			text: 'Hosting, backups and updates are included. Help is a WhatsApp away.'
		}
	];

	const faqs = [
		{
			q: 'Do you take a cut of my orders?',
			a: 'No. You pay a fixed monthly price. Every taka from your orders is yours.'
		},
		{
			q: 'Do I need a card payment gateway?',
			a: 'No. Orders are cash on delivery or pickup. At the till you record card, bKash and Nagad payments you take on your own machine or number.'
		},
		{
			q: 'What if the internet goes down?',
			a: 'The till keeps working: orders, kitchen tickets, payments and printing. Everything sends by itself when the connection is back.'
		},
		{
			q: 'Can I change the menu myself?',
			a: 'Yes. Prices, photos, sold-out dishes and every word on your website can be changed from the dashboard in a minute.'
		},
		{
			q: 'Which printer do I need?',
			a: 'Any 80 mm receipt printer that works with Android. We help you set it up.'
		}
	];
	const from = Math.min(...plans.map((p) => p.monthly));
</script>

<Seo
	title="Website, dashboard and till for restaurants"
	description="Tavora gives Bangladeshi restaurants a website that takes orders, a dashboard for the day, and a till that works offline. Cash on delivery, bKash, Nagad and VAT invoices built in."
	path="/"
/>

<section class="hero">
	<div class="wrap hero-in">
		<div class="copy">
			<p class="pill">For restaurants in Bangladesh</p>
			<h1>Website, dashboard and till. <span>One place.</span></h1>
			<p class="sub">
				Take orders online, run the counter and kitchen, and count the drawer at night, all from the
				tablets you already have.
			</p>
			<div class="ctas">
				<a class="btn cream" href="/pricing"
					>See pricing <HugeiconsIcon icon={ArrowRight01Icon} size={18} /></a
				>
				<a class="btn ghost-cream" href={site.demo} target="_blank" rel="noopener"
					><HugeiconsIcon icon={PlayIcon} size={18} /> Try the live demo</a
				>
			</div>
		</div>
		<div class="art">
			<Storefront name="Tavora" sign={{ open: true, line: 'orders welcome', label: 'Open' }} />
		</div>
	</div>
</section>

<section class="wrap block">
	<h2 class="title">Three things, working together</h2>
	<div class="pillars">
		{#each pillars as p (p.title)}
			<article>
				<Shot name={p.shot} alt={p.alt} />
				<h3>{p.title}</h3>
				<ul class="ticks">
					{#each p.points as pt (pt)}<li>
							<HugeiconsIcon icon={Tick02Icon} size={18} />
							{pt}
						</li>{/each}
				</ul>
			</article>
		{/each}
	</div>
	<p class="more">
		<a class="btn ghost" href="/features"
			>Every feature <HugeiconsIcon icon={ArrowRight01Icon} size={18} /></a
		>
	</p>
</section>

<section class="local">
	<div class="wrap block">
		<h2 class="title">Made for how Bangladesh eats</h2>
		<div class="grid">
			{#each local as l (l.title)}
				<div class="card">
					<span class="ic"><HugeiconsIcon icon={l.icon} size={26} /></span>
					<h3>{l.title}</h3>
					<p>{l.text}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<section class="wrap block">
	<h2 class="title">How it works</h2>
	<ol class="steps">
		{#each steps as s, i (s.title)}
			<li>
				<span class="n">{i + 1}</span>
				<h3>{s.title}</h3>
				<p>{s.text}</p>
			</li>
		{/each}
	</ol>
</section>

<section class="wrap block price-teaser">
	<div>
		<h2 class="title">Clear, fixed prices</h2>
		<p class="lead">
			From <strong>{taka(from)} a month</strong>, plus a one-time setup of {taka(setup.price)}. No
			commission, no hidden fees, cancel any month.
		</p>
	</div>
	<a class="btn primary" href="/pricing"
		>See the plans <HugeiconsIcon icon={ArrowRight01Icon} size={18} /></a
	>
</section>

<section class="wrap block">
	<h2 class="title">Questions</h2>
	<div class="faq">
		{#each faqs as f (f.q)}
			<details>
				<summary>{f.q}</summary>
				<p>{f.a}</p>
			</details>
		{/each}
	</div>
</section>

<section class="wrap final">
	<h2>Ready when you are</h2>
	<p>Tell us about your restaurant on WhatsApp. We reply the same day.</p>
	<a class="btn primary" href={site.whatsapp} target="_blank" rel="noopener"
		><HugeiconsIcon icon={WhatsappIcon} size={20} /> Message us on WhatsApp</a
	>
</section>

<style>
	.hero {
		background: var(--brand);
		color: var(--cream);
	}
	.hero-in {
		display: grid;
		grid-template-columns: 1.1fr 1fr;
		align-items: center;
		gap: 32px;
		padding: 64px 0 56px;
	}
	.hero .pill {
		background: var(--cream);
		color: var(--black);
	}
	h1 {
		font-size: clamp(2.75rem, 7vw, 5.25rem);
	}
	h1 span {
		color: var(--mustard);
	}
	.sub {
		max-width: 46ch;
		margin: 20px 0 28px;
		font-size: 1.25rem;
	}
	.ctas {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
	}
	.ghost-cream {
		background: transparent;
		color: var(--cream);
		box-shadow: inset 0 0 0 2px var(--cream);
	}
	.block {
		padding-top: 88px;
	}
	.title {
		margin-bottom: 32px;
		font-size: clamp(2.25rem, 5vw, 3.75rem);
	}
	.pillars {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 28px;
	}
	.pillars h3 {
		margin: 22px 0 12px;
		font-size: 1.5rem;
	}
	.ticks {
		display: grid;
		gap: 8px;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.ticks li {
		display: flex;
		gap: 8px;
		align-items: flex-start;
	}
	.ticks :global(svg) {
		flex: none;
		margin-top: 4px;
		color: var(--brand);
	}
	.more {
		margin: 32px 0 0;
	}
	.local {
		margin-top: 88px;
		padding-bottom: 88px;
		background: var(--soft);
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 16px;
	}
	.card {
		padding: 24px;
		border-radius: 20px;
		background: var(--cream);
	}
	.card h3 {
		margin: 16px 0 8px;
		font-size: 1.25rem;
	}
	.card p {
		margin: 0;
		color: var(--muted);
	}
	.ic {
		display: grid;
		place-items: center;
		width: 52px;
		height: 52px;
		border-radius: 14px;
		background: var(--brand);
		color: var(--cream);
	}
	.steps {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 24px;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.steps h3 {
		margin: 16px 0 8px;
		font-size: 1.5rem;
	}
	.steps p {
		margin: 0;
		color: var(--muted);
	}
	.n {
		display: grid;
		place-items: center;
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: var(--black);
		color: var(--cream);
		font-weight: 800;
		font-size: 1.25rem;
	}
	.price-teaser {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		justify-content: space-between;
		gap: 24px;
	}
	.price-teaser .title {
		margin-bottom: 12px;
	}
	.faq {
		display: grid;
		gap: 10px;
		max-width: 820px;
	}
	details {
		padding: 16px 20px;
		border-radius: 16px;
		background: var(--soft);
	}
	summary {
		font-weight: 800;
		font-size: 1.125rem;
		cursor: pointer;
	}
	details p {
		margin: 10px 0 0;
		color: var(--muted);
	}
	.final {
		display: grid;
		justify-items: center;
		gap: 16px;
		margin-top: 88px;
		padding: 56px 24px;
		border-radius: 28px;
		background: var(--black);
		color: var(--cream);
		text-align: center;
	}
	.final h2 {
		font-size: clamp(2.25rem, 5vw, 3.5rem);
	}
	.final p {
		margin: 0;
		font-size: 1.125rem;
	}
	@media (max-width: 900px) {
		.hero-in,
		.pillars,
		.grid,
		.steps {
			grid-template-columns: 1fr;
		}
		.art {
			max-width: 460px;
		}
	}
</style>

<script lang="ts">
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		ArrowRight01Icon,
		Calendar03Icon,
		Cashier02Icon,
		ChefHatIcon,
		DeliveryTruck01Icon,
		Invoice03Icon,
		Tick02Icon,
		UserGroupIcon,
		Wallet01Icon,
		WhatsappIcon,
		WifiDisconnected01Icon
	} from '@hugeicons/core-free-icons';
	import Seo from '$lib/Seo.svelte';
	import Shot from '$lib/Shot.svelte';
	import { care, plans, promises, setup } from '$lib/pricing';
	import { site, taka } from '$lib/site';

	const features = [
		{
			icon: DeliveryTruck01Icon,
			title: 'Online orders',
			text: 'Your menu online, cash on delivery or pickup.'
		},
		{ icon: Calendar03Icon, title: 'Table bookings', text: 'Guests book; you confirm in one tap.' },
		{ icon: Cashier02Icon, title: 'Till', text: 'Tables and takeaway on any Android tablet.' },
		{
			icon: ChefHatIcon,
			title: 'Kitchen screen',
			text: 'Every ticket with timers and cook’s notes.'
		},
		{
			icon: Wallet01Icon,
			title: 'Every way to pay',
			text: 'Cash, card, bKash, Nagad, split bills, tips.'
		},
		{
			icon: WifiDisconnected01Icon,
			title: 'Works offline',
			text: 'Keeps selling when the internet drops.'
		},
		{
			icon: UserGroupIcon,
			title: 'Staff and end of day',
			text: 'PIN per person; count the drawer at close.'
		},
		{ icon: Invoice03Icon, title: 'VAT invoices', text: 'Mushak-6.3 bills with your BIN.' }
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
			a: 'The till keeps taking orders, sending to the kitchen, taking payment and printing. It catches up by itself.'
		},
		{
			q: 'Can I change the menu myself?',
			a: 'Yes. Prices, photos, sold-out dishes and every word on the website, from the dashboard.'
		}
	];
</script>

<Seo
	title="Website, dashboard and till for restaurants"
	description="Tavora gives restaurants in Bangladesh a website that takes orders, a dashboard, and a till that works offline. Cash on delivery, bKash, Nagad and VAT invoices built in."
	path="/"
/>

<section class="wrap hero">
	<span class="eyebrow">For restaurants in Bangladesh</span>
	<h1>Website, dashboard and till.<br />One place.</h1>
	<p class="sub">
		Take orders online, run the counter and kitchen, and count the drawer at night, on the tablets
		you already have.
	</p>
	<div class="ctas">
		<a class="btn primary" href="#pricing"
			>See pricing <HugeiconsIcon icon={ArrowRight01Icon} size={20} /></a
		>
		<a class="btn ghost" href={site.demo} target="_blank" rel="noopener">Try the live demo</a>
	</div>
	<div class="hero-shot">
		<Shot name="overview" alt="The Tavora dashboard overview" />
	</div>
</section>

<section id="features" class="wrap block">
	<span class="eyebrow">Features</span>
	<h2>Everything a restaurant runs on</h2>
	<ul class="features">
		{#each features as f (f.title)}
			<li>
				<span class="icon"><HugeiconsIcon icon={f.icon} size={24} /></span>
				<h3>{f.title}</h3>
				<p>{f.text}</p>
			</li>
		{/each}
	</ul>
	<div class="pair">
		<Shot name="pos-ticket" alt="Taking an order at the Tavora till" caption="The till" />
		<Shot name="pos-kitchen" alt="The Tavora kitchen screen" caption="The kitchen screen" />
	</div>
</section>

<section id="pricing" class="wrap block">
	<span class="eyebrow">Pricing</span>
	<h2>Fixed prices, no commission</h2>
	<div class="plans">
		{#each plans as p (p.name)}
			<article class="plan" class:featured={p.featured}>
				<div class="plan-head">
					<h3>{p.name}</h3>
					{#if p.featured}<span class="badge">Popular</span>{/if}
				</div>
				<p class="for">{p.for}</p>
				<p class="amount"><span class="num">{taka(p.monthly)}</span> / month</p>
				<ul>
					{#each p.includes as i (i)}<li>
							<HugeiconsIcon icon={Tick02Icon} size={16} />
							{i}
						</li>{/each}
				</ul>
				<a
					class="btn"
					class:primary={p.featured}
					class:ghost={!p.featured}
					href={site.whatsapp}
					target="_blank"
					rel="noopener">Get started</a
				>
			</article>
		{/each}
	</div>
	<dl class="extras">
		<div>
			<dt>One-time setup</dt>
			<dd><span class="num">{taka(setup)}</span> · design, menu entry, tablets and training</dd>
		</div>
		<div>
			<dt>Care plan, optional</dt>
			<dd><span class="num">{taka(care)}</span> / month · we make changes for you</dd>
		</div>
	</dl>
	<ul class="promises">
		{#each promises as p (p)}<li><HugeiconsIcon icon={Tick02Icon} size={16} /> {p}</li>{/each}
	</ul>
</section>

<section class="wrap block faq">
	<h2>Questions</h2>
	<div>
		{#each faqs as f (f.q)}
			<details>
				<summary>{f.q}</summary>
				<p>{f.a}</p>
			</details>
		{/each}
	</div>
</section>

<section class="wrap cta">
	<h2>Ready when you are</h2>
	<p>Tell us about your restaurant. We reply on WhatsApp.</p>
	<a class="btn primary" href={site.whatsapp} target="_blank" rel="noopener"
		><HugeiconsIcon icon={WhatsappIcon} size={20} /> Message us</a
	>
</section>

<style>
	.hero {
		padding-top: var(--s9);
		text-align: center;
	}
	h1 {
		font-size: var(--t-3xl);
	}
	.sub {
		max-width: 34em;
		margin: var(--s5) auto 0;
		color: var(--muted);
		font-size: var(--t-lg);
	}
	.ctas {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: var(--s3);
		margin-top: var(--s6);
	}
	.hero-shot {
		margin-top: var(--s8);
	}
	.block {
		padding-top: var(--s9);
	}
	h2 {
		font-size: var(--t-2xl);
	}
	.features {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: var(--s6) var(--s5);
		margin: var(--s7) 0 0;
		padding: 0;
		list-style: none;
	}
	.icon {
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		border-radius: 12px;
		background: var(--brand-soft);
		color: var(--brand);
	}
	.features h3 {
		margin-top: var(--s4);
		font-size: var(--t-md);
		font-weight: 600;
		letter-spacing: 0;
	}
	.features p {
		margin-top: var(--s1);
		color: var(--muted);
		font-size: var(--t-sm);
	}
	.pair {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--s5);
		margin-top: var(--s8);
	}
	.plans {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--s5);
		margin-top: var(--s7);
	}
	.plan {
		display: flex;
		flex-direction: column;
		padding: var(--s6);
		border-radius: var(--radius);
		background: var(--surface);
		box-shadow: 0 0 0 1px var(--line);
	}
	.plan.featured {
		box-shadow: 0 0 0 2px var(--brand);
	}
	.plan-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.plan h3 {
		font-size: var(--t-lg);
		font-weight: 600;
		letter-spacing: 0;
	}
	.badge {
		padding: var(--s1) var(--s2);
		border-radius: 6px;
		background: var(--brand-soft);
		color: var(--brand);
		font: 500 var(--t-xs) / 1.2 var(--mono);
	}
	.for {
		margin-top: var(--s1);
		color: var(--muted);
		font-size: var(--t-sm);
	}
	.amount {
		margin: var(--s5) 0;
		color: var(--muted);
	}
	.amount .num {
		color: var(--ink);
		font-size: var(--t-2xl);
		font-weight: 600;
		letter-spacing: -0.03em;
	}
	.num {
		font-family: var(--mono);
	}
	.plan ul,
	.promises {
		display: grid;
		gap: var(--s2);
		margin: 0 0 var(--s6);
		padding: 0;
		list-style: none;
		font-size: var(--t-sm);
	}
	.plan li,
	.promises li {
		display: flex;
		align-items: center;
		gap: var(--s2);
	}
	.plan li :global(svg),
	.promises :global(svg) {
		flex: none;
		color: var(--brand);
	}
	.plan .btn {
		margin-top: auto;
	}
	.extras {
		display: grid;
		gap: var(--s3);
		margin: var(--s6) 0 0;
		padding: var(--s5) var(--s6);
		border-radius: var(--radius);
		background: var(--soft);
	}
	.extras div {
		display: flex;
		flex-wrap: wrap;
		gap: var(--s1) var(--s4);
	}
	.extras dt {
		min-width: 12em;
		font-weight: 600;
	}
	.extras dd {
		margin: 0;
		color: var(--muted);
	}
	.extras .num {
		color: var(--ink);
		font-weight: 600;
	}
	.promises {
		display: flex;
		flex-wrap: wrap;
		gap: var(--s2) var(--s5);
		margin: var(--s5) 0 0;
		color: var(--muted);
	}
	.faq {
		display: grid;
		grid-template-columns: 1fr 2fr;
		gap: var(--s6);
	}
	details {
		padding: var(--s4) 0;
		border-bottom: 1px solid var(--line);
	}
	details:first-child {
		padding-top: 0;
	}
	summary {
		font-weight: 600;
		cursor: pointer;
	}
	details p {
		margin-top: var(--s2);
		color: var(--muted);
	}
	.cta {
		display: grid;
		justify-items: center;
		gap: var(--s4);
		margin-top: var(--s9);
		padding: var(--s8) var(--s5);
		border-radius: 20px;
		background: var(--ink);
		color: var(--bg);
		text-align: center;
	}
	.cta p {
		color: rgb(255 250 240 / 0.7);
	}
	@media (max-width: 900px) {
		.features {
			grid-template-columns: 1fr 1fr;
		}
		.pair,
		.plans,
		.faq {
			grid-template-columns: 1fr;
		}
	}
	@media (max-width: 520px) {
		.hero {
			padding-top: var(--s8);
			text-align: left;
		}
		.sub {
			margin-inline: 0;
		}
		.ctas {
			justify-content: flex-start;
		}
		.features {
			gap: var(--s5) var(--s4);
		}
	}
</style>

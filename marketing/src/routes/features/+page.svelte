<script lang="ts">
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { ArrowRight01Icon, Tick02Icon } from '@hugeicons/core-free-icons';
	import Seo from '$lib/Seo.svelte';
	import Shot from '$lib/Shot.svelte';

	const features = [
		{
			id: 'website',
			title: 'Your website',
			shot: 'website',
			text: 'A bold, fast website in your colours that shows your menu, opening hours and whether you’re open right now.',
			points: [
				'Online orders with cash on delivery or pickup',
				'Free delivery above an amount you choose',
				'Table bookings with the day and time',
				'Customers can send their order to your WhatsApp in one tap',
				'Every word, review and photo editable from the dashboard'
			]
		},
		{
			id: 'orders',
			title: 'Online orders',
			shot: 'orders',
			text: 'Every order in one list with the one next step to take: accept, cook, ready, on the way, done.',
			points: [
				'A sound and a count the moment an order arrives',
				'Accepted orders go straight to the kitchen screen',
				'Full details and a printable receipt for any order'
			]
		},
		{
			id: 'pos',
			title: 'The till',
			shot: 'pos-ticket',
			text: 'Built for tablets at the counter. Big buttons, tables on one screen, and nothing to install.',
			points: [
				'Tables and takeaway tickets',
				'Notes for the cook: no onion, extra spicy, or anything you type',
				'Only new dishes go to the kitchen, so nothing is cooked twice',
				'Discounts and voids, recorded with who did them'
			]
		},
		{
			id: 'payments',
			title: 'Payments',
			shot: 'pos-pay',
			text: 'Take money the way your customers pay.',
			points: [
				'Cash with the change worked out for you',
				'Card, bKash and Nagad, with the transaction ID kept',
				'Split a bill between friends, each paying their way',
				'Tips kept separate from the bill'
			]
		},
		{
			id: 'kitchen',
			title: 'Kitchen screen',
			shot: 'pos-kitchen',
			text: 'A tablet in the kitchen shows every ticket to cook, with timers that turn yellow and then red.',
			points: [
				'Online and till orders on one screen',
				'Cook’s notes in red',
				'Kitchen tickets print too'
			]
		},
		{
			id: 'offline',
			title: 'Works without internet',
			shot: 'pos-floor',
			text: 'When the internet drops, the till keeps going: orders, kitchen tickets, payments and receipts. When it’s back, everything sends by itself, in order, never twice.',
			points: [
				'A clear sign at the top: All saved, or how many are waiting',
				'Clashes explained in plain words'
			]
		},
		{
			id: 'staff',
			title: 'Staff and PINs',
			shot: 'staff',
			text: 'Each person signs in to the till with their own 6-digit PIN. They see the till, orders and bookings, and nothing else.',
			points: [
				'Every bill shows who opened it and who took the money',
				'Remove someone and they’re signed out at once'
			]
		},
		{
			id: 'end-of-day',
			title: 'End of day',
			shot: 'end-of-day',
			text: 'One page tells you the cash that should be in the drawer, and a clean A4 sheet prints to count and sign.',
			points: [
				'Takings by cash, card, bKash and Nagad',
				'By staff member, with tips',
				'Discounts, voids and VAT collected'
			]
		},
		{
			id: 'vat',
			title: 'VAT and invoices',
			shot: 'hours',
			text: 'Set your VAT rate and BIN once. Bills show the VAT and print as Mushak-6.3 VAT invoices.',
			points: [
				'Prices with VAT included or added on top',
				'Old bills keep the VAT they were made with'
			]
		},
		{
			id: 'menu',
			title: 'Menu and settings',
			shot: 'menu',
			text: 'Change prices, photos and dishes yourself. Mark a dish sold out and it disappears from online ordering at once.',
			points: [
				'Opening hours per day',
				'Delivery fee and areas',
				'Your brand colour across everything'
			]
		}
	];
</script>

<Seo
	title="Features"
	description="Everything Tavora does: restaurant website with online orders and bookings, dashboard, a till that works offline, kitchen screen, staff PINs, end-of-day report and VAT invoices."
	path="/features"
/>

<section class="wrap head">
	<p class="pill">Features</p>
	<h1>Everything your restaurant runs on</h1>
	<p class="lead">
		One system for the website, the counter, the kitchen and the owner’s office. Here is what each
		part does, with real screens.
	</p>
	<nav class="jump" aria-label="Jump to a feature">
		{#each features as f (f.id)}<a href="#{f.id}">{f.title}</a>{/each}
	</nav>
</section>

{#each features as f, i (f.id)}
	<section id={f.id} class="wrap feature" class:flip={i % 2 === 1}>
		<div class="text">
			<h2>{f.title}</h2>
			<p>{f.text}</p>
			<ul>
				{#each f.points as p (p)}<li><HugeiconsIcon icon={Tick02Icon} size={18} /> {p}</li>{/each}
			</ul>
		</div>
		<Shot name={f.shot} alt="{f.title} in Tavora" />
	</section>
{/each}

<section class="wrap cta">
	<h2>See what it costs</h2>
	<a class="btn primary" href="/pricing"
		>Pricing <HugeiconsIcon icon={ArrowRight01Icon} size={18} /></a
	>
</section>

<style>
	.head {
		padding-top: 64px;
	}
	h1 {
		margin-bottom: 16px;
		font-size: clamp(2.75rem, 7vw, 5rem);
	}
	.jump {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 24px;
	}
	.jump a {
		padding: 8px 14px;
		border-radius: 999px;
		background: var(--soft);
		font-weight: 700;
		text-decoration: none;
	}
	.feature {
		display: grid;
		grid-template-columns: 1fr 1.3fr;
		align-items: center;
		gap: 48px;
		padding-top: 88px;
		scroll-margin-top: 80px;
	}
	.feature.flip .text {
		order: 2;
	}
	h2 {
		margin-bottom: 14px;
		font-size: clamp(2rem, 4vw, 3rem);
	}
	.text > p {
		margin: 0 0 16px;
		font-size: 1.125rem;
		color: var(--muted);
	}
	ul {
		display: grid;
		gap: 8px;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	li {
		display: flex;
		gap: 8px;
	}
	li :global(svg) {
		flex: none;
		margin-top: 4px;
		color: var(--brand);
	}
	.cta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		margin-top: 88px;
	}
	.cta h2 {
		margin: 0;
	}
	@media (max-width: 900px) {
		.feature {
			grid-template-columns: 1fr;
			gap: 24px;
		}
		.feature.flip .text {
			order: 0;
		}
	}
</style>

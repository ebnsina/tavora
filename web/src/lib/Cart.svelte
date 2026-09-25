<script lang="ts">
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		ArrowLeft02Icon,
		ArrowRight02Icon,
		Cancel01Icon,
		Cash01Icon,
		CheckmarkCircle02Icon,
		Menu01Icon,
		MotorbikeIcon,
		PrinterIcon,
		ShoppingBag01Icon,
		Store01Icon,
		WhatsappIcon
	} from '@hugeicons/core-free-icons';
	import {
		api,
		message,
		openState,
		price,
		time,
		vatOn,
		vatPct,
		ApiError,
		type Item,
		type Order,
		type Restaurant
	} from '$lib/api';
	import { cart, clock, count, subtotal, add } from '$lib/order.svelte';
	import { portal } from '$lib/portal';

	let { restaurant, items }: { restaurant: Restaurant; items: Map<number, Item> } = $props();

	let dialog: HTMLDialogElement;
	let step = $state<'cart' | 'checkout' | 'done'>('cart');
	let mode = $state<'delivery' | 'pickup'>('delivery');
	let name = $state('');
	let phone = $state('');
	let address = $state('');
	let note = $state('');
	let busy = $state(false);
	let error = $state('');
	let order = $state<Order | null>(null);
	// One id per checkout, so a retried or double-tapped submit can never create two orders.
	let orderId = crypto.randomUUID();

	const lines = $derived(
		Object.entries(cart.lines).map(([id, q]) => [items.get(+id)!, q] as const)
	);
	const sub = $derived(subtotal(items));
	const fee = $derived(
		mode === 'delivery' && sub < restaurant.delivery.free_over ? restaurant.delivery.fee : 0
	);
	// VAT on food only, same rule as the API.
	const vat = $derived(vatOn(sub, restaurant.vat.rate, restaurant.vat.inclusive));
	const total = $derived(sub + fee + vat.add);
	const pay = (m: string) => (m === 'delivery' ? 'Cash on delivery' : 'Pay at the counter');
	const stamp = new Intl.DateTimeFormat('en-GB', {
		dateStyle: 'medium',
		timeStyle: 'short',
		timeZone: 'Asia/Dhaka'
	});
	const code = (o: Order) => `TV-${o.number}`;
	const status = $derived(clock.now && openState(restaurant.hours, clock.now));
	const closed = $derived(!!status && !status.open);
	const closedNote = $derived(
		status && !status.open
			? status.when
				? `We're closed right now. Ordering opens ${status.when} at ${time(status.at)}. Your order will wait here.`
				: "We're closed today. Your order will wait here for next time."
			: ''
	);

	const whatsapp = $derived.by(() => {
		if (!order) return '';
		const o = order;
		const text = [
			`Order ${code(o)} · ${o.mode === 'delivery' ? 'Delivery' : 'Pickup'} · ${pay(o.mode)}`,
			'',
			...o.items.map((l) => `${l.qty} × ${l.name} — ${price(l.amount)}`),
			'',
			`Total to pay: ${price(o.total)}`,
			`Name: ${o.name} · ${o.phone}`,
			o.address && `Address: ${o.address}`
		]
			.filter((l) => l !== null)
			.join('\n');
		return `https://wa.me/${restaurant.whatsapp}?text=${encodeURIComponent(text)}`;
	});

	$effect(() => {
		if (cart.open && !dialog.open) dialog.showModal();
		if (!cart.open && dialog.open) dialog.close();
	});

	function close() {
		cart.open = false;
		if (step === 'done') step = 'cart';
	}

	async function placeOrder(e: SubmitEvent) {
		e.preventDefault();
		busy = true;
		error = '';
		try {
			order = await api<Order>('/v1/orders', {
				method: 'POST',
				body: JSON.stringify({
					id: orderId,
					mode,
					name,
					phone,
					address: mode === 'delivery' ? address : '',
					note,
					items: Object.entries(cart.lines).map(([id, qty]) => ({ id: +id, qty }))
				})
			});
			cart.lines = {};
			orderId = crypto.randomUUID();
			step = 'done';
		} catch (err) {
			error = message(err);
			if (err instanceof ApiError && err.code === 'restaurant_closed' && err.details.opens)
				error += ` Today we're open ${time(String(err.details.opens))} – ${time(String(err.details.closes))}.`;
			if (err instanceof ApiError && err.code === 'item_unavailable' && err.details.name)
				error = `Sorry, ${err.details.name} just sold out. Please remove it and try again.`;
		} finally {
			busy = false;
		}
	}
</script>

{#snippet receiptHead()}
	<div class="r-head">
		<strong class="r-brand">{restaurant.name.toUpperCase()}</strong>
		<span>{restaurant.address}</span>
		<span>Tel {restaurant.phone}</span>
		{#if restaurant.vat.bin}<span>BIN {restaurant.vat.bin}</span>{/if}
	</div>
{/snippet}

{#snippet orderReceipt(order: Order)}
	<div class="receipt">
		{@render receiptHead()}
		<div class="r-row"><span>ORDER</span><strong>{code(order)}</strong></div>
		<div class="r-row">
			<span>DATE</span><span>{stamp.format(new Date(order.created_at))}</span>
		</div>
		<div class="r-row"><span>TYPE</span><span>{order.mode.toUpperCase()}</span></div>
		<hr />
		{#each order.items as l (l.id)}
			<div class="r-row"><span>{l.qty} × {l.name}</span><span>{price(l.amount)}</span></div>
		{/each}
		<hr />
		<div class="r-row"><span>SUBTOTAL</span><span>{price(order.subtotal)}</span></div>
		{#if order.mode === 'delivery'}
			<div class="r-row">
				<span>DELIVERY</span><span>{order.delivery_fee ? price(order.delivery_fee) : 'FREE'}</span>
			</div>
		{/if}
		{#if order.vat}
			<div class="r-row">
				<span>VAT {vatPct(order.vat_rate)}{order.vat_inclusive ? ' (INCLUDED)' : ''}</span><span
					>{price(order.vat)}</span
				>
			</div>
		{/if}
		<div class="r-row r-total"><span>TOTAL</span><span>{price(order.total)}</span></div>
		<hr />
		<div class="r-row"><span>NAME</span><span>{order.name}</span></div>
		<div class="r-row"><span>PHONE</span><span>{order.phone}</span></div>
		{#if order.address}<p class="r-addr">{order.address}</p>{/if}
		<span class="stamp">{pay(order.mode).toUpperCase()}</span>
		<div class="barcode" aria-hidden="true"></div>
		<p class="r-thanks">*** THANK YOU ***</p>
	</div>
{/snippet}

<dialog bind:this={dialog} onclose={close} aria-labelledby="cart-title">
	<header>
		{#if step === 'checkout'}
			<button
				class="icon-btn"
				type="button"
				onclick={() => (step = 'cart')}
				aria-label="Back to your order"
			>
				<HugeiconsIcon icon={ArrowLeft02Icon} size={22} />
			</button>
		{/if}
		<h2 id="cart-title">
			{step === 'checkout' ? 'Checkout' : step === 'done' ? 'Order placed' : 'Your order'}
		</h2>
		<button class="icon-btn" type="button" onclick={close} aria-label="Close">
			<HugeiconsIcon icon={Cancel01Icon} size={22} />
		</button>
	</header>

	{#if step === 'done' && order}
		<div class="body done">
			<div class="printer" aria-hidden="true"></div>
			<div class="print">
				{@render orderReceipt(order)}
			</div>
			<p class="next">
				We've got your order. <strong>One last tap:</strong> send it to our WhatsApp so the kitchen
				starts cooking right away.
				{order.mode === 'delivery'
					? `Your food should arrive in ${restaurant.delivery.eta}.`
					: `Pick it up in about ${restaurant.pickup_eta}.`}
			</p>
			<a class="btn primary" href={whatsapp} target="_blank" rel="noopener">
				<HugeiconsIcon icon={WhatsappIcon} size={20} /> Send to our WhatsApp
			</a>
			<div class="done-row">
				<button class="btn" type="button" onclick={() => print()}>
					<HugeiconsIcon icon={PrinterIcon} size={18} /> Print receipt
				</button>
				<button class="btn" type="button" onclick={close}
					><HugeiconsIcon icon={ArrowLeft02Icon} size={18} /> Back to the menu</button
				>
			</div>
		</div>
	{:else if !lines.length}
		<div class="body empty">
			<span class="bag"><HugeiconsIcon icon={ShoppingBag01Icon} size={40} /></span>
			<h3>Your order is empty</h3>
			<p>Add a few dishes from the menu and they'll show up here.</p>
			<a class="btn primary" href="#menu" onclick={close}
				><HugeiconsIcon icon={Menu01Icon} size={18} /> Browse the menu</a
			>
		</div>
	{:else if step === 'cart'}
		<div class="body">
			{#if closed}<p class="closed" role="status">{closedNote}</p>{/if}
			<div class="receipt">
				{@render receiptHead()}
				<div class="r-row r-cols"><span>ITEM</span><span>AMOUNT</span></div>
				<hr />
				<ul class="r-lines">
					{#each lines as [item, q] (item.id)}
						<li>
							<div class="r-row"><span>{item.name}</span><span>{price(item.price * q)}</span></div>
							<div class="qty" role="group" aria-label="{item.name} quantity">
								<button
									type="button"
									onclick={() => add(item.id, -1)}
									aria-label="Remove one {item.name}">−</button
								>
								{#key q}<span>{q}</span>{/key}
								<button
									type="button"
									onclick={() => add(item.id)}
									aria-label="Add one more {item.name}">+</button
								>
								<small>× {price(item.price)}</small>
							</div>
						</li>
					{/each}
				</ul>
				<hr />
				<div class="r-row r-total"><span>SUBTOTAL ({count()})</span><span>{price(sub)}</span></div>
			</div>
		</div>
		<footer>
			{#if sub < restaurant.delivery.free_over}
				<p class="nudge">
					Add {price(restaurant.delivery.free_over - sub)} more for <strong>free delivery</strong>
				</p>
			{/if}
			<button
				class="btn primary wide"
				type="button"
				disabled={closed}
				onclick={() => (step = 'checkout')}
			>
				{closed ? 'Ordering is closed right now' : `Go to checkout · ${price(sub)}`}
				{#if !closed}<HugeiconsIcon icon={ArrowRight02Icon} size={18} />{/if}
			</button>
		</footer>
	{:else}
		<form class="body checkout" id="checkout" onsubmit={placeOrder}>
			{#if closed}<p class="closed" role="status">{closedNote}</p>{/if}
			<fieldset class="modes">
				<legend>How do you want it?</legend>
				<label class:on={mode === 'delivery'}>
					<input type="radio" bind:group={mode} value="delivery" />
					<HugeiconsIcon icon={MotorbikeIcon} size={24} />
					<span><strong>Delivery</strong><small>{restaurant.delivery.eta}</small></span>
				</label>
				<label class:on={mode === 'pickup'}>
					<input type="radio" bind:group={mode} value="pickup" />
					<HugeiconsIcon icon={Store01Icon} size={24} />
					<span><strong>Pickup</strong><small>Ready in {restaurant.pickup_eta}</small></span>
				</label>
			</fieldset>

			<label>
				Your name
				<input bind:value={name} autocomplete="name" maxlength="80" required />
			</label>
			<label>
				Mobile number
				<input
					type="tel"
					bind:value={phone}
					autocomplete="tel"
					inputmode="tel"
					placeholder="01XXXXXXXXX"
					pattern={'(\\+?880|0)[ -]?1[3-9]([ -]?[0-9]){8}'}
					title="A Bangladeshi mobile number, like 01712345678"
					required
				/>
			</label>
			{#if mode === 'delivery'}
				<label>
					Delivery address
					<textarea
						bind:value={address}
						rows="2"
						maxlength="300"
						autocomplete="street-address"
						placeholder="House, road, area and a landmark"
						required></textarea>
					<small>We deliver to {restaurant.delivery.areas}.</small>
				</label>
			{/if}
			<label>
				<span>Note for the kitchen <span class="opt">(optional)</span></span>
				<input bind:value={note} maxlength="300" placeholder="Less spicy, extra raita…" />
			</label>

			<fieldset>
				<legend>Payment</legend>
				<div class="pay">
					<HugeiconsIcon icon={Cash01Icon} size={24} />
					<span>
						<strong>{pay(mode)}</strong>
						<small>
							{mode === 'delivery'
								? 'Pay the rider in cash when your food arrives'
								: 'Pay in cash when you collect'}
						</small>
					</span>
				</div>
			</fieldset>

			<div class="receipt slim">
				<div class="r-row"><span>SUBTOTAL</span><span>{price(sub)}</span></div>
				{#if mode === 'delivery'}
					<div class="r-row"><span>DELIVERY</span><span>{fee ? price(fee) : 'FREE'}</span></div>
				{/if}
				{#if vat.vat}
					<div class="r-row">
						<span
							>VAT {vatPct(restaurant.vat.rate)}{restaurant.vat.inclusive
								? ' (INCLUDED)'
								: ''}</span
						><span>{price(vat.vat)}</span>
					</div>
				{/if}
				<hr />
				<div class="r-row r-total"><span>TOTAL</span><span>{price(total)}</span></div>
			</div>
		</form>
		<footer>
			{#if error}<p class="error" role="alert">{error}</p>{/if}
			<button class="btn primary wide" type="submit" form="checkout" disabled={busy || closed}>
				<HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} />
				{busy ? 'Placing your order…' : `Place order · ${price(total)}`}
			</button>
			<p class="fine">Nothing is charged online. You pay in cash.</p>
		</footer>
	{/if}
</dialog>

<!-- Print copy at the top of the page, so printing hides everything else outright. -->
{#if step === 'done' && order}
	<div class="cart-print" aria-hidden="true" use:portal>{@render orderReceipt(order)}</div>
{/if}

<style>
	dialog {
		position: fixed;
		inset: 0 0 0 auto;
		width: min(460px, 100%);
		max-width: none;
		height: 100dvh;
		max-height: none;
		margin: 0;
		padding: 0;
		border: 0;
		display: flex;
		flex-direction: column;
		background: var(--soft);
		color: var(--ink);
		transition:
			translate 0.35s cubic-bezier(0.2, 0.8, 0.2, 1),
			overlay 0.35s allow-discrete,
			display 0.35s allow-discrete;
	}
	dialog:not([open]) {
		display: none;
		translate: 100% 0;
	}
	@starting-style {
		dialog[open] {
			translate: 100% 0;
		}
	}
	dialog::backdrop {
		background: color-mix(in srgb, var(--brand) 55%, transparent);
		backdrop-filter: blur(3px);
		transition:
			opacity 0.35s,
			overlay 0.35s allow-discrete,
			display 0.35s allow-discrete;
	}
	@starting-style {
		dialog[open]::backdrop {
			opacity: 0;
		}
	}

	/* Black header bar, same as the site navbar. */
	header {
		display: flex;
		align-items: center;
		gap: 10px;
		margin: 12px;
		padding: 10px 10px 10px 20px;
		border-radius: 16px;
		background: var(--black);
		color: var(--cream);
	}
	header h2 {
		flex: 1;
		font-size: 1.875rem;
	}
	.icon-btn {
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		border: 0;
		border-radius: 10px;
		background: var(--cream);
		color: var(--brand);
		cursor: pointer;
		transition: rotate 0.2s;
	}
	.icon-btn:hover {
		rotate: -8deg;
	}
	.body {
		flex: 1;
		overflow-y: auto;
		margin: 0;
		padding: 8px 20px 24px;
	}
	footer {
		padding: 16px 20px calc(16px + env(safe-area-inset-bottom));
		background: var(--soft);
		box-shadow: 0 -2px 0 var(--black);
	}
	.wide {
		width: 100%;
	}

	/* Thermal-paper receipt with scalloped top and bottom edges. */
	.receipt {
		padding: 28px 20px;
		background: var(--cream);
		font-family: var(--display);
		font-size: 0.9375rem;
		line-height: 1.5;
		mask:
			radial-gradient(circle 6px at 50% 0, #0000 97%, #000) 50% 0 / 14px 51% repeat-x,
			radial-gradient(circle 6px at 50% 100%, #0000 97%, #000) 50% 100% / 14px 51% repeat-x;
	}
	.receipt.slim {
		padding: 22px 18px;
	}
	.r-head {
		display: grid;
		text-align: center;
		font-size: 0.8125rem;
		color: var(--muted);
		margin-bottom: 16px;
	}
	.r-brand {
		font-size: 2rem;
		font-weight: 800;
		font-stretch: 85%;
		line-height: 1;
		color: var(--brand);
		letter-spacing: 0.04em;
	}
	.r-row {
		display: flex;
		justify-content: space-between;
		gap: 12px;
	}
	.r-row > span:first-child {
		text-transform: uppercase;
		font-weight: 600;
	}
	.r-row span:last-child,
	.r-row strong {
		text-align: right;
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
	}
	.r-cols {
		font-size: 0.75rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		color: var(--muted);
	}
	.r-total {
		font-weight: 800;
		font-size: 1.25rem;
		font-stretch: 85%;
		color: var(--brand);
	}
	.r-total > span:first-child {
		font-weight: 800;
	}
	hr {
		border: 0;
		height: 2px;
		margin: 10px 0;
		background: radial-gradient(circle, var(--black) 1px, transparent 1.4px) 0 0 / 7px 2px repeat-x;
	}
	.r-lines {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 14px;
	}
	.qty {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-top: 6px;
	}
	.qty button {
		width: 32px;
		height: 32px;
		border: 0;
		border-radius: 8px;
		background: var(--black);
		color: var(--cream);
		font: 800 1.125rem var(--display);
		cursor: pointer;
		transition:
			background 0.15s,
			rotate 0.15s;
	}
	.qty button:hover {
		background: var(--brand);
		rotate: -6deg;
	}
	.qty span {
		min-width: 18px;
		text-align: center;
		font-weight: 800;
		animation: pop 0.2s ease-out;
	}
	.qty small {
		color: var(--muted);
	}
	.r-addr {
		margin: 6px 0 0;
		font-size: 0.875rem;
	}
	.stamp {
		display: block;
		width: fit-content;
		margin: 20px auto 16px;
		padding: 6px 16px;
		border: 4px double var(--brand);
		border-radius: 10px;
		color: var(--brand);
		font-weight: 800;
		font-stretch: 85%;
		font-size: 1.125rem;
		letter-spacing: 0.06em;
		rotate: -8deg;
		opacity: 0.9;
		animation: slam 0.4s 1.4s cubic-bezier(0.3, 1.6, 0.5, 1) both;
	}
	.barcode {
		height: 44px;
		margin: 8px 12px 6px;
		background: repeating-linear-gradient(
			90deg,
			var(--ink) 0 2px,
			transparent 2px 4px,
			var(--ink) 4px 7px,
			transparent 7px 8px,
			var(--ink) 8px 9px,
			transparent 9px 13px
		);
	}
	.r-thanks {
		margin: 8px 0 0;
		text-align: center;
		font-weight: 800;
		letter-spacing: 0.1em;
	}

	.closed {
		margin: 0 0 14px;
		padding: 14px 16px;
		border-radius: 12px;
		background: var(--black);
		color: var(--cream);
		font-weight: 600;
		line-height: 1.4;
	}
	.error {
		margin: 0 0 12px;
		padding: 12px 16px;
		border-radius: 12px;
		background: var(--brand);
		color: var(--cream);
		font-weight: 700;
	}
	.nudge {
		margin: 0 0 12px;
		padding: 10px 14px;
		border-radius: 12px;
		background: var(--black);
		color: var(--cream);
		font-size: 0.9375rem;
		font-weight: 600;
	}
	.nudge strong {
		color: var(--mustard);
		text-transform: uppercase;
	}

	.checkout {
		display: grid;
		align-content: start;
		gap: 18px;
	}
	fieldset {
		border: 0;
		margin: 0;
		padding: 0;
	}
	legend,
	label {
		font-weight: 800;
		font-stretch: 85%;
		font-size: 0.9375rem;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}
	legend {
		margin-bottom: 8px;
	}
	label {
		display: grid;
		gap: 6px;
	}
	.modes {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
	}
	.modes legend {
		grid-column: 1 / -1;
	}
	.modes label {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 14px;
		border-radius: 14px;
		background: var(--cream);
		box-shadow: inset 0 0 0 3px var(--black);
		cursor: pointer;
		transition:
			background 0.2s,
			color 0.2s,
			rotate 0.2s;
	}
	.modes label.on {
		background: var(--brand);
		color: var(--cream);
		box-shadow: none;
		rotate: -1.5deg;
	}
	.modes label.on small {
		color: var(--cream);
	}
	.modes input {
		position: absolute;
		opacity: 0;
	}
	.modes label:has(input:focus-visible) {
		outline: 2px solid var(--brand);
		outline-offset: 2px;
	}
	.modes span,
	.pay span {
		display: grid;
		line-height: 1.2;
	}
	.modes strong,
	.pay strong {
		font-size: 1.125rem;
	}
	small {
		color: var(--muted);
		font-weight: 600;
		text-transform: none;
		letter-spacing: 0;
		font-stretch: 100%;
	}
	.pay {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 16px;
		border-radius: 14px;
		background: var(--black);
		color: var(--mustard);
	}
	.pay strong {
		color: var(--cream);
		text-transform: uppercase;
		font-stretch: 85%;
	}
	.pay small {
		color: rgb(255 249 231 / 0.7);
	}
	.opt {
		color: var(--muted);
		font-weight: 600;
		text-transform: none;
	}
	input,
	textarea {
		width: 100%;
		min-height: 52px;
		padding: 12px 14px;
		border: 0;
		border-radius: 12px;
		background: var(--cream);
		box-shadow: inset 0 0 0 3px var(--black);
		color: var(--ink);
		font: 500 1rem var(--sans);
		text-transform: none;
		letter-spacing: 0;
		transition: box-shadow 0.15s;
	}
	input::placeholder,
	textarea::placeholder {
		color: rgb(0 0 0 / 0.35);
	}
	input:focus,
	textarea:focus {
		outline: 2px solid var(--brand);
		outline-offset: 2px;
		box-shadow: inset 0 0 0 1px #e2e8f0;
	}
	input:user-invalid,
	textarea:user-invalid {
		box-shadow: inset 0 0 0 3px var(--brand);
		background: var(--accent-soft);
	}
	.fine {
		margin: 10px 0 0;
		text-align: center;
		color: var(--muted);
		font-size: 0.8125rem;
		font-weight: 600;
	}

	.empty,
	.done {
		display: grid;
		justify-items: center;
		align-content: start;
		gap: 12px;
		text-align: center;
	}
	.empty {
		align-content: center;
	}
	.empty h3 {
		font-size: 2.25rem;
	}
	.empty p,
	.next {
		max-width: 36ch;
		margin: 0 0 8px;
		color: var(--muted);
	}
	.bag {
		display: grid;
		place-items: center;
		width: 104px;
		height: 104px;
		border-radius: 50%;
		background: var(--brand);
		color: var(--cream);
		rotate: -8deg;
	}

	.done-row {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}
	/* The receipt feeds out of a printer slot. */
	.printer {
		width: 100%;
		height: 16px;
		border-radius: 99px;
		background: var(--black);
		box-shadow: inset 0 -5px 0 var(--brand);
	}
	.print {
		width: calc(100% - 28px);
		margin-top: -8px;
		clip-path: inset(0 -40px -100vh);
		text-align: left;
	}
	.print .receipt {
		animation: feed 1.4s steps(14) both;
	}
	@keyframes feed {
		from {
			translate: 0 -100%;
		}
	}
	@keyframes slam {
		from {
			scale: 2.2;
			opacity: 0;
		}
	}
	@keyframes pop {
		from {
			scale: 0.6;
		}
	}
	.cart-print {
		display: none;
	}
	/* Only the receipt prints, black on white; the printer's paper setting sets the page. */
	@media print {
		@page {
			margin: 4mm;
		}
		:global(body > *:not(.cart-print)) {
			display: none !important;
		}
		:global(html),
		:global(body) {
			background: #fff !important;
		}
		.cart-print {
			display: block;
			width: 72mm;
		}
		.cart-print .receipt {
			margin: 0;
			padding: 0;
			box-shadow: none;
			background: #fff;
			color: #000;
			rotate: none;
			mask: none;
			-webkit-mask: none;
		}
		.cart-print .barcode {
			display: none;
		}
	}
</style>

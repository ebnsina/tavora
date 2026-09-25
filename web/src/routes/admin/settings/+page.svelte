<script lang="ts">
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		Clock01Icon,
		FloppyDiskIcon,
		Invoice03Icon,
		PaintBoardIcon,
		Store01Icon
	} from '@hugeicons/core-free-icons';
	import { enhance } from '$app/forms';
	import PageHeader from '$lib/admin/PageHeader.svelte';
	import TimePicker from '$lib/admin/TimePicker.svelte';
	import ColorPicker from '$lib/admin/ColorPicker.svelte';
	import Tabs from '$lib/admin/Tabs.svelte';

	let { data, form } = $props();
	const r = $derived(data.r);
	const fields = $derived((form && 'fields' in form ? form.fields : {}) as Record<string, string>);

	// Saturday first, the way the week runs in Bangladesh.
	const week = [6, 0, 1, 2, 3, 4, 5];
	const dayName = (d: number) =>
		new Intl.DateTimeFormat('en-GB', { weekday: 'long' }).format(new Date(2024, 0, 7 + d));
	// svelte-ignore state_referenced_locally
	let open = $state(Object.fromEntries(week.map((d) => [d, r.hours.some((h) => h.weekday === d)])));
	const hoursFor = (d: number) => r.hours.find((h) => h.weekday === d);
	// The phone is stored as +8801…; the form shows the local 01… form.
	const local = (p: string) => p.replace(/^\+?88/, '');
	let tab = $state('hours');
	let colorOk = $state(true);
	// svelte-ignore state_referenced_locally
	let color = $state(r.theme);
	const keep =
		() =>
		async ({ update }: { update: (o?: { reset?: boolean }) => Promise<void> }) =>
			update({ reset: false });
</script>

{#snippet err(path: string)}
	{#if fields[path]}<span class="field-error">{fields[path]}</span>{/if}
{/snippet}

<PageHeader
	title="Hours & details"
	sub="When you're open, how to reach you, and how delivery works"
>
	{#snippet actions()}
		{#if form?.error}<p class="flash bad" role="alert">{form.error}</p>{/if}
		{#if form?.ok}<p class="flash" role="status">{form.ok}</p>{/if}
	{/snippet}
</PageHeader>

<Tabs
	label="Settings"
	bind:active={tab}
	tabs={[
		{ id: 'hours', label: 'Opening hours', icon: Clock01Icon },
		{ id: 'info', label: 'Details & delivery', icon: Store01Icon },
		{ id: 'vat', label: 'VAT', icon: Invoice03Icon },
		{ id: 'theme', label: 'Brand colour', icon: PaintBoardIcon }
	]}
/>

<div class="layout">
	<form
		hidden={tab !== 'hours'}
		id="panel-hours"
		aria-labelledby="tab-hours"
		method="POST"
		action="?/hours"
		use:enhance={keep}
		class="card"
	>
		<div class="card-head">
			<div>
				<h2>Opening hours</h2>
				<p class="hint">Online orders and bookings are only accepted while you're open.</p>
			</div>
			<button class="btn primary small"
				><HugeiconsIcon icon={FloppyDiskIcon} size={16} /> Save hours</button
			>
		</div>
		<ul class="hours">
			{#each week as d (d)}
				{@const h = hoursFor(d)}
				<li>
					<label class="check day">
						<input class="switch" type="checkbox" name="open_{d}" bind:checked={open[d]} />
						{dayName(d)}
					</label>
					{#if open[d]}
						<TimePicker name="opens_{d}" value={h?.opens ?? '12:00'} label="{dayName(d)} opens" />
						<span class="to" aria-hidden="true">to</span>
						<TimePicker
							name="closes_{d}"
							value={h?.closes ?? '23:00'}
							label="{dayName(d)} closes"
						/>
					{:else}
						<span class="closed">Closed</span>
					{/if}
					{@render err(String(d))}
				</li>
			{/each}
		</ul>
	</form>

	<form
		hidden={tab !== 'info'}
		id="panel-info"
		aria-labelledby="tab-info"
		method="POST"
		action="?/info"
		use:enhance={keep}
		class="card"
	>
		<div class="card-head">
			<h2>Restaurant details</h2>
			<button class="btn primary small"
				><HugeiconsIcon icon={FloppyDiskIcon} size={16} /> Save details</button
			>
		</div>
		<div class="stack">
			<div class="grid2">
				<label
					>Name <input name="name" value={r.name} maxlength="40" required />{@render err(
						'name'
					)}</label
				>
				<label
					>Area <input name="area" value={r.area} maxlength="60" required />{@render err(
						'area'
					)}</label
				>
			</div>
			<label
				>Address <input name="address" value={r.address} maxlength="200" required />{@render err(
					'address'
				)}</label
			>
			<div class="grid2">
				<label
					>Phone <input name="phone" type="tel" value={local(r.phone)} required />{@render err(
						'phone'
					)}</label
				>
				<label
					>WhatsApp number <input
						name="whatsapp"
						type="tel"
						value={local(r.whatsapp)}
						required
					/>{@render err('whatsapp')}</label
				>
			</div>
			<label
				>Email <input name="email" type="email" value={r.email} required />{@render err(
					'email'
				)}</label
			>

			<h3>Delivery</h3>
			<div class="grid2">
				<label
					>Delivery fee (৳) <input
						name="delivery_fee"
						type="number"
						min="0"
						step="1"
						value={r.delivery.fee / 100}
						required
					/>{@render err('delivery_fee')}</label
				>
				<label>
					Free delivery from (৳)
					<input
						name="free_delivery_over"
						type="number"
						min="0"
						step="1"
						value={r.delivery.free_over / 100}
						required
					/>
					<span class="hint">Orders at or above this amount deliver free.</span>
					{@render err('free_delivery_over')}
				</label>
			</div>
			<label
				>Areas you deliver to <input
					name="delivery_areas"
					value={r.delivery.areas}
					maxlength="200"
					required
				/>{@render err('delivery_areas')}</label
			>
			<div class="grid2">
				<label
					>Delivery time <input
						name="delivery_eta"
						value={r.delivery.eta}
						placeholder="45–60 min"
						maxlength="20"
						required
					/>{@render err('delivery_eta')}</label
				>
				<label
					>Pickup time <input
						name="pickup_eta"
						value={r.pickup_eta}
						placeholder="20–30 min"
						maxlength="20"
						required
					/>{@render err('pickup_eta')}</label
				>
			</div>
		</div>
	</form>

	<form
		hidden={tab !== 'theme'}
		id="panel-theme"
		aria-labelledby="tab-theme"
		method="POST"
		action="?/theme"
		use:enhance={keep}
		class="card"
	>
		<div class="card-head">
			<h2>Brand colour</h2>
			<button class="btn primary small" disabled={!colorOk}
				><HugeiconsIcon icon={FloppyDiskIcon} size={16} /> Save colour</button
			>
		</div>
		<p class="hint">
			Used for buttons, highlights and the website. Pick a swatch or your own colour.
		</p>
		<ColorPicker name="color" bind:value={color} bind:ok={colorOk} />
		{@render err('color')}
	</form>

	<form
		hidden={tab !== 'vat'}
		id="panel-vat"
		aria-labelledby="tab-vat"
		method="POST"
		action="?/vat"
		use:enhance={keep}
		class="card"
	>
		<div class="card-head">
			<h2>VAT</h2>
			<button class="btn primary small"
				><HugeiconsIcon icon={FloppyDiskIcon} size={16} /> Save VAT</button
			>
		</div>
		<div class="stack">
			<p class="hint">
				Leave the rate at 0 if you're not VAT-registered. Ask your accountant for your rate; it
				depends on your kind of restaurant. Changes apply to new bills only; old bills keep the VAT
				they were made with.
			</p>
			<div class="grid2">
				<label
					>VAT rate (%) <input
						name="rate"
						type="number"
						min="0"
						max="30"
						step="0.5"
						value={r.vat.rate / 100}
						required
					/>{@render err('rate')}</label
				>
				<label
					>BIN (VAT registration number) <input
						name="bin"
						value={r.vat.bin}
						maxlength="20"
						inputmode="numeric"
						placeholder="e.g. 000123456-0101"
					/>
					<span class="hint">With a BIN, bills print as a Mushak-6.3 VAT invoice.</span>
					{@render err('bin')}</label
				>
			</div>
			<fieldset class="prices">
				<legend>Your menu prices</legend>
				<label class="radio"
					><input type="radio" name="inclusive" value="yes" checked={r.vat.inclusive} /> Already include
					VAT (customers pay the menu price)</label
				>
				<label class="radio"
					><input type="radio" name="inclusive" value="no" checked={!r.vat.inclusive} /> Don't include
					VAT (VAT is added on top of the bill)</label
				>
			</fieldset>
		</div>
	</form>
</div>

<style>
	.prices {
		display: grid;
		gap: 8px;
		margin: 0;
		padding: 0;
		border: 0;
	}
	.prices legend {
		margin-bottom: 6px;
		font-weight: 600;
		font-size: 0.875rem;
	}
	.radio {
		display: flex !important;
		align-items: center;
		gap: 10px;
		font-weight: 500 !important;
	}
	.layout {
		display: grid;
		gap: 16px;
		max-width: 860px;
	}
	.card-head .hint {
		margin: 4px 0 0;
	}
	h3 {
		margin: 8px 0 0;
		font-size: 1rem;
	}
	.hours {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
	}
	.hours li {
		display: grid;
		grid-template-columns: 150px 1fr auto 1fr;
		align-items: center;
		gap: 10px;
		padding: 8px 0;
		border-top: 1px solid var(--line);
	}
	.hours li:first-child {
		border-top: 0;
	}
	.day {
		font-weight: 600;
	}
	.to {
		color: var(--muted);
		font-size: 0.875rem;
	}
	.closed {
		grid-column: 2 / -1;
		color: var(--muted);
		font-weight: 600;
	}
	.hours .field-error {
		grid-column: 1 / -1;
	}
	@media (min-width: 1200px) {
	}
	@media (max-width: 520px) {
		.hours li {
			grid-template-columns: 1fr auto 1fr;
		}
		.day {
			grid-column: 1 / -1;
		}
	}
</style>

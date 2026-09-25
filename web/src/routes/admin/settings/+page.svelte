<script lang="ts">
	import { enhance } from '$app/forms';
	import PageHeader from '$lib/admin/PageHeader.svelte';
	import TimePicker from '$lib/admin/TimePicker.svelte';

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

<div class="layout">
	<form method="POST" action="?/hours" use:enhance={keep} class="card">
		<div class="card-head">
			<div>
				<h2>Opening hours</h2>
				<p class="hint">Online orders and bookings are only accepted while you're open.</p>
			</div>
			<button class="btn primary small">Save hours</button>
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

	<form method="POST" action="?/info" use:enhance={keep} class="card">
		<div class="card-head">
			<h2>Restaurant details</h2>
			<button class="btn primary small">Save details</button>
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
</div>

<style>
	.layout {
		display: grid;
		gap: 16px;
		align-items: start;
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
		.layout {
			grid-template-columns: 1fr 1fr;
		}
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

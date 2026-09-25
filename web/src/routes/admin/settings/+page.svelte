<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();
	const r = $derived(data.r);
	const fields = $derived((form && 'fields' in form ? form.fields : {}) as Record<string, string>);

	// Saturday first, the way the week runs in Bangladesh.
	const week = [6, 0, 1, 2, 3, 4, 5];
	const dayName = (d: number) =>
		new Intl.DateTimeFormat('en-GB', { weekday: 'long' }).format(new Date(2024, 0, 7 + d));
	const hoursFor = (d: number) => r.hours.find((h) => h.weekday === d);
	// The phone is stored as +8801…; the form shows the local 01… form.
	const local = (p: string) => p.replace(/^\+?88/, '');
</script>

{#snippet err(path: string)}
	{#if fields[path]}<span class="field-error">{fields[path]}</span>{/if}
{/snippet}

<h1>Hours & details</h1>
{#if form?.error}<p class="flash bad" role="alert">{form.error}</p>{/if}
{#if form?.ok}<p class="flash" role="status">{form.ok}</p>{/if}

<div class="stack">
	<form
		method="POST"
		action="?/hours"
		use:enhance={() =>
			async ({ update }) =>
				update({ reset: false })}
		class="card stack"
	>
		<h2>Opening hours</h2>
		<p class="hint">Online orders and table bookings are only accepted while you're open.</p>
		<ul class="hours">
			{#each week as d (d)}
				{@const h = hoursFor(d)}
				<li>
					<label class="day"
						><input type="checkbox" name="open_{d}" checked={!!h} /> {dayName(d)}</label
					>
					<label>Opens <input type="time" name="opens_{d}" value={h?.opens ?? '12:00'} /></label>
					<label>Closes <input type="time" name="closes_{d}" value={h?.closes ?? '23:00'} /></label>
					{@render err(String(d))}
				</li>
			{/each}
		</ul>
		<button class="btn primary">Save hours</button>
	</form>

	<form
		method="POST"
		action="?/info"
		use:enhance={() =>
			async ({ update }) =>
				update({ reset: false })}
		class="card stack"
	>
		<h2>Restaurant details</h2>
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
			<label class="wide"
				>Address <input name="address" value={r.address} maxlength="200" required />{@render err(
					'address'
				)}</label
			>
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
			<label class="wide"
				>Email <input name="email" type="email" value={r.email} required />{@render err(
					'email'
				)}</label
			>
		</div>
		<h2>Delivery</h2>
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
			<label class="wide"
				>Areas you deliver to <input
					name="delivery_areas"
					value={r.delivery.areas}
					maxlength="200"
					required
				/>{@render err('delivery_areas')}</label
			>
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
		<button class="btn primary">Save details</button>
	</form>
</div>

<style>
	.hours {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 10px;
	}
	.hours li {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
		align-items: end;
	}
	.day {
		grid-column: 1 / -1;
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 1rem;
	}
	form > .btn {
		justify-self: start;
	}
	@media (min-width: 720px) {
		.hours li {
			grid-template-columns: 180px 160px 160px;
		}
		.day {
			grid-column: auto;
		}
		.wide {
			grid-column: 1 / -1;
		}
	}
</style>

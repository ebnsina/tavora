<script lang="ts">
	import { enhance } from '$app/forms';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		ArrowLeft02Icon,
		ArrowRight02Icon,
		ArrowUpRight01Icon,
		Cancel01Icon,
		Tick02Icon
	} from '@hugeicons/core-free-icons';
	import PageHeader from '$lib/admin/PageHeader.svelte';
	import { price, time } from '$lib/api';

	let { data, form } = $props();
	const b = $derived(data.booking);

	const labels: Record<string, string> = {
		requested: 'Waiting',
		confirmed: 'Confirmed',
		declined: 'Declined',
		cancelled: 'Cancelled'
	};
	const day = new Intl.DateTimeFormat('en-GB', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	});
	const short = new Intl.DateTimeFormat('en-GB', {
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	});
	const stampDay = new Intl.DateTimeFormat('en-GB', {
		day: 'numeric',
		month: 'short',
		timeZone: 'Asia/Dhaka'
	});
	const stampTime = new Intl.DateTimeFormat('en-US', {
		hour: 'numeric',
		minute: '2-digit',
		timeZone: 'Asia/Dhaka'
	});
	const stamp = (d: Date) => `${stampDay.format(d)}, ${stampTime.format(d)}`;
	const date = (iso: string) => new Date(`${iso}T00:00`);
	const visits = $derived(b.history.filter((h) => h.status === 'confirmed').length);
</script>

<svelte:head><title>Booking · {b.name} · Tavora</title></svelte:head>

<PageHeader title={b.name} sub="{day.format(date(b.date))} at {time(b.time)}">
	{#snippet actions()}
		<a class="btn ghost small" href="/admin/bookings"
			><HugeiconsIcon icon={ArrowLeft02Icon} size={16} /> All bookings</a
		>
		<form method="POST" action="?/status" use:enhance class="row">
			{#if b.status !== 'confirmed'}
				<button class="btn primary small" name="status" value="confirmed"
					><HugeiconsIcon icon={Tick02Icon} size={16} /> Confirm</button
				>
			{/if}
			{#if b.status === 'requested'}
				<button class="btn ghost small" name="status" value="declined"
					><HugeiconsIcon icon={Cancel01Icon} size={16} /> Decline</button
				>
			{:else if b.status === 'confirmed'}
				<button class="btn ghost small" name="status" value="cancelled"
					><HugeiconsIcon icon={Cancel01Icon} size={16} /> Cancel</button
				>
			{/if}
		</form>
	{/snippet}
</PageHeader>

{#if form?.error}<p class="flash bad" role="alert">{form.error}</p>{/if}
{#if form?.ok}<p class="flash" role="status">{form.ok}</p>{/if}

<div class="layout">
	<section class="card">
		<h2>Booking</h2>
		<dl>
			<dt>Status</dt>
			<dd><span class="badge {b.status}">{labels[b.status]}</span></dd>
			<dt>When</dt>
			<dd>{day.format(date(b.date))}, {time(b.time)}</dd>
			<dt>Guests</dt>
			<dd>{b.guests} {b.guests === 1 ? 'person' : 'people'}</dd>
			<dt>Phone</dt>
			<dd>
				<a href="tel:{b.phone}">{b.phone}</a> ·
				<a href="https://wa.me/88{b.phone}" target="_blank" rel="noopener"
					>WhatsApp <HugeiconsIcon icon={ArrowUpRight01Icon} size={14} /></a
				>
			</dd>
			<dt>Note</dt>
			<dd>{b.note || '—'}</dd>
			<dt>Booked</dt>
			<dd>{stamp(new Date(b.created_at))}</dd>
		</dl>
	</section>

	<section class="card">
		<h2>This guest</h2>
		<dl>
			<dt>Other bookings</dt>
			<dd>
				{b.history.length ? `${b.history.length} (${visits} confirmed)` : 'First booking'}
			</dd>
			<dt>Orders</dt>
			<dd>
				{b.orders.count ? `${b.orders.count} · ${price(b.orders.spent)} spent` : 'None yet'}
			</dd>
			{#if b.orders.last_at}
				<dt>Last order</dt>
				<dd>{short.format(new Date(b.orders.last_at))}</dd>
			{/if}
		</dl>
		{#if b.history.length}
			<h3>Earlier and later bookings</h3>
			<ul class="history">
				{#each b.history as h (h.id)}
					<li>
						<a href="/admin/bookings/{h.id}">{short.format(date(h.date))}, {time(h.time)}</a>
						<span>{h.guests} people · {labels[h.status]}</span>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>

<style>
	.layout {
		display: grid;
		gap: 16px;
		align-items: start;
	}
	@media (min-width: 900px) {
		.layout {
			grid-template-columns: 1fr 1fr;
		}
	}
	h2 {
		margin: 0 0 12px;
		font-size: 1.25rem;
	}
	h3 {
		margin: 20px 0 8px;
		font-size: 0.9375rem;
	}
	dl {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 10px 16px;
		margin: 0;
	}
	dt {
		color: var(--muted);
	}
	dd {
		margin: 0;
		font-weight: 600;
	}
	.history {
		display: grid;
		gap: 8px;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.history li {
		display: flex;
		justify-content: space-between;
		gap: 12px;
	}
	.history span {
		color: var(--muted);
	}
	.badge {
		padding: 3px 10px;
		border-radius: 999px;
		background: var(--soft);
		font-size: 0.8125rem;
	}
	.badge.requested {
		background: var(--mustard);
	}
	.badge.confirmed {
		background: #e6f4ea;
	}
	.badge.declined,
	.badge.cancelled {
		background: #fde4e1;
	}
</style>

<script lang="ts">
	import { enhance } from '$app/forms';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		Call02Icon,
		Cancel01Icon,
		Note01Icon,
		Tick02Icon,
		UserGroupIcon,
		WhatsappIcon
	} from '@hugeicons/core-free-icons';
	import PageHeader from '$lib/admin/PageHeader.svelte';
	import { time, type Reservation } from '$lib/api';

	let { data, form } = $props();

	const month = new Intl.DateTimeFormat('en-GB', { month: 'short' });
	const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'short' });
	const bdDay = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });
	const today = bdDay(new Date());
	const tomorrow = bdDay(new Date(Date.now() + 86_400_000));
	const cal = (iso: string) => {
		const d = new Date(`${iso}T00:00`);
		return {
			month: month.format(d),
			day: d.getDate(),
			label: iso === today ? 'Today' : iso === tomorrow ? 'Tomorrow' : weekday.format(d)
		};
	};
	const labels: Record<string, string> = {
		requested: 'Waiting',
		confirmed: 'Confirmed',
		declined: 'Declined',
		cancelled: 'Cancelled'
	};
	// WhatsApp needs the number in international form without "+".
	const wa = (phone: string) => `https://wa.me/88${phone}`;
</script>

<PageHeader title="Table bookings" sub="Today onwards, plus anything still waiting for a reply" />
{#if form?.error}<p class="flash bad" role="alert">{form.error}</p>{/if}

{#if !data.bookings.length}
	<p class="card empty">No upcoming bookings.</p>
{/if}

<ul class="list">
	{#each data.bookings as b (b.id)}
		{@const c = cal(b.date)}
		<li class="card" class:waiting={b.status === 'requested'}>
			<div class="top">
				<div class="date" class:today={c.label === 'Today'} aria-hidden="true">
					<div class="cal">
						<strong>{c.day}</strong>
						<span class="m">{c.month}</span>
					</div>
					<span class="w">{c.label}</span>
				</div>
				<div class="when">
					<strong class="time">{time(b.time)}</strong>
					<span class="guests"
						><HugeiconsIcon icon={UserGroupIcon} size={16} />
						{b.guests}
						{b.guests === 1 ? 'person' : 'people'}</span
					>
				</div>
				<span class="badge {b.status}">{labels[b.status]}</span>
			</div>

			<div class="who">
				<strong>{b.name}</strong>
				<div class="contact">
					<a href="tel:{b.phone}"><HugeiconsIcon icon={Call02Icon} size={16} /> {b.phone}</a>
					<a href={wa(b.phone)} target="_blank" rel="noopener"
						><HugeiconsIcon icon={WhatsappIcon} size={16} /> WhatsApp<span class="sr">
							(opens in a new tab)</span
						></a
					>
				</div>
			</div>
			{#if b.note}<p class="note"><HugeiconsIcon icon={Note01Icon} size={16} /> {b.note}</p>{/if}

			<form method="POST" action="?/status" use:enhance class="acts">
				<input type="hidden" name="id" value={b.id} />
				<a
					class="btn quiet small"
					class:grow={b.status === 'confirmed'}
					href="/admin/bookings/{b.id}">Details</a
				>
				{#if b.status !== 'confirmed'}
					<button class="btn primary small grow" name="status" value="confirmed"
						><HugeiconsIcon icon={Tick02Icon} size={16} /> Confirm</button
					>
				{/if}
				{#if b.status === 'requested'}
					<button
						class="btn quiet small icon"
						name="status"
						value="declined"
						aria-label="Decline booking for {b.name}"
						title="Decline"><HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={2} /></button
					>
				{:else if b.status === 'confirmed'}
					<button
						class="btn quiet small icon"
						name="status"
						value="cancelled"
						aria-label="Cancel booking for {b.name}"
						title="Cancel booking"
						><HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={2} /></button
					>
				{/if}
			</form>
		</li>
	{/each}
</ul>

<style>
	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
	}
	.list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(320px, 100%), 1fr));
		gap: 14px;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.list > li {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	/* Waiting for a reply: a thin tinted outline around the whole card, plus the badge. */
	.waiting {
		box-shadow: 0 0 0 1px color-mix(in srgb, var(--mustard) 70%, transparent);
	}
	.top {
		display: flex;
		align-items: center;
		gap: 14px;
	}
	/* The date: day and month in a small tile, the weekday underneath it. */
	.date {
		display: grid;
		flex: none;
		justify-items: center;
		gap: 4px;
	}
	.cal {
		display: grid;
		gap: 3px;
		width: 52px;
		padding: 8px 0 7px;
		border-radius: 10px;
		background: #fffdf6;
		box-shadow: inset 0 0 0 1px var(--line);
		text-align: center;
		line-height: 1;
	}
	.cal strong {
		font: 700 1.375rem var(--sans);
		font-variant-numeric: tabular-nums;
		letter-spacing: -0.02em;
	}
	.cal .m {
		color: var(--brand);
		font-size: 0.625rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
	.w {
		color: var(--muted);
		font-size: 0.6875rem;
		font-weight: 600;
		line-height: 1;
	}
	.today .cal {
		background: var(--accent-soft);
		box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--brand) 35%, transparent);
	}
	.today .w {
		color: var(--brand);
	}
	.when {
		display: grid;
		gap: 4px;
	}
	.time {
		font: 800 1.5rem var(--display);
		line-height: 1;
	}
	.guests {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		color: var(--muted);
		font-size: 0.875rem;
		font-weight: 600;
	}
	.badge {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		align-self: flex-start;
		margin-left: auto;
		padding: 4px 10px;
		border-radius: 999px;
		background: var(--soft);
		color: var(--muted);
		font-size: 0.75rem;
		font-weight: 700;
	}
	.badge.requested {
		background: #fff1c2;
		color: #7a5a00;
	}
	.badge.requested::before {
		content: '';
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--mustard);
		animation: pulse 1.6s ease-in-out infinite;
	}
	.badge.confirmed {
		background: #e3f6ec;
		color: #1f7a45;
	}
	@keyframes pulse {
		50% {
			opacity: 0.35;
		}
	}
	.who {
		display: grid;
		gap: 6px;
	}
	.who strong {
		font-size: 1.0625rem;
		font-weight: 600;
	}
	.contact {
		display: flex;
		flex-wrap: wrap;
		gap: 6px 16px;
	}
	.contact a {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		color: var(--muted);
		font-size: 0.875rem;
		font-weight: 500;
		text-decoration: none;
	}
	.contact a:hover {
		color: var(--brand);
	}
	.note {
		display: flex;
		gap: 8px;
		margin: 0;
		padding: 10px 12px;
		border-radius: 10px;
		background: #fff6d6;
		font-size: 0.9375rem;
	}
	.note :global(svg) {
		flex: none;
		margin-top: 3px;
		color: #9a6b00;
	}
	/* Actions always sit at the bottom, on one line. */
	.acts {
		display: flex;
		gap: 8px;
		margin-top: auto;
		padding-top: 16px;
		border-top: 1px solid var(--line);
	}
	.acts .grow {
		flex: 1;
	}
	.acts .btn.icon {
		flex: none;
		width: 38px;
		padding: 0;
	}
	@media (prefers-reduced-motion: reduce) {
		.badge.requested::before {
			animation: none;
		}
	}
</style>

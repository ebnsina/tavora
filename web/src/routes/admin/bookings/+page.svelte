<script lang="ts">
	import { enhance } from '$app/forms';
	import { time, type Reservation } from '$lib/api';

	let { data, form } = $props();

	const day = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
	const byDay = $derived(
		Object.entries(
			Object.groupBy(data.bookings, (b: Reservation) => b.date) as Record<string, Reservation[]>
		)
	);
	const labels: Record<string, string> = {
		requested: 'Waiting',
		confirmed: 'Confirmed',
		declined: 'Declined',
		cancelled: 'Cancelled'
	};
	// WhatsApp needs the number in international form without "+".
	const wa = (phone: string) => `https://wa.me/88${phone}`;
</script>

<h1>Table bookings</h1>
{#if form?.error}<p class="flash bad" role="alert">{form.error}</p>{/if}

{#if !data.bookings.length}
	<p class="card empty">No upcoming bookings.</p>
{/if}

{#each byDay as [date, list] (date)}
	<h2>{day.format(new Date(`${date}T00:00`))}</h2>
	<ul class="list">
		{#each list as b (b.id)}
			<li class="card" class:waiting={b.status === 'requested'}>
				<div class="time">{time(b.time)}</div>
				<div class="info">
					<strong>{b.name}</strong> · {b.guests}
					{b.guests === 1 ? 'person' : 'people'}
					<br /><a href="tel:{b.phone}">{b.phone}</a> ·
					<a href={wa(b.phone)} target="_blank" rel="noopener">WhatsApp</a>
					{#if b.note}<p class="note">{b.note}</p>{/if}
				</div>
				<div class="side">
					<span class="badge {b.status}">{labels[b.status]}</span>
					<form method="POST" action="?/status" use:enhance class="row">
						<input type="hidden" name="id" value={b.id} />
						{#if b.status !== 'confirmed'}
							<button class="btn primary small" name="status" value="confirmed">Confirm</button>
						{/if}
						{#if b.status === 'requested'}
							<button class="btn ghost small" name="status" value="declined">Decline</button>
						{:else if b.status === 'confirmed'}
							<button class="btn ghost small" name="status" value="cancelled">Cancel</button>
						{/if}
					</form>
				</div>
			</li>
		{/each}
	</ul>
{/each}

<style>
	h2 {
		margin-top: 24px;
	}
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 10px;
	}
	.list li {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 16px;
		align-items: start;
	}
	.waiting {
		box-shadow: inset 0 0 0 3px var(--brand);
	}
	.time {
		font: 800 1.5rem var(--display);
		min-width: 90px;
	}
	.note {
		margin: 8px 0 0;
		padding: 6px 10px;
		border-radius: 8px;
		background: #fff4cf;
		font-size: 0.9375rem;
	}
	.side {
		grid-column: 1 / -1;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 10px;
	}
	.badge {
		padding: 3px 10px;
		border-radius: 999px;
		background: var(--soft);
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
	}
	.badge.requested {
		background: var(--brand);
		color: var(--cream);
	}
	.badge.confirmed {
		background: var(--green);
		color: #fff;
	}
	@media (min-width: 760px) {
		.list li {
			grid-template-columns: auto 1fr auto;
		}
		.side {
			grid-column: auto;
			justify-content: flex-end;
		}
	}
</style>

<script lang="ts">
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { Call02Icon, Calendar03Icon, WhatsappIcon } from '@hugeicons/core-free-icons';
	import { api, message, time, type Reservation, type Restaurant } from '$lib/api';

	let { restaurant }: { restaurant: Restaurant } = $props();

	const bdNow = (opts: Intl.DateTimeFormatOptions) =>
		new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka', hourCycle: 'h23', ...opts }).format(
			new Date()
		);
	const toMin = (t: string) => +t.slice(0, 2) * 60 + +t.slice(3);
	const toTime = (m: number) =>
		`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
	const shortDate = new Intl.DateTimeFormat('en-GB', {
		weekday: 'short',
		day: 'numeric',
		month: 'short'
	});

	let today = $state('');
	let date = $state('');
	let slot = $state('');
	let guests = $state('2');
	let name = $state('');
	let phone = $state('');
	let note = $state('');
	let busy = $state(false);
	let error = $state('');
	let booked = $state<Reservation | null>(null);
	// One id per booking attempt, so a retried submit never books twice.
	let bookingId = crypto.randomUUID();

	$effect(() => {
		today = bdNow({ year: 'numeric', month: '2-digit', day: '2-digit' });
	});

	// Last booking is an hour before closing; past slots are hidden for today.
	const slots = $derived.by(() => {
		if (!date) return [];
		const hours = restaurant.hours.find((h) => h.weekday === new Date(`${date}T00:00`).getDay());
		if (!hours) return [];
		const now = date === today ? toMin(bdNow({ hour: '2-digit', minute: '2-digit' })) : -1;
		const out: string[] = [];
		for (let m = toMin(hours.opens); m <= toMin(hours.closes) - 60; m += 30)
			if (m > now) out.push(toTime(m));
		return out;
	});

	$effect(() => {
		if (!slots.includes(slot)) slot = '';
	});

	const whatsapp = $derived(
		booked
			? `https://wa.me/${restaurant.whatsapp}?text=${encodeURIComponent(
					`Table booking for ${booked.name} · ${booked.guests} people · ${shortDate.format(new Date(`${booked.date}T00:00`))} at ${time(booked.time)} · ${booked.phone}`
				)}`
			: ''
	);

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		busy = true;
		error = '';
		try {
			booked = await api<Reservation>('/v1/reservations', {
				method: 'POST',
				body: JSON.stringify({
					id: bookingId,
					name,
					phone,
					guests: +guests,
					date,
					time: slot,
					note
				})
			});
			bookingId = crypto.randomUUID();
		} catch (err) {
			error = message(err);
		} finally {
			busy = false;
		}
	}
</script>

{#if booked}
	<div class="done" role="status">
		<div class="ticket">
			<p class="t-top">{restaurant.name.toUpperCase()} · TABLE REQUEST</p>
			<p class="t-name">{booked.name}</p>
			<div class="t-grid">
				<span>DATE<strong>{shortDate.format(new Date(`${booked.date}T00:00`))}</strong></span>
				<span>TIME<strong>{time(booked.time)}</strong></span>
				<span>GUESTS<strong>{booked.guests}</strong></span>
			</div>
			<p class="t-stub">We'll confirm by phone or WhatsApp</p>
		</div>
		<h3>Got it, {booked.name.split(' ')[0]}!</h3>
		<p>
			Your table request is in. We'll call or message <strong>{booked.phone}</strong> to confirm. Want
			it faster? Ping us on WhatsApp.
		</p>
		<a class="btn primary" href={whatsapp} target="_blank" rel="noopener">
			<HugeiconsIcon icon={WhatsappIcon} size={20} />
			Message us on WhatsApp
		</a>
		<button class="link" type="button" onclick={() => (booked = null)}>Book another table</button>
	</div>
{:else}
	<form onsubmit={submit}>
		<p class="madlib">
			Hi! My name is
			<input
				class="blank"
				style="--w: 9ch"
				bind:value={name}
				autocomplete="name"
				placeholder="your name"
				aria-label="Your name"
				required
			/>
			and I'd like a table for
			<select class="blank" bind:value={guests} aria-label="Number of guests">
				{#each Array.from({ length: 12 }, (_, i) => String(i + 1)) as g (g)}
					<option value={g}>{g} {g === '1' ? 'person' : 'people'}</option>
				{/each}
			</select>
			on
			<input class="blank" type="date" bind:value={date} min={today} aria-label="Date" required />
			at
			<select class="blank" bind:value={slot} aria-label="Time" required disabled={!slots.length}>
				<option value="" disabled
					>{date ? (slots.length ? 'what time?' : 'no times left') : 'pick a date first'}</option
				>
				{#each slots as s (s)}<option value={s}>{time(s)}</option>{/each}
			</select>. You can reach me on
			<input
				class="blank"
				style="--w: 11ch"
				type="tel"
				bind:value={phone}
				autocomplete="tel"
				inputmode="tel"
				placeholder="01XXXXXXXXX"
				pattern={'(\\+?880|0)[ -]?1[3-9]([ -]?[0-9]){8}'}
				title="A Bangladeshi mobile number, like 01712345678"
				aria-label="Mobile number"
				required
			/>. Oh, and
			<input
				class="blank note"
				style="--w: 16ch"
				bind:value={note}
				placeholder="anything else? (optional)"
				aria-label="Anything we should know (optional)"
			/>
		</p>
		{#if error}<p class="error" role="alert">{error}</p>{/if}
		<div class="foot">
			<p class="alt">
				More than 12 guests or prefer to talk?<br />
				<a href="tel:{restaurant.phone}"
					><HugeiconsIcon icon={Call02Icon} size={16} /> Call {restaurant.phone}</a
				>
			</p>
			<button class="btn primary" type="submit" disabled={busy}>
				<HugeiconsIcon icon={Calendar03Icon} size={20} />
				{busy ? 'Booking…' : 'Book my table'}
			</button>
		</div>
	</form>
{/if}

<style>
	/* The form reads as a sentence; each field is a fill-in blank. */
	.madlib {
		margin: 0;
		font-size: clamp(1.25rem, 2.6vw, 1.75rem);
		font-weight: 700;
		font-stretch: 90%;
		line-height: 2.3;
		color: var(--black);
	}
	.blank {
		width: auto;
		min-width: var(--w, 8ch);
		field-sizing: content;
		margin: 0 4px;
		padding: 0 8px 2px;
		border: 0;
		border-bottom: 4px solid var(--black);
		border-radius: 0;
		background: transparent;
		color: var(--brand);
		font: 800 1em var(--display);
		font-stretch: 85%;
		text-transform: uppercase;
		text-align: center;
		appearance: none;
		cursor: pointer;
		transition:
			border-color 0.2s,
			background 0.2s,
			rotate 0.2s;
	}
	input.blank {
		cursor: text;
	}
	.blank::placeholder {
		color: rgb(0 0 0 / 0.28);
		text-transform: none;
		font-weight: 600;
	}
	.blank:hover,
	.blank:focus {
		outline: 2px solid var(--brand);
		outline-offset: 2px;
		border-bottom-color: #e2e8f0;
		background: var(--soft);
		rotate: -1deg;
	}
	.blank:user-invalid {
		border-bottom-color: var(--brand);
		background: var(--accent-soft);
	}
	.blank:disabled {
		color: rgb(0 0 0 / 0.28);
		cursor: not-allowed;
		text-transform: none;
	}
	.blank.note {
		text-align: left;
	}
	.error {
		margin: 16px 0 0;
		padding: 12px 16px;
		border-radius: 12px;
		background: var(--black);
		color: var(--cream);
		font-weight: 700;
	}
	.foot {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		margin-top: 28px;
	}
	.alt {
		margin: 0;
		color: var(--muted);
		font-size: 0.875rem;
		line-height: 1.5;
	}
	.alt a {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		color: var(--black);
		font-weight: 800;
		text-transform: uppercase;
		font-stretch: 85%;
	}
	.done {
		display: grid;
		justify-items: center;
		gap: 12px;
		text-align: center;
		padding-block: 12px;
		color: var(--ink);
	}
	.done h3 {
		font-size: 2.25rem;
		margin-top: 12px;
	}
	/* Red admission ticket: notched sides, perforated stub. */
	.ticket {
		width: 100%;
		max-width: 420px;
		padding: 24px 32px;
		background: var(--brand);
		color: var(--cream);
		text-align: left;
		rotate: -2deg;
		mask:
			radial-gradient(circle 14px at 0 50%, #0000 97%, #000) left / 51% 100% no-repeat,
			radial-gradient(circle 14px at 100% 50%, #0000 97%, #000) right / 51% 100% no-repeat;
		animation: drop 0.6s cubic-bezier(0.3, 1.4, 0.5, 1) both;
	}
	.t-top {
		margin: 0;
		font-size: 0.8125rem;
		font-weight: 800;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		opacity: 0.85;
	}
	.t-name {
		margin: 6px 0 16px;
		font: 800 2.75rem/0.9 var(--display);
		font-stretch: 85%;
		text-transform: uppercase;
	}
	.t-grid {
		display: grid;
		grid-template-columns: 1.4fr 1fr 0.8fr;
		gap: 12px;
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		opacity: 0.9;
	}
	.t-grid strong {
		display: block;
		font-size: 1.25rem;
		font-stretch: 85%;
		letter-spacing: 0;
		text-transform: uppercase;
	}
	.t-stub {
		margin: 18px 0 0;
		padding-top: 12px;
		font-size: 0.8125rem;
		font-weight: 700;
		background: radial-gradient(circle, var(--cream) 1.5px, transparent 2px) 0 0 / 9px 3px repeat-x;
	}
	@keyframes drop {
		from {
			opacity: 0;
			translate: 0 -30px;
			rotate: 8deg;
		}
	}
	.done p {
		max-width: 40ch;
		margin: 0 0 8px;
		color: var(--muted);
	}
	.link {
		background: none;
		border: 0;
		color: var(--black);
		font: 800 0.9375rem var(--display);
		text-transform: uppercase;
		text-decoration: underline;
		text-underline-offset: 4px;
		cursor: pointer;
	}
</style>

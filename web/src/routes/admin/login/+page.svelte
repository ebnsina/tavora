<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { ArrowLeft02Icon } from '@hugeicons/core-free-icons';
	import { tick } from 'svelte';

	let { form } = $props();
	let busy = $state(false);
	// Staff PIN is the default on the till; ?as=owner (or a failed owner sign-in) opens the owner form.
	// svelte-ignore state_referenced_locally
	let mode = $state<'pin' | 'owner'>(
		form?.mode === 'owner' || page.url.searchParams.get('as') === 'owner' ? 'owner' : 'pin'
	);
	let pin = $state('');
	let pinForm = $state<HTMLFormElement>();

	async function press(d: string) {
		if (busy || pin.length >= 6) return;
		pin += d;
		// Let the hidden input take the sixth digit before submitting.
		if (pin.length === 6) {
			await tick();
			pinForm?.requestSubmit();
		}
	}
	const submit = () => {
		busy = true;
		return async ({ update }: { update: () => Promise<void> }) => {
			await update();
			busy = false;
			pin = '';
		};
	};
</script>

<svelte:window
	onkeydown={(e) => {
		if (mode !== 'pin') return;
		if (/^[0-9]$/.test(e.key)) press(e.key);
		if (e.key === 'Backspace') pin = pin.slice(0, -1);
	}}
/>

<main>
	<div class="box">
		<h1>Tavora<span>Dashboard</span></h1>
		<div class="tabs" role="tablist" aria-label="Sign in as">
			<button type="button" role="tab" aria-selected={mode === 'pin'} onclick={() => (mode = 'pin')}
				>Staff</button
			>
			<button
				type="button"
				role="tab"
				aria-selected={mode === 'owner'}
				onclick={() => (mode = 'owner')}>Owner</button
			>
		</div>
		{#if form?.error && form.mode === mode}<p class="err" role="alert">{form.error}</p>{/if}

		{#if mode === 'pin'}
			<form method="POST" action="?/pin" bind:this={pinForm} use:enhance={submit} class="pin">
				<input type="hidden" name="pin" value={pin} />
				<p class="hint">Enter your 6-digit PIN</p>
				<div class="dots" aria-label="{pin.length} of 6 digits entered">
					{#each { length: 6 }, i (i)}<span class:on={i < pin.length}></span>{/each}
				</div>
				<div class="pad">
					{#each ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as d (d)}
						<button type="button" onclick={() => press(d)} disabled={busy}>{d}</button>
					{/each}
					<span></span>
					<button type="button" onclick={() => press('0')} disabled={busy}>0</button>
					<button
						type="button"
						aria-label="Delete last digit"
						onclick={() => (pin = pin.slice(0, -1))}
						disabled={busy || !pin}><HugeiconsIcon icon={ArrowLeft02Icon} size={24} /></button
					>
				</div>
			</form>
		{:else}
			<form method="POST" action="?/owner" use:enhance={submit} class="owner">
				<label>
					Email
					<input
						name="email"
						type="email"
						autocomplete="username"
						value={form?.email ?? ''}
						required
					/>
				</label>
				<label>
					Password
					<input name="password" type="password" autocomplete="current-password" required />
				</label>
				<button class="btn primary" type="submit" disabled={busy}
					>{busy ? 'Signing in…' : 'Sign in'}</button
				>
			</form>
		{/if}
	</div>
</main>

<style>
	main {
		min-height: 100dvh;
		display: grid;
		place-items: center;
		padding: 16px;
		background: var(--brand);
	}
	.box {
		display: grid;
		gap: 16px;
		width: min(380px, 100%);
		padding: 32px;
		border-radius: 24px;
		background: var(--cream);
	}
	.owner,
	.pin {
		display: grid;
		gap: 16px;
	}
	.tabs {
		display: grid;
		grid-template-columns: 1fr 1fr;
		padding: 4px;
		border-radius: 12px;
		background: var(--soft);
	}
	.tabs button {
		min-height: 40px;
		border: 0;
		border-radius: 9px;
		background: none;
		font: 700 0.9375rem var(--sans);
		cursor: pointer;
	}
	.tabs [aria-selected='true'] {
		background: var(--black);
		color: var(--cream);
	}
	.hint {
		margin: 0;
		text-align: center;
		font-weight: 600;
	}
	.dots {
		display: flex;
		justify-content: center;
		gap: 12px;
	}
	.dots span {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		box-shadow: inset 0 0 0 2px var(--black);
	}
	.dots .on {
		background: var(--black);
	}
	.pad {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 10px;
	}
	.pad button {
		display: grid;
		place-items: center;
		min-height: 64px;
		border: 0;
		border-radius: 16px;
		background: #fffdf6;
		box-shadow: inset 0 0 0 2px var(--line);
		font: 800 1.5rem var(--sans);
		cursor: pointer;
	}
	.pad button:active {
		background: var(--black);
		color: var(--cream);
	}
	.pad button:disabled {
		opacity: 0.5;
	}
	h1 {
		display: grid;
		font-size: 2.5rem;
		color: var(--brand);
	}
	h1 span {
		font-size: 0.8125rem;
		letter-spacing: 0.14em;
		color: var(--black);
	}
	label {
		display: grid;
		gap: 6px;
		font-weight: 600;
		font-size: 0.875rem;
	}
	input {
		min-height: 48px;
		padding: 10px 14px;
		border: 0;
		border-radius: 12px;
		background: #fffdf6;
		box-shadow: inset 0 0 0 2px var(--black);
		font: 1rem var(--sans);
	}
	input:focus {
		outline: none;
		box-shadow: inset 0 0 0 2px var(--brand);
	}
	.err {
		margin: 0;
		padding: 10px 14px;
		border-radius: 10px;
		background: var(--black);
		color: var(--cream);
		font-weight: 600;
	}
</style>

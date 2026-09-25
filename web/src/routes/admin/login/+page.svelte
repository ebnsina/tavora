<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();
	let busy = $state(false);
</script>

<main>
	<form
		method="POST"
		use:enhance={() => {
			busy = true;
			return async ({ update }) => {
				await update();
				busy = false;
			};
		}}
	>
		<h1>Tavora<span>Dashboard</span></h1>
		{#if form?.error}<p class="err" role="alert">{form.error}</p>{/if}
		<label>
			Email
			<input name="email" type="email" autocomplete="username" value={form?.email ?? ''} required />
		</label>
		<label>
			Password
			<input name="password" type="password" autocomplete="current-password" required />
		</label>
		<button class="btn primary" type="submit" disabled={busy}
			>{busy ? 'Signing in…' : 'Sign in'}</button
		>
	</form>
</main>

<style>
	main {
		min-height: 100dvh;
		display: grid;
		place-items: center;
		padding: 16px;
		background: var(--brand);
	}
	form {
		display: grid;
		gap: 16px;
		width: min(380px, 100%);
		padding: 32px;
		border-radius: 24px;
		background: var(--cream);
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

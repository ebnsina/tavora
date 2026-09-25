<script lang="ts">
	import { enhance } from '$app/forms';
	import PageHeader from '$lib/admin/PageHeader.svelte';

	let { data, form } = $props();
	let adding = $state(false);
</script>

<PageHeader title="Tables" sub="The tables the POS shows on its floor screen">
	{#snippet actions()}
		{#if form?.error}<p class="flash bad" role="alert">{form.error}</p>{/if}
		{#if form?.ok}<p class="flash" role="status">{form.ok}</p>{/if}
		<button class="btn primary" type="button" onclick={() => (adding = !adding)}
			>{adding ? 'Close' : 'Add table'}</button
		>
	{/snippet}
</PageHeader>

<div class="stack">
	{#if adding}
		<form
			method="POST"
			action="?/add"
			class="card row-form"
			use:enhance={() =>
				async ({ result, update }) => {
					await update();
					if (result.type === 'success') adding = false;
				}}
		>
			<label>Name <input name="name" placeholder="e.g. T9" maxlength="20" required /></label>
			<label>Seats <input name="seats" type="number" min="1" max="30" value="4" required /></label>
			<label>Area <input name="area" placeholder="e.g. Rooftop" maxlength="30" /></label>
			<button class="btn primary">Add</button>
		</form>
	{/if}

	<ul class="card list">
		{#each data.tables as t (t.id)}
			<li>
				<form
					method="POST"
					action="?/save"
					use:enhance={() =>
						async ({ update }) =>
							update({ reset: false })}
					class="row-form"
				>
					<input type="hidden" name="id" value={t.id} />
					<label>Name <input name="name" value={t.name} maxlength="20" required /></label>
					<label
						>Seats <input
							name="seats"
							type="number"
							min="1"
							max="30"
							value={t.seats}
							required
						/></label
					>
					<label>Area <input name="area" value={t.area} maxlength="30" /></label>
					<button class="btn ghost small">Save</button>
				</form>
				<form
					method="POST"
					action="?/remove"
					use:enhance={({ cancel }) => {
						if (!confirm(`Remove table ${t.name}?`)) cancel();
					}}
				>
					<input type="hidden" name="id" value={t.id} />
					<button class="remove">Remove</button>
				</form>
			</li>
		{:else}
			<li class="empty">No tables yet. Add one to start taking dine-in orders.</li>
		{/each}
	</ul>
</div>

<style>
	.row-form {
		display: grid;
		grid-template-columns: 1fr 100px 1fr auto;
		align-items: end;
		gap: 12px;
	}
	.list {
		list-style: none;
		margin: 0;
		display: grid;
		gap: 4px;
	}
	.list li {
		display: grid;
		grid-template-columns: 1fr auto;
		align-items: end;
		gap: 12px;
		padding: 10px 0;
		border-bottom: 1px solid var(--line);
	}
	.list li:last-child {
		border-bottom: 0;
	}
	.remove {
		min-height: 38px;
		padding: 0 8px;
		border: 0;
		background: none;
		color: var(--brand);
		font: 600 0.875rem var(--sans);
		cursor: pointer;
	}
	@media (max-width: 700px) {
		.row-form {
			grid-template-columns: 1fr 1fr;
		}
	}
</style>

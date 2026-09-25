<script lang="ts">
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { Add01Icon, FloppyDiskIcon, PencilEdit02Icon } from '@hugeicons/core-free-icons';
	import { enhance } from '$app/forms';
	import Dialog from '$lib/admin/Dialog.svelte';
	import PageHeader from '$lib/admin/PageHeader.svelte';

	let { data, form } = $props();
	type Table = (typeof data.tables)[number];
	// `null` = no dialog, `{}` = adding, `{ table }` = editing.
	let open = $state<{ table?: Table } | null>(null);
	const t = $derived(open?.table);
</script>

<PageHeader title="Tables" sub="The tables the POS shows on its floor screen">
	{#snippet actions()}
		<button class="btn primary" type="button" onclick={() => (open = {})}
			><HugeiconsIcon icon={Add01Icon} size={18} /> Add table</button
		>
	{/snippet}
</PageHeader>

{#if form?.error && !open}<p class="flash bad" role="alert">{form.error}</p>{/if}
{#if form?.ok}<p class="flash" role="status">{form.ok}</p>{/if}

<ul class="card list">
	{#each data.tables as table (table.id)}
		<li>
			<strong>{table.name}</strong>
			<span>{table.seats} seats</span>
			<span class="muted">{table.area || '—'}</span>
			<button class="btn ghost small" type="button" onclick={() => (open = { table })}
				><HugeiconsIcon icon={PencilEdit02Icon} size={16} /> Edit</button
			>
		</li>
	{:else}
		<li class="empty">No tables yet. Add one to start taking dine-in orders.</li>
	{/each}
</ul>

<Dialog
	open={!!open}
	title={t ? `Edit table ${t.name}` : 'Add a table'}
	onclose={() => (open = null)}
>
	{#if form?.error}<p class="flash bad" role="alert">{form.error}</p>{/if}
	<form
		method="POST"
		action={t ? '?/save' : '?/add'}
		class="stack"
		use:enhance={() =>
			async ({ result, update }) => {
				await update();
				if (result.type === 'success') open = null;
			}}
	>
		{#if t}<input type="hidden" name="id" value={t.id} />{/if}
		<!-- svelte-ignore a11y_autofocus -->
		<label
			>Name <input
				name="name"
				value={t?.name ?? ''}
				placeholder="e.g. T9"
				maxlength="20"
				required
				autofocus
			/></label
		>
		<label
			>Seats <input
				name="seats"
				type="number"
				min="1"
				max="30"
				value={t?.seats ?? 4}
				required
			/></label
		>
		<label
			>Area <input
				name="area"
				value={t?.area ?? ''}
				placeholder="e.g. Rooftop"
				maxlength="30"
			/></label
		>
		<button class="btn primary"
			>{#if t}<HugeiconsIcon icon={FloppyDiskIcon} size={18} /> Save{:else}<HugeiconsIcon
					icon={Add01Icon}
					size={18}
				/> Add table{/if}</button
		>
	</form>
	{#if t}
		<form
			method="POST"
			action="?/remove"
			use:enhance={({ cancel }) => {
				if (!confirm(`Remove table ${t.name}?`)) return cancel();
				return async ({ result, update }) => {
					await update();
					if (result.type === 'success') open = null;
				};
			}}
		>
			<input type="hidden" name="id" value={t.id} />
			<button class="remove">Remove this table</button>
		</form>
	{/if}
</Dialog>

<style>
	.list {
		list-style: none;
		margin: 0;
		display: grid;
	}
	.list li {
		display: grid;
		grid-template-columns: 1fr 100px 1fr auto;
		align-items: center;
		gap: 12px;
		padding: 12px 0;
		border-bottom: 1px solid var(--line);
	}
	.list li:last-child {
		border-bottom: 0;
	}
	.list li.empty {
		display: block;
	}
	.muted {
		color: var(--muted);
	}
	.remove {
		margin-top: 12px;
		padding: 0;
		border: 0;
		background: none;
		color: var(--brand);
		font: 600 0.875rem var(--sans);
		text-decoration: underline;
		cursor: pointer;
	}
</style>

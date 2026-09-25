<script lang="ts">
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { Add01Icon, FloppyDiskIcon, PencilEdit02Icon } from '@hugeicons/core-free-icons';
	import { enhance } from '$app/forms';
	import Dialog from '$lib/admin/Dialog.svelte';
	import PageHeader from '$lib/admin/PageHeader.svelte';

	let { data, form } = $props();
	type Staff = (typeof data.staff)[number];
	// `null` = no dialog, `{}` = adding, `{ person }` = editing.
	let open = $state<{ person?: Staff } | null>(null);
	const p = $derived(open?.person);
	const since = new Intl.DateTimeFormat('en-GB', {
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	});
	const fields = $derived((form as { fields?: Record<string, string> } | null)?.fields);

	const closeOnSuccess =
		() =>
		async ({ result, update }: { result: { type: string }; update: () => Promise<void> }) => {
			await update();
			if (result.type === 'success') open = null;
		};
</script>

<PageHeader title="Staff" sub="Staff sign in on the till with their own PIN">
	{#snippet actions()}
		<button class="btn primary" type="button" onclick={() => (open = {})}
			><HugeiconsIcon icon={Add01Icon} size={18} /> Add staff</button
		>
	{/snippet}
</PageHeader>

{#if form?.error && !open}<p class="flash bad" role="alert">{form.error}</p>{/if}
{#if form?.ok}<p class="flash" role="status">{form.ok}</p>{/if}

<ul class="card list">
	{#each data.staff as person (person.id)}
		<li>
			<strong>{person.name}</strong>
			<span class="muted">Added {since.format(new Date(person.created_at))}</span>
			<button class="btn ghost small" type="button" onclick={() => (open = { person })}
				><HugeiconsIcon icon={PencilEdit02Icon} size={16} /> Edit</button
			>
		</li>
	{:else}
		<li class="empty">
			No staff yet. Add the people who work the till; each gets a PIN so sales show who took them,
			and they can't see revenue or settings.
		</li>
	{/each}
</ul>

<Dialog open={!!open} title={p ? `Edit ${p.name}` : 'Add staff'} onclose={() => (open = null)}>
	{#if form?.error}<p class="flash bad" role="alert">{form.error}</p>{/if}
	<form method="POST" action={p ? '?/save' : '?/add'} class="stack" use:enhance={closeOnSuccess}>
		{#if p}<input type="hidden" name="id" value={p.id} />{/if}
		<label>
			Name
			<!-- svelte-ignore a11y_autofocus -->
			<input name="name" value={p?.name ?? ''} maxlength="40" required autofocus />
		</label>
		<label>
			{p ? 'New PIN (leave empty to keep the current one)' : 'PIN'}
			<input
				name="pin"
				inputmode="numeric"
				pattern="[0-9]{'{6}'}"
				maxlength="6"
				autocomplete="off"
				placeholder="6 digits"
				required={!p}
			/>
			{#if fields?.pin}<small class="bad"
					>{fields.pin === 'already used by someone else'
						? 'Someone already uses that PIN. Pick another.'
						: 'Use exactly 6 digits.'}</small
				>{/if}
		</label>
		<p class="muted">Tell them their PIN in person. It can't be looked up later, only changed.</p>
		<button class="btn primary"
			>{#if p}<HugeiconsIcon icon={FloppyDiskIcon} size={18} /> Save{:else}<HugeiconsIcon
					icon={Add01Icon}
					size={18}
				/> Add staff{/if}</button
		>
	</form>
	{#if p}
		<form
			method="POST"
			action="?/remove"
			use:enhance={({ cancel }) => {
				if (!confirm(`Remove ${p.name}? They'll be signed out straight away.`)) return cancel();
				return closeOnSuccess();
			}}
		>
			<input type="hidden" name="id" value={p.id} />
			<button class="remove">Remove {p.name}</button>
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
		grid-template-columns: 1fr auto auto;
		align-items: center;
		gap: 16px;
		padding: 12px 0;
		border-bottom: 1px solid var(--line);
	}
	.list li:last-child {
		border-bottom: 0;
	}
	.list li.empty {
		display: block;
		color: var(--muted);
	}
	.muted {
		margin: 0;
		color: var(--muted);
		font-size: 0.875rem;
	}
	.bad {
		color: var(--brand);
		font-weight: 600;
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

<script lang="ts">
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		Add01Icon,
		CheckmarkCircle02Icon,
		Delete02Icon,
		FloppyDiskIcon,
		PencilEdit02Icon,
		UnavailableIcon
	} from '@hugeicons/core-free-icons';
	import { enhance } from '$app/forms';
	import { asset, price, type Category, type Item } from '$lib/api';
	import Dialog from '$lib/admin/Dialog.svelte';
	import PageHeader from '$lib/admin/PageHeader.svelte';
	import Tabs from '$lib/admin/Tabs.svelte';
	import DishForm from './DishForm.svelte';

	let { data, form } = $props();

	// The one dialog showing, if any.
	type Open =
		| { kind: 'dish'; categoryId: number; item?: Item }
		| { kind: 'category'; category?: Category; position?: number };
	let open = $state<Open | null>(null);
	// One category at a time; falls back to the first if the chosen one was deleted.
	let cat = $state('');
	const shown = $derived(
		data.categories.some((c) => String(c.id) === cat) ? cat : String(data.categories[0]?.id ?? '')
	);
	const close = () => (open = null);
	const cats = $derived(data.categories.map((c) => ({ id: c.id, name: c.name })));
	// Close the dialog only when the save worked; errors stay in it.
	const closeOnSuccess =
		() =>
		async ({ result, update }: { result: { type: string }; update: () => Promise<void> }) => {
			await update();
			if (result.type === 'success') close();
		};
</script>

<PageHeader
	title="Menu"
	sub="{data.categories.reduce((n, c) => n + c.items.length, 0)} dishes in {data.categories
		.length} categories"
>
	{#snippet actions()}
		<button class="btn primary" type="button" onclick={() => (open = { kind: 'category' })}>
			<HugeiconsIcon icon={Add01Icon} size={18} /> Add category
		</button>
	{/snippet}
</PageHeader>

{#if form?.error && !open}<p class="flash bad" role="alert">{form.error}</p>{/if}
{#if form?.ok}<p class="flash" role="status">{form.ok}</p>{/if}

{#if data.categories.length}
	<Tabs
		label="Categories"
		bind:active={() => shown, (v) => (cat = v)}
		tabs={data.categories.map((c) => ({ id: String(c.id), label: c.name, count: c.items.length }))}
	/>
{/if}

<div class="stack">
	{#each data.categories as c, ci (c.id)}
		<section class="card" id="panel-{c.id}" hidden={String(c.id) !== shown}>
			<div class="cat-head">
				<h2>{c.name}</h2>
				<span class="count">{c.items.length} dishes</span>
				<button
					class="btn ghost small"
					type="button"
					onclick={() => (open = { kind: 'category', category: c, position: ci + 1 })}
					><HugeiconsIcon icon={PencilEdit02Icon} size={16} /> Rename</button
				>
				<!-- Only an empty category can go, so dishes are never deleted by accident. -->
				{#if !c.items.length}
					<form
						method="POST"
						action="?/deleteCategory"
						use:enhance={({ cancel }) => {
							if (!confirm(`Delete the “${c.name}” category?`)) cancel();
						}}
					>
						<input type="hidden" name="id" value={c.id} />
						<button class="btn ghost small danger"
							><HugeiconsIcon icon={Delete02Icon} size={16} /> Delete</button
						>
					</form>
				{/if}
			</div>

			<ul class="dishes">
				{#each c.items as item (item.id)}
					<li class:off={!item.available}>
						<div class="dish">
							{#if item.image}
								<img src={asset(item.image)} alt="" width="56" height="56" loading="lazy" />
							{:else}
								<span class="thumb"></span>
							{/if}
							<div class="meta">
								<strong>{item.name}</strong>
								<span>{price(item.price)}{item.available ? '' : ' · Sold out'}</span>
							</div>
							<form method="POST" action="?/toggle" use:enhance class="row">
								<input type="hidden" name="id" value={item.id} />
								<button
									class="btn small"
									class:ghost={item.available}
									class:primary={!item.available}
								>
									{#if item.available}<HugeiconsIcon icon={UnavailableIcon} size={16} /> Sold out{:else}<HugeiconsIcon
											icon={CheckmarkCircle02Icon}
											size={16}
										/> Back on menu{/if}
								</button>
							</form>
							<button
								class="btn quiet small"
								type="button"
								onclick={() => (open = { kind: 'dish', categoryId: c.id, item })}
								><HugeiconsIcon icon={PencilEdit02Icon} size={16} /> Edit</button
							>
						</div>
					</li>
				{/each}
			</ul>

			<div class="row">
				<button
					class="btn primary small"
					type="button"
					onclick={() => (open = { kind: 'dish', categoryId: c.id })}
				>
					<HugeiconsIcon icon={Add01Icon} size={16} /> Add a dish to {c.name}
				</button>
			</div>
		</section>
	{/each}
</div>

<Dialog
	open={open?.kind === 'dish'}
	title={open?.kind === 'dish' && open.item ? `Edit ${open.item.name}` : 'Add a dish'}
	onclose={close}
>
	{#if open?.kind === 'dish'}
		{#if form?.error}<p class="flash bad" role="alert">{form.error}</p>{/if}
		<DishForm
			item={open.item}
			categoryId={open.categoryId}
			categories={cats}
			done={close}
			deleteForm={open.item ? 'delete-dish' : undefined}
		/>
		{#if open.item}
			{@const item = open.item}
			<form
				id="delete-dish"
				method="POST"
				action="?/deleteItem"
				use:enhance={({ cancel }) => {
					if (!confirm(`Delete “${item.name}” for good?`)) return cancel();
					return closeOnSuccess();
				}}
			>
				<input type="hidden" name="id" value={item.id} />
			</form>
		{/if}
	{/if}
</Dialog>

<Dialog
	open={open?.kind === 'category'}
	title={open?.kind === 'category' && open.category ? 'Rename category' : 'New category'}
	onclose={close}
>
	{#if open?.kind === 'category'}
		{@const cat = open.category}
		{#if form?.error}<p class="flash bad" role="alert">{form.error}</p>{/if}
		<form
			method="POST"
			action={cat ? '?/saveCategory' : '?/addCategory'}
			use:enhance={closeOnSuccess}
			class="stack"
		>
			{#if cat}
				<input type="hidden" name="id" value={cat.id} />
				<input type="hidden" name="position" value={open.position} />
			{/if}
			<label>
				Category name
				<!-- svelte-ignore a11y_autofocus -->
				<input
					name="name"
					value={cat?.name ?? ''}
					placeholder="e.g. Pizza"
					maxlength="40"
					required
					autofocus
				/>
			</label>
			<div class="form-actions">
				<button class="btn ghost small" type="button" onclick={close}>Cancel</button>
				<button class="btn primary small"
					>{#if cat}<HugeiconsIcon icon={FloppyDiskIcon} size={16} /> Save{:else}<HugeiconsIcon
							icon={Add01Icon}
							size={16}
						/> Add category{/if}</button
				>
			</div>
		</form>
	{/if}
</Dialog>

<style>
	.cat-head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 10px;
		margin-bottom: 12px;
	}
	.cat-head h2 {
		margin: 0;
		font-size: 1.25rem;
	}
	.cat-head .btn.danger {
		color: var(--brand);
	}
	.count {
		margin-left: auto;
		color: var(--muted);
		font-size: 0.875rem;
	}
	.dishes {
		list-style: none;
		margin: 0 0 14px;
		padding: 0;
		display: grid;
		gap: 8px;
	}
	.dishes > li {
		display: grid;
		gap: 10px;
		padding: 10px;
		border-radius: 12px;
		background: #ffffff;
	}
	.dishes > li.off .meta {
		opacity: 0.55;
	}
	.dish {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 12px;
	}
	.dish img,
	.thumb {
		width: 56px;
		height: 56px;
		border-radius: 10px;
		object-fit: cover;
		background: var(--soft);
	}
	.meta {
		flex: 1;
		min-width: 160px;
		display: grid;
	}
	.meta span {
		color: var(--muted);
		font-size: 0.875rem;
	}
</style>

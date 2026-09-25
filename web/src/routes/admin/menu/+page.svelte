<script lang="ts">
	import { enhance } from '$app/forms';
	import { asset, price } from '$lib/api';
	import DishForm from './DishForm.svelte';

	let { data, form } = $props();

	// Which dish is open for editing, or `new:<categoryId>` for the add form.
	let open = $state<string | null>(null);
	const cats = $derived(data.categories.map((c) => ({ id: c.id, name: c.name })));
</script>

<h1>Menu</h1>

{#if form?.error}<p class="flash bad" role="alert">{form.error}</p>{/if}
{#if form?.ok}<p class="flash" role="status">{form.ok}</p>{/if}

<div class="stack">
	{#each data.categories as c, ci (c.id)}
		<section class="card">
			<form method="POST" action="?/saveCategory" use:enhance class="cat-head">
				<input type="hidden" name="id" value={c.id} />
				<input type="hidden" name="position" value={ci + 1} />
				<input
					class="cat-name"
					name="name"
					value={c.name}
					aria-label="Category name"
					maxlength="40"
					required
				/>
				<button class="btn ghost small">Rename</button>
				<span class="count">{c.items.length} dishes</span>
			</form>

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
								<button class="btn small" class:primary={!item.available}>
									{item.available ? 'Sold out' : 'Back on menu'}
								</button>
							</form>
							<button
								class="btn ghost small"
								type="button"
								onclick={() => (open = open === `${item.id}` ? null : `${item.id}`)}
							>
								{open === `${item.id}` ? 'Close' : 'Edit'}
							</button>
						</div>
						{#if open === `${item.id}`}
							<DishForm {item} categoryId={c.id} categories={cats} done={() => (open = null)} />
							<form
								method="POST"
								action="?/deleteItem"
								use:enhance={({ cancel }) => {
									if (!confirm(`Delete “${item.name}” for good?`)) cancel();
								}}
							>
								<input type="hidden" name="id" value={item.id} />
								<button class="link-danger">Delete this dish</button>
							</form>
						{/if}
					</li>
				{/each}
			</ul>

			{#if open === `new:${c.id}`}
				<DishForm categoryId={c.id} categories={cats} done={() => (open = null)} />
			{:else}
				<div class="row">
					<button class="btn primary small" type="button" onclick={() => (open = `new:${c.id}`)}>
						Add a dish to {c.name}
					</button>
					{#if !c.items.length}
						<form
							method="POST"
							action="?/deleteCategory"
							use:enhance={({ cancel }) => {
								if (!confirm(`Delete the “${c.name}” category?`)) cancel();
							}}
						>
							<input type="hidden" name="id" value={c.id} />
							<button class="link-danger">Delete category</button>
						</form>
					{/if}
				</div>
			{/if}
		</section>
	{/each}

	<form method="POST" action="?/addCategory" use:enhance class="card row">
		<label class="grow">
			New category
			<input name="name" placeholder="e.g. Pizza" maxlength="40" required />
		</label>
		<button class="btn primary">Add category</button>
	</form>
</div>

<style>
	.cat-head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 10px;
		margin-bottom: 12px;
	}
	.cat-name {
		max-width: 320px;
		font: 800 1.25rem var(--display) !important;
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
		background: #fffdf6;
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
	.grow {
		flex: 1;
		min-width: 200px;
	}
	.link-danger {
		padding: 0;
		border: 0;
		background: none;
		color: var(--brand);
		font: 600 0.875rem var(--sans);
		text-decoration: underline;
		cursor: pointer;
	}
</style>

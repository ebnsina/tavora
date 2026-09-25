<script lang="ts">
	import { enhance } from '$app/forms';
	import { asset, type Item } from '$lib/api';

	let {
		item,
		categoryId,
		categories,
		done
	}: {
		item?: Item;
		categoryId: number;
		categories: { id: number; name: string }[];
		done?: () => void;
	} = $props();

	let preview = $state('');
	let busy = $state(false);
	const tagLabels = { popular: 'Most loved', spicy: 'Spicy', veg: 'Vegetarian' };
</script>

<form
	method="POST"
	action="?/saveItem"
	enctype="multipart/form-data"
	class="dish-form"
	use:enhance={() => {
		busy = true;
		return async ({ result, update }) => {
			await update({ reset: !item });
			busy = false;
			if (result.type === 'success') {
				preview = '';
				done?.();
			}
		};
	}}
>
	{#if item}<input type="hidden" name="id" value={item.id} />{/if}
	<input type="hidden" name="image" value={item?.image ?? ''} />
	<input type="hidden" name="position" value={item?.position ?? 0} />

	<div class="photo">
		{#if preview || item?.image}
			<img src={preview || asset(item?.image)} alt="" width="120" height="120" />
		{:else}
			<span class="none">No photo</span>
		{/if}
		<label class="pick">
			{item?.image ? 'Change photo' : 'Add photo'}
			<input
				type="file"
				name="file"
				accept="image/jpeg,image/png,image/webp"
				onchange={(e) => {
					const f = e.currentTarget.files?.[0];
					preview = f ? URL.createObjectURL(f) : '';
				}}
			/>
		</label>
	</div>

	<div class="fields">
		<label>Name <input name="name" value={item?.name ?? ''} maxlength="60" required /></label>
		<label>
			Price (৳)
			<input
				name="price"
				type="number"
				min="1"
				step="1"
				value={item ? item.price / 100 : ''}
				required
			/>
		</label>
		<label class="wide">
			Short description
			<textarea name="description" maxlength="200">{item?.description ?? ''}</textarea>
		</label>
		<label>
			Category
			<select name="category_id">
				{#each categories as c (c.id)}
					<option value={c.id} selected={c.id === (item?.category_id ?? categoryId)}
						>{c.name}</option
					>
				{/each}
			</select>
		</label>
		<fieldset>
			<legend>Labels</legend>
			{#each Object.entries(tagLabels) as [value, label] (value)}
				<label class="check">
					<input
						type="checkbox"
						name="tags"
						{value}
						checked={item?.tags.includes(value as never)}
					/>
					{label}
				</label>
			{/each}
			<label class="check">
				<input class="switch" type="checkbox" name="available" checked={item?.available ?? true} /> On
				the menu
			</label>
		</fieldset>
	</div>

	<div class="row actions">
		<button class="btn primary small" type="submit" disabled={busy}>
			{busy ? 'Saving…' : item ? 'Save dish' : 'Add dish'}
		</button>
		{#if done}<button class="btn ghost small" type="button" onclick={done}>Close</button>{/if}
	</div>
</form>

<style>
	.dish-form {
		display: grid;
		gap: 16px;
		padding: 16px;
		border-radius: 14px;
		background: var(--soft);
	}
	.photo {
		display: flex;
		align-items: center;
		gap: 14px;
	}
	.photo img,
	.none {
		width: 96px;
		height: 96px;
		border-radius: 14px;
		object-fit: cover;
	}
	.none {
		display: grid;
		place-items: center;
		background: var(--cream);
		color: var(--muted);
		font-size: 0.8125rem;
	}
	.pick {
		display: inline-flex;
		padding: 8px 14px;
		border-radius: 10px;
		background: var(--black);
		color: var(--cream);
		cursor: pointer;
	}
	.pick input {
		position: absolute;
		width: 1px;
		height: 1px;
		opacity: 0;
	}
	.pick:focus-within {
		outline: 3px solid var(--mustard);
	}
	.fields {
		display: grid;
		gap: 12px;
	}
	fieldset {
		display: flex;
		flex-wrap: wrap;
		gap: 8px 16px;
		margin: 0;
		padding: 0;
		border: 0;
	}
	legend {
		width: 100%;
		margin-bottom: 6px;
		font-weight: 600;
		font-size: 0.875rem;
	}
	.check {
		display: flex;
		align-items: center;
		gap: 6px;
		font-weight: 500;
	}
	@media (min-width: 720px) {
		.fields {
			grid-template-columns: 2fr 1fr;
		}
		.wide {
			grid-column: 1 / -1;
		}
	}
</style>

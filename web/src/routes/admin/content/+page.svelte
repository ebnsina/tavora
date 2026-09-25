<script lang="ts">
	import { enhance } from '$app/forms';
	import { asset, type SiteContent, type TickerIcon } from '$lib/api';
	import { foodIcons } from '$lib/icons';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		Add01Icon,
		BookOpen01Icon,
		Call02Icon,
		FloppyDiskIcon,
		Home01Icon,
		Link01Icon,
		Rocket01Icon,
		StarIcon,
		TextIcon
	} from '@hugeicons/core-free-icons';
	import PageHeader from '$lib/admin/PageHeader.svelte';
	import Tabs from '$lib/admin/Tabs.svelte';

	let { data, form } = $props();

	// svelte-ignore state_referenced_locally
	let site = $state<SiteContent>(structuredClone(data.site));
	// After a save the page reloads its data; start editing from what the server now has.
	$effect.pre(() => {
		site = structuredClone(data.site);
	});

	let busy = $state(false);
	let previews = $state<Record<string, string>>({});
	const fields = $derived((form && 'fields' in form ? form.fields : {}) as Record<string, string>);
	const icons = Object.keys(foodIcons) as TickerIcon[];

	// One tab per homepage section; `keys` are the error paths that belong to it.
	const tabs = [
		{ id: 'top', icon: Home01Icon, label: 'Top of the page', keys: ['hero', 'marquee', 'slogans'] },
		{ id: 'story', icon: BookOpen01Icon, label: 'Our story', keys: ['story'] },
		{
			id: 'headings',
			icon: TextIcon,
			label: 'Section headings',
			keys: ['menu', 'booking', 'tawa', 'reviews.title']
		},
		{ id: 'reviews', icon: StarIcon, label: 'Reviews', keys: ['reviews.items'] },
		{ id: 'ticker', icon: Rocket01Icon, label: 'Food ticker', keys: ['ticker'] },
		{ id: 'call', icon: Call02Icon, label: 'Call-to-order building', keys: ['call'] },
		{ id: 'links', icon: Link01Icon, label: 'Links and sharing', keys: ['social', 'seo'] }
	];
	let tab = $state('top');
	const hasError = (keys: string[]) =>
		Object.keys(fields).some((f) => keys.some((k) => f.startsWith(k)));
	// After a failed save, jump to the first tab that needs fixing.
	$effect(() => {
		const bad = tabs.find((t) => hasError(t.keys));
		if (bad) tab = bad.id;
	});

	function pick(key: string, e: Event) {
		const f = (e.currentTarget as HTMLInputElement).files?.[0];
		previews[key] = f ? URL.createObjectURL(f) : '';
	}
</script>

{#snippet err(path: string)}
	{#if fields[path]}<span class="field-error">{fields[path]}</span>{/if}
{/snippet}

<PageHeader
	title="Website text"
	sub="Everything visitors read on the homepage. Changes go live as soon as you save."
>
	{#snippet actions()}
		{#if form?.error}<p class="flash bad" role="alert">{form.error}</p>{/if}
		{#if form?.ok}<p class="flash" role="status">{form.ok}</p>{/if}
		<button class="btn primary" type="submit" form="content-form" disabled={busy}>
			<HugeiconsIcon icon={FloppyDiskIcon} size={18} />
			{busy ? 'Saving…' : 'Save changes'}
		</button>
	{/snippet}
</PageHeader>

<form
	id="content-form"
	class="tabbed"
	method="POST"
	enctype="multipart/form-data"
	use:enhance={() => {
		busy = true;
		return async ({ update }) => {
			await update({ reset: false });
			busy = false;
			previews = {};
		};
	}}
>
	<input type="hidden" name="data" value={JSON.stringify(site)} />

	<Tabs
		label="Sections"
		bind:active={tab}
		tabs={tabs.map((t) => ({ id: t.id, label: t.label, icon: t.icon, dot: hasError(t.keys) }))}
	/>

	<div class="panels">
		<div
			class="card stack"
			role="tabpanel"
			id="panel-top"
			aria-labelledby="tab-top"
			hidden={tab !== 'top'}
		>
			<h2>Top of the page</h2>
			<label
				>Tagline under the name <input bind:value={site.hero.tagline} maxlength="60" />{@render err(
					'hero.tagline'
				)}</label
			>
			<label>
				Short description
				<textarea bind:value={site.hero.description} maxlength="300"></textarea>
				<span class="hint">Also used by Google and when the link is shared.</span>
				{@render err('hero.description')}
			</label>
			<label
				>Big scrolling line <input bind:value={site.marquee} maxlength="120" />{@render err(
					'marquee'
				)}</label
			>
			<div class="grid2">
				{#each site.slogans as _, i (i)}
					<label>
						{i === 0 ? 'Red' : 'Black'} slogan card
						<input bind:value={site.slogans[i]} maxlength="40" />{@render err(`slogans.${i}`)}
					</label>
				{/each}
			</div>
		</div>

		<div
			class="card stack"
			role="tabpanel"
			id="panel-story"
			aria-labelledby="tab-story"
			hidden={tab !== 'story'}
		>
			<h2>Our story</h2>
			<label
				>Heading <input bind:value={site.story.title} maxlength="60" />{@render err(
					'story.title'
				)}</label
			>
			{#each site.story.paragraphs as _, i (i)}
				<div class="with-remove">
					<label class="grow">
						Paragraph {i + 1}
						<textarea bind:value={site.story.paragraphs[i]} maxlength="400"></textarea>
						{@render err(`story.paragraphs.${i}`)}
					</label>
					{#if site.story.paragraphs.length > 1}
						<button type="button" class="remove" onclick={() => site.story.paragraphs.splice(i, 1)}
							>Remove</button
						>
					{/if}
				</div>
			{/each}
			{#if site.story.paragraphs.length < 4}
				<button
					type="button"
					class="btn ghost small add"
					onclick={() => site.story.paragraphs.push('')}
				>
					<HugeiconsIcon icon={Add01Icon} size={16} /> Add a paragraph
				</button>
			{/if}
			<div class="grid3">
				{#each site.story.stickers as _, i (i)}
					<label
						>Sticker {i + 1}
						<input bind:value={site.story.stickers[i]} maxlength="16" />{@render err(
							`story.stickers.${i}`
						)}</label
					>
				{/each}
			</div>
			<div class="photo">
				<img src={previews.story || asset(site.story.image)} alt="" width="96" height="96" />
				<label>
					Round photo in the middle
					<input
						type="file"
						name="story_image"
						accept="image/jpeg,image/png,image/webp"
						onchange={(e) => pick('story', e)}
					/>
				</label>
			</div>
		</div>

		<div
			class="card stack"
			role="tabpanel"
			id="panel-headings"
			aria-labelledby="tab-headings"
			hidden={tab !== 'headings'}
		>
			<h2>Section headings</h2>
			<div class="grid2">
				<label
					>Menu heading <input bind:value={site.menu.title} maxlength="40" />{@render err(
						'menu.title'
					)}</label
				>
				<label
					>Menu subheading <input bind:value={site.menu.subtitle} maxlength="120" />{@render err(
						'menu.subtitle'
					)}</label
				>
				<label
					>Booking heading <input bind:value={site.booking.title} maxlength="40" />{@render err(
						'booking.title'
					)}</label
				>
				<label
					>Booking subheading <input
						bind:value={site.booking.subtitle}
						maxlength="120"
					/>{@render err('booking.subtitle')}</label
				>
				<label
					>Photo strip line <input bind:value={site.tawa} maxlength="40" />{@render err(
						'tawa'
					)}</label
				>
				<label
					>Reviews heading <input bind:value={site.reviews.title} maxlength="40" />{@render err(
						'reviews.title'
					)}</label
				>
			</div>
		</div>

		<div
			class="card stack"
			role="tabpanel"
			id="panel-reviews"
			aria-labelledby="tab-reviews"
			hidden={tab !== 'reviews'}
		>
			<h2>Reviews</h2>
			<p class="hint">Only use real reviews from real customers, with their permission.</p>
			{#each site.reviews.items as _, i (i)}
				<div class="with-remove">
					<label class="grow">
						Review
						<textarea bind:value={site.reviews.items[i].text} maxlength="200"></textarea>
						{@render err(`reviews.items.${i}.text`)}
					</label>
					<label>
						Name
						<input bind:value={site.reviews.items[i].by} maxlength="40" />
						{@render err(`reviews.items.${i}.by`)}
					</label>
					<button type="button" class="remove" onclick={() => site.reviews.items.splice(i, 1)}
						>Remove</button
					>
				</div>
			{/each}
			{#if site.reviews.items.length < 12}
				<button
					type="button"
					class="btn ghost small add"
					onclick={() => site.reviews.items.push({ text: '', by: '' })}
				>
					<HugeiconsIcon icon={Add01Icon} size={16} /> Add a review
				</button>
			{/if}
		</div>

		<div
			class="card stack"
			role="tabpanel"
			id="panel-ticker"
			aria-labelledby="tab-ticker"
			hidden={tab !== 'ticker'}
		>
			<h2>Food ticker</h2>
			{@render err('ticker')}
			{#each site.ticker as t, i (i)}
				<div class="with-remove">
					<span class="icon"><HugeiconsIcon icon={foodIcons[t.icon]} size={24} /></span>
					<label class="grow"
						>Word <input bind:value={site.ticker[i].label} maxlength="24" />{@render err(
							`ticker.${i}.label`
						)}</label
					>
					<label>
						Icon
						<select bind:value={site.ticker[i].icon}>
							{#each icons as ic (ic)}<option value={ic}>{ic}</option>{/each}
						</select>
					</label>
					{#if site.ticker.length > 3}
						<button type="button" class="remove" onclick={() => site.ticker.splice(i, 1)}
							>Remove</button
						>
					{/if}
				</div>
			{/each}
			{#if site.ticker.length < 12}
				<button
					type="button"
					class="btn ghost small add"
					onclick={() => site.ticker.push({ label: '', icon: 'burger' })}
				>
					<HugeiconsIcon icon={Add01Icon} size={16} /> Add a word
				</button>
			{/if}
		</div>

		<div
			class="card stack"
			role="tabpanel"
			id="panel-call"
			aria-labelledby="tab-call"
			hidden={tab !== 'call'}
		>
			<h2>Call-to-order building</h2>
			<div class="grid2">
				<label
					>Small line above <input bind:value={site.call.kicker} maxlength="40" />{@render err(
						'call.kicker'
					)}</label
				>
				<label
					>Heading <input bind:value={site.call.title} maxlength="40" />{@render err(
						'call.title'
					)}</label
				>
			</div>
			<div class="grid3">
				{#each site.call.slogan as _, i (i)}
					<label>
						Wall slogan line {i + 1}{i === 1 ? ' (yellow)' : ''}
						<input bind:value={site.call.slogan[i]} maxlength="10" />{@render err(
							`call.slogan.${i}`
						)}
					</label>
				{/each}
			</div>
			<div class="grid2">
				<label
					>Sign top line <input bind:value={site.call.sign_top} maxlength="20" />{@render err(
						'call.sign_top'
					)}</label
				>
				<label
					>Sign big words <input bind:value={site.call.sign_big} maxlength="12" />{@render err(
						'call.sign_big'
					)}</label
				>
			</div>
		</div>

		<div
			class="card stack"
			role="tabpanel"
			id="panel-links"
			aria-labelledby="tab-links"
			hidden={tab !== 'links'}
		>
			<h2>Links and sharing</h2>
			<div class="grid2">
				<label
					>Facebook page <input
						bind:value={site.social.facebook}
						type="url"
						placeholder="https://facebook.com/…"
					/>{@render err('social.facebook')}</label
				>
				<label
					>Instagram <input
						bind:value={site.social.instagram}
						type="url"
						placeholder="https://instagram.com/…"
					/>{@render err('social.instagram')}</label
				>
				<label>
					Website address
					<input bind:value={site.seo.url} type="url" />
					<span class="hint">The address people type to reach this site.</span>
					{@render err('seo.url')}
				</label>
			</div>
			<div class="photo">
				<img
					src={previews.seo || asset(site.seo.image)}
					alt=""
					width="160"
					height="90"
					class="wide"
				/>
				<label>
					Picture shown when the link is shared
					<input
						type="file"
						name="seo_image"
						accept="image/jpeg,image/png,image/webp"
						onchange={(e) => pick('seo', e)}
					/>
				</label>
			</div>
		</div>
	</div>
</form>

<style>
	.tabbed {
		display: grid;
		gap: 16px;
		align-items: start;
	}
	.grid3 {
		display: grid;
		gap: 12px;
	}
	.with-remove {
		display: flex;
		flex-wrap: wrap;
		align-items: end;
		gap: 10px;
	}
	.grow {
		flex: 1;
		min-width: 220px;
	}
	.remove {
		min-height: 44px;
		padding: 0 12px;
		border: 0;
		border-radius: 10px;
		background: none;
		color: var(--brand);
		font: 600 0.875rem var(--sans);
		cursor: pointer;
	}
	.add {
		justify-self: start;
	}
	.icon {
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		border-radius: 10px;
		background: var(--black);
		color: var(--mustard);
	}
	.photo {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 16px;
	}
	.photo img {
		width: 96px;
		height: 96px;
		border-radius: 50%;
		object-fit: cover;
	}
	.photo img.wide {
		width: 160px;
		height: 90px;
		border-radius: 10px;
	}
	@media (min-width: 720px) {
		.grid3 {
			grid-template-columns: repeat(3, 1fr);
		}
	}
</style>

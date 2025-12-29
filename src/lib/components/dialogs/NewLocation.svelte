<script lang="ts">
	import {
		assignLocation as assignLocationFunc,
		getAvailableLocations,
		createLocation as createLocationForm
	} from '$lib/functions.remote';
	import { createLocationSchema } from '$lib/schemas';
	import type { ActivityLocation, Event } from '$lib/types/db';
	import type { AddAlert } from '$lib/types/other';
	import Icon from '@iconify/svelte';
	import { getContext } from 'svelte';

	const addAlert = getContext<AddAlert>('addAlert');

	let {
		event,
		onclose: close,
		setUpdatedLocations
	}: {
		event: Event;
		onclose: () => void;
		setUpdatedLocations: (locations: ActivityLocation[]) => void;
	} = $props();

	let actionPending = $state(false);

	async function assignLocation(locationId: number) {
		actionPending = true;
		try {
			const result = await assignLocationFunc({ eventId: event.id, locationId }).updates(
				getAvailableLocations(event.id)
			);
			addAlert({
				type: 'success',
				content: 'Miesto bolo úspešne priradené k udalosti'
			});
			setUpdatedLocations(Object.values(result.eventLocations!));
		} catch (error) {
			addAlert({
				type: 'error',
				content: 'Nastala chyba pri priraďovaní miesta k udalosti'
			});
			console.error(error);
		}
		actionPending = false;
	}
</script>

<div class="mb-4 flex">
	<div>
		<h2 class="text-2xl font-bold">Pridať nové miesto</h2>
	</div>
	<div class="ml-auto">
		{#if actionPending}
			<Icon icon="eos-icons:loading" class="size-12 animate-spin" />
		{/if}
	</div>
</div>

<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
	{#await getAvailableLocations(event.id)}
		<div class="sound-selector-block">
			<strong>Načítavanie dostupných miest...</strong>
			<Icon icon="eos-icons:loading" class="size-16" />
		</div>
	{:then availableLocations}
		{#each availableLocations as location (location.id)}
			<div class="sound-selector-block">
				<strong>{location.name}</strong>
				<audio controls src={location.path} class="w-full"></audio>
				<span class="text-light-content">{location.content || 'Žiadny popis'}</span>
				<button
					class="btn btn-secondary"
					disabled={actionPending}
					onclick={() => {
						assignLocation(location.id);
					}}
				>
					Pridať toto miesto
				</button>
			</div>
		{/each}
		<form
			class="sound-selector-block"
			{...createLocationForm.preflight(createLocationSchema).enhance(async ({ submit }) => {
				actionPending = true;
				try {
					await submit().updates(getAvailableLocations(event.id));
					addAlert({
						type: 'success',
						content: 'Nové miesto bolo úspešne vytvorené a pridané k udalosti'
					});
				} catch (error) {
					addAlert({
						type: 'error',
						content: 'Nastala chyba pri vytváraní nového miesta'
					});
					console.error(error);
				}
				actionPending = false;
			})}
			oninput={() => createLocationForm.validate()}
			onchange={() => createLocationForm.validate()}
			enctype="multipart/form-data"
		>
			<strong>Pridať nové miesto</strong>
			<input accept="audio/*" class="mt-2" {...createLocationForm.fields.file.as('file')} />
			{#each createLocationForm.fields.file.issues() as issue (issue.message)}
				<p class="text-sm text-red-500">{issue.message}</p>
			{/each}
			<input placeholder="Názov miesta" {...createLocationForm.fields.name.as('text')} />
			{#each createLocationForm.fields.name.issues() as issue (issue.message)}
				<p class="text-sm text-red-500">{issue.message}</p>
			{/each}
			<input placeholder="Doslovný obsah zvuku" {...createLocationForm.fields.content.as('text')} />
			{#each createLocationForm.fields.content.issues() as issue (issue.message)}
				<p class="text-sm text-red-500">{issue.message}</p>
			{/each}
			<button class="btn btn-secondary mt-2" disabled={actionPending} type="submit">
				Vytvoriť nové miesto
			</button>
		</form>
	{:catch error}
		<div class="sound-selector-block">
			<strong>Chyba pri načítavaní dostupných miest</strong>
			<p class="text-red-500">{error.message}</p>
		</div>
	{/await}
</div>

<button class="btn btn-error mt-4" onclick={() => close()}> Zavrieť </button>

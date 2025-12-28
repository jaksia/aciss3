<script lang="ts">
	import { attachLocation, getAvailableLocations } from '$lib/functions.remote';
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
	let fileInput: FileList | null = $state(null);
	let locationName: string = $state('');
	let locationContent: string = $state('');

	async function assignLocation(locationId: number) {
		actionPending = true;
		const result = await attachLocation({ eventId: event.id, locationId }).updates(
			getAvailableLocations(event.id)
		);
		if (!result.success) {
			addAlert({
				type: 'error',
				content: 'Nastala chyba pri priraďovaní miesta k udalosti'
			});
			console.error(result);
			return;
		}
		addAlert({
			type: 'success',
			content: 'Miesto bolo úspešne priradené k udalosti'
		});
		setUpdatedLocations(Object.values(result.eventLocations!));
		actionPending = false;
	}

	async function createLocation() {
		if (!fileInput || fileInput.length === 0) {
			addAlert({
				type: 'warning',
				content: 'Prosím, vyberte súbor na nahratie'
			});
			return;
		} else if (fileInput.length > 1) {
			addAlert({
				type: 'warning',
				content: 'Nahrávanie viacerých súborov nie je podporované'
			});
			return;
		}
		actionPending = true;
		const formData = new FormData();
		formData.append('name', locationName);
		formData.append('content', locationContent);
		formData.append('file', fileInput[0]);
		formData.append('assignToEvent', event.id.toString());
		const response = await fetch(`/api/locations`, {
			method: 'POST',
			body: formData
		});
		actionPending = false;
		const data = await response.json();
		if (!response.ok || !data.success) {
			addAlert({
				type: 'error',
				content: 'Nastala chyba pri vytváraní nového miesta'
			});
			console.error(data);
			return;
		}
		addAlert({
			type: 'success',
			content: `Miesto "${data.location.name}" bolo úspešne vytvorené a priradené k akcii.`
		});
		fileInput = null;
		locationName = '';
		locationContent = '';
		setUpdatedLocations(data.eventLocations);
		getAvailableLocations(event.id).refresh();
	}
</script>

<div class="bg-base-100 w-11/12 max-w-2xl rounded p-6 shadow-lg">
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
			<div class="sound-selector-block">
				<strong>Pridať nové miesto</strong>
				<input type="file" accept="audio/*" class="mt-2" bind:files={fileInput} />
				<input type="text" placeholder="Názov miesta" bind:value={locationName} />
				<input type="text" placeholder="Doslovný obsah zvuku" bind:value={locationContent} />
				<button
					class="btn btn-secondary mt-2"
					disabled={actionPending}
					onclick={() => {
						createLocation();
					}}
				>
					Vytvoriť nové miesto
				</button>
			</div>
		{:catch error}
			<div class="sound-selector-block">
				<strong>Chyba pri načítavaní dostupných miest</strong>
				<p class="text-red-500">{error.message}</p>
			</div>
		{/await}
	</div>

	<button class="btn btn-error mt-4" onclick={() => close()}> Zavrieť </button>
</div>

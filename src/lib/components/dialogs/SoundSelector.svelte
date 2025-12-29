<script lang="ts">
	import { getAvailableSounds, setEventSound } from '$lib/functions.remote';
	import { configurableSoundsData } from '$lib/sounds/configurable';
	import type { CustomSound, Event } from '$lib/types/db';
	import { ConfigurableSounds } from '$lib/types/enums';
	import type { AddAlert } from '$lib/types/other';
	import Icon from '@iconify/svelte';
	import { getContext } from 'svelte';

	const addAlert = getContext<AddAlert>('addAlert');

	let {
		event,
		soundKey,
		onclose: close,
		setUpdatedEvent
	}: {
		event: Event;
		soundKey: ConfigurableSounds;
		onclose: () => void;
		setUpdatedEvent: (event: Event) => void;
	} = $props();

	let actionPending = $state(false);
	let fileInput: FileList | null = $state(null);
	let description: string = $state('');

	async function setSound(soundId: CustomSound['id'] | null) {
		actionPending = true;
		try {
			const data = await setEventSound({ eventId: event.id, soundKey, soundId });
			addAlert({
				type: 'success',
				content: 'Zvuk bol úspešne nastavený'
			});
			setUpdatedEvent(data.event!);
			close();
		} catch (error) {
			addAlert({
				type: 'error',
				content: 'Nastala chyba pri nastavovaní zvuku'
			});
			console.error(error);
		}
		actionPending = false;
	}

	async function uploadSound() {
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
		formData.append('description', description);
		formData.append('file', fileInput[0]);
		const response = await fetch(`/api/events/${event.id}/sounds/${soundKey}`, {
			method: 'POST',
			body: formData
		});
		actionPending = false;
		const data = await response.json();
		if (!response.ok || !data.success) {
			addAlert({
				type: 'error',
				content: 'Nastala chyba pri nahrávaní zvuku'
			});
			console.error(data);
			return;
		}
		addAlert({
			type: 'success',
			content: 'Zvuk bol úspešne nahratý a nastavený'
		});
		setUpdatedEvent(data.event);
		close();
	}
</script>

<div class="mb-4 flex">
	<div>
		<h2 class="text-2xl font-bold">
			Vybrať alebo nahrať nový zvuk pre <br />
			<strong>{configurableSoundsData[soundKey].adminLabel}</strong>
		</h2>
		<em class="text-sm text-gray-500">{configurableSoundsData[soundKey].adminDescription}</em>
	</div>
	<div class="ml-auto">
		{#if actionPending}
			<Icon icon="eos-icons:loading" class="size-12 animate-spin" />
		{/if}
	</div>
</div>

<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
	{#await getAvailableSounds(soundKey)}
		<div class="sound-selector-block">
			<strong>Načítavanie dostupných zvukov...</strong>
			<Icon icon="eos-icons:loading" class="size-16" />
		</div>
	{:then availableSounds}
		{#each availableSounds as sound (sound.id)}
			<div class="sound-selector-block">
				<strong>{sound.description}</strong>
				<audio controls src={sound.path} class="w-full"></audio>
				<button
					class="btn btn-secondary"
					disabled={actionPending}
					onclick={() => {
						setSound(sound.id);
					}}
				>
					Vybrať tento zvuk
				</button>
			</div>
		{/each}
		<div class="sound-selector-block">
			<strong>Nahrať nový zvuk</strong>
			<input type="file" accept="audio/*" class="mt-2" bind:files={fileInput} />
			<input type="text" placeholder="Popis zvuku" bind:value={description} />
			<button
				class="btn btn-secondary mt-2"
				disabled={actionPending}
				onclick={() => {
					uploadSound();
				}}
			>
				Nahrať a použiť tento zvuk
			</button>
		</div>
		{#if !configurableSoundsData[soundKey].required && event.sounds[soundKey]}
			<div class="sound-selector-block">
				<strong>Odstrániť aktuálny zvuk</strong>
				<button
					class="btn btn-error mt-2"
					disabled={actionPending}
					onclick={() => {
						setSound(null);
					}}
				>
					Odstrániť zvuk
				</button>
			</div>
		{/if}
	{:catch error}
		<div class="sound-selector-block">
			<strong>Chyba pri načítavaní dostupných zvukov</strong>
			<p class="text-red-500">{error.message}</p>
		</div>
	{/await}
</div>

<button class="btn btn-error mt-4" onclick={() => close()}> Zavrieť </button>

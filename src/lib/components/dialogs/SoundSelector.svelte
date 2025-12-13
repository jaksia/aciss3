<script lang="ts">
	import { configurableSoundsData } from '$lib/sounds/configurable';
	import type { CustomSound, Event } from '$lib/types/db';
	import { ConfigurableSounds } from '$lib/types/enums';
	import Icon from '@iconify/svelte';

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

	async function fetchAvailableSounds(): Promise<{ sounds: CustomSound[] }> {
		const response = await fetch(`/api/sounds?key=${soundKey}`);
		const data = await response.json();
		if (!response.ok || !data.success) {
			throw new Error('Chyba pri načítavaní dostupných zvukov');
		}
		return data;
	}

	async function setSound(soundId: CustomSound['id'] | null) {
		actionPending = true;
		const response = await fetch(`/api/events/${event.id}/sounds/${soundKey}`, {
			method: soundId ? 'PUT' : 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			},
			body: soundId ? JSON.stringify({ soundId }) : null
		});
		const data = await response.json();
		if (!response.ok || !data.success) {
			alert('Chyba pri nastavovaní zvuku');
			console.error(data);
			actionPending = false;
			return;
		}
		setUpdatedEvent(data.event);
		close();
	}

	async function uploadSound() {
		if (!fileInput || fileInput.length === 0) {
			alert('Prosím, vyberte súbor na nahratie');
			return;
		} else if (fileInput.length > 1) {
			alert('Nahrávanie viacerých súborov nie je podporované');
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
		const data = await response.json();
		if (!response.ok || !data.success) {
			alert('Chyba pri nahrávaní zvuku');
			console.error(data);
			actionPending = false;
			return;
		}
		setUpdatedEvent(data.event);
		close();
	}
</script>

<div class="w-11/12 max-w-2xl rounded bg-white p-6 shadow-lg">
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
		{#await fetchAvailableSounds()}
			<div class="sound-selector-block">
				<strong>Načítavanie dostupných zvukov...</strong>
				<Icon icon="eos-icons:loading" class="size-16" />
			</div>
		{:then availableSounds}
			{#each availableSounds.sounds as sound (sound.id)}
				<div class="sound-selector-block">
					<strong>{sound.description}</strong>
					<audio controls src={sound.path} class="w-full"></audio>
					<button
						class={['btn btn-secondary', actionPending && 'disabled']}
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
				<input
					type="text"
					placeholder="Popis zvuku"
					class="form-input rounded"
					bind:value={description}
				/>
				<button
					class={['btn btn-secondary mt-2', actionPending && 'disabled']}
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
						class={['btn btn-error mt-2', actionPending && 'disabled']}
						onclick={() => {
							setSound(null);
						}}
					>
						Odstrániť zvuk
					</button>
				</div>
			{/if}
		{/await}
	</div>

	<button class="btn btn-error mt-4" onclick={() => close()}> Zavrieť </button>
</div>

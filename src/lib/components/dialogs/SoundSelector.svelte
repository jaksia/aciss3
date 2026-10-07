<script lang="ts">
	import { getAddAlert } from '#lib/context.js';
	import { createEventSound, getAvailableSounds, setEventSound } from '#lib/functions.remote.js';
	import { configurableSoundsData } from '#lib/sounds/configurable.js';
	import { type CustomSound, type Event, ConfigurableSounds } from '#lib/types/index.js';
	import Icon from '@iconify/svelte';

	const addAlert = getAddAlert();

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
		<form
			class="sound-selector-block"
			{...createEventSound.enhance(async (form) => {
				try {
					actionPending = true;
					if (await form.submit()) {
						addAlert({
							type: 'success',
							content: `Zvuk bol úspešne nahratý a nastavený.`
						});
						setUpdatedEvent(form.result!.event!);
						close();
					} else {
						addAlert({
							type: 'error',
							content: 'Nastala chyba pri nahrávaní zvuku.'
						});
					}
				} catch (error) {
					addAlert({
						type: 'error',
						content: error instanceof Error ? error.message : 'Nastala chyba pri nahrávaní zvuku.'
					});
					console.error(error);
				} finally {
					actionPending = false;
				}
			})}
		>
			<strong>Nahrať nový zvuk</strong>
			<input accept="audio/*" class="mt-2" {...createEventSound.fields.file.as('file')} />
			{#each createEventSound.fields.file.issues() as issue (issue.message)}
				<p class="text-sm text-red-500">{issue.message}</p>
			{/each}
			<input placeholder="Popis zvuku" {...createEventSound.fields.description.as('text')} />
			{#each createEventSound.fields.description.issues() as issue (issue.message)}
				<p class="text-sm text-red-500">{issue.message}</p>
			{/each}
			<button class="btn btn-secondary mt-2" disabled={actionPending}>
				Nahrať a použiť tento zvuk
			</button>
		</form>
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

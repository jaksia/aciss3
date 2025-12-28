<script lang="ts">
	import { configurableSoundsData, getConfigurableSoundRoot } from '$lib/sounds/configurable';
	import { fixedSounds } from '$lib/sounds/fixed';
	import {
		ActivityType,
		AdditionalInfo,
		ConfigurableSounds,
		ParticipantNeeds
	} from '$lib/types/enums';
	import { NumberSounds, OtherSounds, type FixedSounds } from '$lib/types/sounds';
	import { fade } from 'svelte/transition';
	import SoundSelector from '$lib/components/dialogs/SoundSelector.svelte';
	import { getContext } from 'svelte';
	import type { EventState } from '$lib/state.svelte';
	import Icon from '@iconify/svelte';
	import NewLocation from '$lib/components/dialogs/NewLocation.svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import type { ActivityLocation } from '$lib/types/db';
	import { detachLocation } from '$lib/functions.remote';
	import type { AddAlert } from '$lib/types/other';

	const confSoundsRoot = getConfigurableSoundRoot();

	const eventState = getContext<() => EventState>('getEventState')();
	const addAlert = getContext<AddAlert>('addAlert');
	const event = $derived(eventState.event);

	const fixedSoundSections = [
		['Číselné zvuky', Object.values(NumberSounds)],
		['Iné zvuky', Object.values(OtherSounds)],
		['Potrebné veci pre účastníkov', Object.values(ParticipantNeeds)],
		['Typy aktivít', Object.values(ActivityType)],
		['Doplnkové informácie', Object.values(AdditionalInfo)]
	];

	let addLocationDialog = $state(false);
	let soundSelectorKey: ConfigurableSounds | null = $state(null);

	let pendingLocationIds = new SvelteSet<ActivityLocation['id']>();
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'Escape') {
			soundSelectorKey = null;
		}
	}}
/>

{#if soundSelectorKey}
	<div class="overlay" transition:fade={{ duration: 200 }}>
		<SoundSelector
			{event}
			soundKey={soundSelectorKey}
			onclose={() => (soundSelectorKey = null)}
			setUpdatedEvent={(newEvent) => eventState.setEvent(newEvent)}
		/>
	</div>
{/if}

{#if addLocationDialog}
	<div class="overlay" transition:fade={{ duration: 200 }}>
		<NewLocation
			{event}
			onclose={() => (addLocationDialog = false)}
			setUpdatedLocations={(newLocations) => {
				eventState.locations.clear();
				Object.values(newLocations).forEach((loc) => {
					eventState.locations.set(loc.id, loc);
				});
			}}
		/>
	</div>
{/if}

<div class="bg-base-100 text-base-content flex h-full space-x-8 p-8">
	<div class="flex flex-1 flex-col">
		<h2 class="mb-3 text-3xl font-bold">Nastaviteľné zvuky</h2>
		<div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
			{#each Object.values(ConfigurableSounds) as soundKey (soundKey)}
				{@const soundData = configurableSoundsData[soundKey]}
				<div class="mt-2 flex flex-col space-y-2">
					<strong
						>{soundData.adminLabel}
						{#if soundData.required}
							<span class="text-red-500" title="Musí byť nastavené">*</span>
						{/if}
					</strong>
					{#if soundData.adminDescription}
						<em class="text-light-content text-sm">{soundData.adminDescription}</em>
					{/if}
					<div class="flex items-center gap-4">
						<span>Aktuálne:</span>
						{#if event.sounds[soundKey]}
							<div class="flex flex-col">
								<audio controls src="{confSoundsRoot}/{event.sounds[soundKey].path}" class="w-full"
								></audio>
								<span class="text-light-content text-sm text-wrap"
									>{event.sounds[soundKey].description}</span
								>
							</div>
						{:else}
							<span class="text-red-500 italic">Zvuk nie je nastavený</span>
						{/if}
					</div>
					<button class="btn btn-secondary w-full" onclick={() => (soundSelectorKey = soundKey)}
						>Zmeniť vybraný zvuk</button
					>
				</div>
			{/each}
		</div>
		<h2 class="mt-8 mb-3 text-3xl font-bold">Miesta aktivít</h2>
		<div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
			{#each eventState.locations as [locId, location] (locId)}
				<div class="mt-2 flex flex-col space-y-2">
					<div class="flex">
						<strong>{location.name}</strong>
						{#if !location.isStatic}
							{@const isUsed = eventState.usedLocationIds.has(locId)}
							<button
								class={[
									'ml-auto cursor-pointer transition-colors',
									isUsed
										? 'text-light-content cursor-not-allowed disabled:opacity-50'
										: 'text-base-content hover:text-red-500'
								]}
								disabled={isUsed || pendingLocationIds.has(locId)}
								title={isUsed
									? 'Niektorá aktivita používa toto miesto, preto ho nie je možné odstrániť'
									: 'Odstrániť miesto z tejto akcie'}
								onclick={async () => {
									if (isUsed) return;
									pendingLocationIds.add(locId);
									const result = await detachLocation({ eventId: event.id, locationId: locId });
									if (result.success) {
										eventState.locations.clear();
										Object.values(result.eventLocations!).forEach((loc) => {
											eventState.locations.set(loc.id, loc);
										});
										addAlert({
											type: 'success',
											content: `Miesto "${location.name}" bolo úspešne odstránené z akcie.`
										});
									} else {
										addAlert({
											type: 'error',
											content: 'Nastala chyba pri odstraňovaní miesta'
										});
									}
									pendingLocationIds.delete(locId);
								}}
							>
								{#if pendingLocationIds.has(locId)}
									<Icon icon="mdi:loading" class="animate-spin text-2xl" />
								{:else}
									<Icon icon="mdi:close" class="text-2xl" />
								{/if}
							</button>
						{/if}
					</div>
					<audio
						controls
						src={location.isStatic ? location.path : `${confSoundsRoot}/${location.path}`}
						class="w-full"
					></audio>
					<span class="text-light-content text-sm text-wrap"
						>{location.content || 'Žiadny popis'}</span
					>
				</div>
			{/each}
			<div class="mt-2 flex flex-col space-y-2">
				<button
					class="btn btn-primary flex w-full items-center justify-center"
					onclick={() => (addLocationDialog = true)}
				>
					<Icon icon="mdi:plus" class="mr-2 text-2xl" />
					Pridať nové miesto
				</button>
			</div>
		</div>
	</div>
	<div class="flex flex-1 flex-col">
		<h2 class="mb-3 text-3xl font-bold">Fixné zvuky</h2>
		<div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
			{#each fixedSoundSections as [sectionTitle, soundKeys] (sectionTitle)}
				<div class="mt-2 flex flex-col space-y-2">
					<h3 class="text-2xl font-semibold">{sectionTitle}</h3>
					{#each soundKeys as soundKey (soundKey)}
						{@const sound = fixedSounds[soundKey as unknown as FixedSounds]}
						<div class="flex-col items-center space-x-4">
							{#if sound}
								<div class="flex">
									<strong>{soundKey}</strong>
									<span class="text-light-content ml-auto text-right text-sm text-wrap"
										>{sound.content}</span
									>
								</div>
								<audio controls src={sound.path} class="w-full"></audio>
							{:else}
								<div class="flex">
									<strong>{soundKey}</strong>
									<span class="text-light-content ml-auto text-right text-sm">???</span>
								</div>
								<span class="text-red-500 italic">Zvuk nebol nenájdený</span>
							{/if}
						</div>
					{/each}
				</div>
			{/each}
		</div>
	</div>
</div>

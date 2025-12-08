<script lang="ts">
	import { configurableSoundsData, getConfigurableSoundRoot } from '$lib/sounds/configurable';
	import { fixedSounds } from '$lib/sounds/fixed';
	import {
		ActivityType,
		AdditionalInfo,
		ActivityLocation,
		ConfigurableSounds,
		ParticipantNeeds
	} from '$lib/types/enums';
	import { NumberSounds, OtherSounds, type FixedSounds } from '$lib/types/sounds';
	import { fade } from 'svelte/transition';
	import SoundSelector from '$lib/components/dialogs/SoundSelector.svelte';
	import { getContext } from 'svelte';
	import type { EventState } from '$lib/state.svelte';

	const confSoundsRoot = getConfigurableSoundRoot();

	const eventState = getContext<() => EventState>('getEventState')();
	const event = $derived(eventState.event);

	const fixedSoundSections = [
		['Číselné zvuky', Object.values(NumberSounds)],
		['Iné zvuky', Object.values(OtherSounds)],
		['Potrebné veci pre účastníkov', Object.values(ParticipantNeeds)],
		['Typy aktivít', Object.values(ActivityType)],
		['Doplnkové informácie', Object.values(AdditionalInfo)],
		['Miesta aktivít', Object.values(ActivityLocation)]
	];

	let soundSelectorKey: ConfigurableSounds | null = $state(null);
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
			setUpdatedEvent={(newEvent) => (eventState.setEvent(newEvent))}
		/>
	</div>
{/if}

<div class="flex h-full space-x-8 p-8">
	<div class="flex flex-1 flex-col">
		<h2 class="mb-3 text-3xl font-bold">Nastaviteľné zvuky</h2>
		<div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
			{#each Object.values(ConfigurableSounds) as soundKey}
				{@const soundData = configurableSoundsData[soundKey]}
				<div class="mt-2 flex flex-col space-y-2">
					<strong
						>{soundData.adminLabel}
						{#if soundData.required}
							<span class="text-red-500" title="Musí byť nastavené">*</span>
						{/if}
					</strong>
					{#if soundData.adminDescription}
						<em class="text-sm text-gray-500">{soundData.adminDescription}</em>
					{/if}
					<div class="flex items-center gap-4">
						<span>Aktuálne:</span>
						{#if event.sounds[soundKey]}
							<div class="flex flex-col">
								<audio controls src="{confSoundsRoot}/{event.sounds[soundKey].path}" class="w-full"
								></audio>
								<span class="text-sm text-wrap">{event.sounds[soundKey].description}</span>
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
	</div>
	<div class="flex flex-1 flex-col">
		<h2 class="mb-3 text-3xl font-bold">Fixné zvuky</h2>
		<div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
			{#each fixedSoundSections as [sectionTitle, soundKeys]}
				<div class="mt-2 flex flex-col space-y-2">
					<h3 class="text-2xl font-semibold">{sectionTitle}</h3>
					{#each soundKeys as soundKey}
						{@const sound = fixedSounds[soundKey as unknown as FixedSounds]}
						<div class="flex-col items-center space-x-4">
							{#if sound}
								<div class="flex">
									<strong>{soundKey}</strong>
									<span class="ml-auto text-right text-sm text-wrap">{sound.content}</span>
								</div>
								<audio controls src={sound.path} class="w-full"></audio>
							{:else}
								<div class="flex">
									<strong>{soundKey}</strong>
									<span class="ml-auto text-right text-sm">???</span>
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

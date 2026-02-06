<script lang="ts">
	import { dev } from '$app/environment';
	import { page } from '$app/state';
	import type { EventState } from '$lib/state.svelte';
	import { SoundProcessor } from '$lib/sounds/processor.svelte';
	import type { Activity } from '$lib/types/db';
	import { ConfigurableSounds } from '$lib/types/enums';
	import { getContext } from 'svelte';

	const debug = dev || page.url.searchParams.has('debug');

	const eventState = getContext<() => EventState>('getEventState')();

	const soundProcessor = new SoundProcessor(eventState.event, eventState);

	const [currentActivity, nextActivity] = $derived.by<[Activity | null, Activity | null]>(() => {
		const now = eventState.now;
		const activities = eventState.activityList
			.filter((a) => a.startTime.toDateString() === now.toDateString())
			.sort(
				(a, b) =>
					a.startTime.valueOf() +
					(a.delay ?? 0) * 60000 -
					(b.startTime.valueOf() + (b.delay ?? 0) * 60000)
			);

		const current = activities.find((a) => {
			const activityStartTime = new Date(a.startTime.valueOf() + (a.delay ?? 0) * 60000);
			const activityEndTime = new Date(a.endTime.valueOf() + (a.delay ?? 0) * 60000);

			return activityStartTime <= now && now <= activityEndTime;
		});
		const upcoming = activities.find((a) => {
			const activityTime = new Date(a.startTime.valueOf() + (a.delay ?? 0) * 60000);
			return activityTime > now;
		});

		return [current ?? null, upcoming ?? null];
	});

	const activityStartTime = $derived.by(() => {
		if (!nextActivity) return null;
		return new Date(nextActivity.startTime.getTime() + (nextActivity.delay ?? 0) * 60000);
	});

	let initialized = $state(false);
	function init() {
		if (initialized) return;
		initialized = true;
		soundProcessor.setAudioContext(new AudioContext());
		soundProcessor.preloadSounds();
		eventState.attachSoundProcessor(soundProcessor);
	}
</script>

<svelte:window onclick={init} />

{#if !soundProcessor._validConfiguration}
	<div class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 text-white">
		<h2 class="mb-4 text-3xl">Zvukový systém nie je správne nakonfigurovaný</h2>
		<p class="text-lg italic">Akcii pravdepodobne chýbajú vyžadované zvuky</p>
	</div>
{/if}

{#if !initialized}
	<div class="fixed inset-0 flex flex-col items-center justify-center bg-black/50 text-white">
		<h2 class="mb-4 text-3xl">Kliknite kdekoľvek pre spustenie zvukového systému</h2>
		<p class="text-lg italic">(z dôvodu obmedzení prehliadača)</p>
	</div>
{/if}

{#if currentActivity}
	<div class="flex grow bg-black"></div>
{:else if nextActivity}
	<div class="flex grow bg-white">
		<div class="visual my-[10%] ml-[15%] grow">
			<div class="row">
				<div class="col">
					<div class="label">Začiatok</div>
					<div
						class={[
							'value',
							soundProcessor._currentSound?.key === ConfigurableSounds.ZVOLAVACKA ? 'blinking' : ''
						]}
					>
						{#if activityStartTime}
							{activityStartTime.getHours().toString().padStart(2, '0')}:{activityStartTime
								.getMinutes()
								.toString()
								.padStart(2, '0')}
						{:else}
							--:--
						{/if}
					</div>
				</div>
				<div class="col">
					<div class="label">Program</div>
					<div class="value">
						{nextActivity.type}
					</div>
				</div>
				<div class="col">
					{#if nextActivity.delay}
						<div class="label">Meškanie</div>
						<div class="value text-red-500 normal-case">
							{nextActivity.delay}min
						</div>
					{/if}
				</div>
			</div>
			<div class="row">
				<dov class="col">
					<div class="label">Miesto</div>
					<div class="value">
						{nextActivity.location.name}
					</div>
				</dov>
			</div>

			{#if nextActivity.participantNeeds}
				<div class="row"></div>
			{/if}
		</div>
	</div>
{:else}
	<div class="grow bg-black"></div>
{/if}

{#if debug}
	<div class="fixed top-32 left-16 border-2 border-red-500 p-2 text-red-500">
		<strong>{eventState.now.toLocaleTimeString('sk-SK')}</strong>
	</div>
	<div
		class="fixed top-32 right-16 bottom-32 flex w-lg flex-col border-2 border-blue-500 text-blue-500"
	>
		<h3 class="p-4 text-2xl font-bold">Sound Alert Schedule</h3>
		<div class="flex-1 overflow-y-auto p-4">
			{#each Array.from(soundProcessor._scheduledAlerts.entries()).toSorted((a, b) => Number(a[0]) - Number(b[0])) as [timestamp, alerts] (timestamp)}
				<div class="mb-4">
					<div class="mb-2 font-bold">
						{new Date(timestamp).toLocaleString('sk-SK')}
					</div>
					<ul class="list-inside list-disc">
						{#each alerts as alert (alert)}
							<li>
								{alert.id} - Sounds: <i>{alert.sounds.map((s) => s.content).join(' ')}</i>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>
	</div>

	<div
		class="fixed bottom-4 mx-[5%] flex h-28 w-9/10 flex-col border-2 border-green-500 text-green-500"
	>
		<div class="flex-1 overflow-y-auto p-4">
			{#each soundProcessor._alertQueue as alert (alert)}
				<div class="mb-0.5 border-b border-dotted border-green-300 pb-0.5">
					{#each alert.sounds as sound (sound)}
						<span
							class={[
								'mr-1',
								sound.done && 'italic',
								sound.done === 'error' && 'text-red-500',
								sound.active && 'flashing'
							]}>{sound.content}</span
						>
					{/each}
				</div>
			{/each}
		</div>
	</div>
{/if}

<style>
	.flashing {
		animation: flash 0.4s infinite;
	}

	@keyframes flash {
		0%,
		100% {
			background-color: var(--color-amber-500);
		}
		50% {
			background-color: transparent;
		}
	}

	.blinking {
		animation: blink 1s infinite;
	}

	@keyframes blink {
		0%,
		49% {
			opacity: 1;
		}
		50%,
		100% {
			opacity: 0;
		}
	}
</style>

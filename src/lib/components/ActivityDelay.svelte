<script lang="ts">
	import type { EventState } from '$lib/state.svelte';
	import type { Activity } from '$lib/types/db';
	import type { AddAlert } from '$lib/types/other';
	import Icon from '@iconify/svelte';
	import { getContext } from 'svelte';

	const eventState = getContext<() => EventState>('getEventState')();
	const addAlert = getContext<AddAlert>('addAlert');

	let {
		activity,
		onclose
	}: {
		activity: Activity;
		onclose: () => void;
	} = $props();

	// svelte-ignore state_referenced_locally
	let delayInput = $state(activity.delay ?? 0);
	let announceDelay = $state(true);
	let savePending = $state(false);

	async function onsave() {
		if (!delayInput || delayInput <= (activity.delay ?? 0) || savePending) return;
		savePending = true;
		const response = await fetch(`/api/events/${activity.eventId}/activities/${activity.id}`, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				action: 'setDelay',
				delay: delayInput,
				announceDelay: announceDelay
			})
		});

		const data = await response.json();
		if (!response.ok || !data.success) {
			addAlert({
				type: 'error',
				content: `Nastala chyba pri ukladaní meškania.`
			});
			console.error(await response.json());
		} else {
			eventState.setActivity(activity.id, data.activity);
			if (announceDelay) {
				eventState.playerControl({
					type: 'delayAnnouncement',
					delayMinutes: delayInput
				});
			}
			addAlert({
				type: 'success',
				content: `Doba meškania pre "${activity.name}" bola nastavená na ${delayInput} minút. ${announceDelay ? '<br>Zmena bude ohlásená.' : ''}`
			});
		}
		savePending = false;
	}
</script>

<div class="min-w-64 rounded bg-white shadow-lg shadow-black/30">
	<div class="flex border-b border-dotted p-4">
		<h3 class="text-xl font-bold">Meškanie</h3>
		<div class="ml-auto flex items-center gap-1 text-2xl">
			<button
				class={['ea-top-btn', savePending && 'cursor-wait!']}
				title="Uložiť"
				disabled={delayInput <= (activity.delay ?? 0) || savePending}
				onclick={onsave}
			>
				<Icon icon="mdi:content-save" />
			</button>
			<button class="ea-top-btn" title="Zavrieť" onclick={onclose}>
				<Icon icon="mdi:close" />
			</button>
		</div>
	</div>
	<div class="space-y-4 p-4">
		<div>
			<strong>Aktuálne:</strong>
			<span>{activity.delay ?? '---'} minút</span>
		</div>
		<div class="space-y-1">
			<label for="delay-input" class="font-semibold">Nové meškanie:</label>
			<input
				id="delay-input"
				type="number"
				min="0"
				class="form-input rounded"
				bind:value={delayInput}
			/>
		</div>
		<div class="flex items-center justify-center">
			<input
				id="announce-delay"
				type="checkbox"
				class="form-checkbox rounded"
				bind:checked={announceDelay}
			/>
			<label for="announce-delay" class="ml-2">Hlásiť zmenu meškania</label>
		</div>
	</div>
	{#if delayInput < (activity.delay ?? 0)}
		<div class="flex flex-col items-center border-t border-dotted p-4 text-center">
			<strong class="text-red-500">Nie je možné znížiť meškanie!</strong>
			<em class="text-xs">Ak to naozaj potrebujete, dá sa zmeniť pri úprave aktivity.</em>
		</div>
	{/if}
</div>

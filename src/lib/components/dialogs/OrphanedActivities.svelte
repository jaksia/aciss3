<script lang="ts">
	import type { Activity, Event } from '$lib/types/db';
	import Icon from '@iconify/svelte';
	import { getContext } from 'svelte';

	const openAcitvityEditor: (activityId: Activity['id']) => void = getContext('openActivityEditor');
	const openActivityDeletor: (activityID: Activity['id']) => void =
		getContext('openActivityDeletor');

	let {
		event,
		orphanedActivities,
		onclose: close
	}: {
		event: Event;
		orphanedActivities: Activity[];
		onclose: () => void;
	} = $props();
</script>

<div class="w-11/12 max-w-2xl rounded bg-white p-6 shadow-lg">
	<h2 class="mb-4 text-xl font-semibold">Opustené aktivity</h2>
	{#if orphanedActivities.length === 0}
		<p>Neboli nájdené žiadne opustené aktivity.</p>
	{:else}
		<p class="mb-4">
			Nasledujúce aktivity sú mimo trvania udalosti "<strong>{event.name}</strong>".<br />
			Odporúčame ich upraviť alebo odstrániť.
		</p>
		<ul
			class="mb-4 max-h-96 divide-x divide-gray-300 overflow-y-auto rounded border border-gray-300"
		>
			{#each orphanedActivities as activity (activity.id)}
				<li class="flex items-center justify-between px-4 py-2 even:bg-gray-100">
					<div>
						<strong>{activity.name}</strong><br />
						<small class="text-gray-600">
							{new Date(activity.startTime).toLocaleString('sk-SK', { timeStyle: 'short' })}
							–
							{new Date(activity.endTime).toLocaleString('sk-SK', { timeStyle: 'short' })}
						</small>
					</div>
					<div class="text-2xl">
						<button
							class="ea-top-btn hover:text-red-500"
							title="Vymazať"
							onclick={() => openActivityDeletor(activity.id)}
						>
							<Icon icon="mdi:trash-can-outline" />
						</button>
						<button
							class="ea-top-btn"
							title="Upraviť"
							onclick={() => openAcitvityEditor(activity.id)}
						>
							<Icon icon="mdi:pencil-outline" />
						</button>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
	<button type="button" class="btn btn-secondary" onclick={close}>Zavrieť</button>
</div>

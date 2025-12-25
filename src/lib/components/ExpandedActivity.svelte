<script lang="ts">
	import { clickOutside } from '$lib/utils';
	import type { Activity } from '$lib/types/db';
	import Icon from '@iconify/svelte';
	import { getContext } from 'svelte';
	import ActivityDelay from './ActivityDelay.svelte';
	import { fly } from 'svelte/transition';
	import type { EventState } from '$lib/state.svelte';
	import { SvelteDate } from 'svelte/reactivity';

	const eventState = getContext<() => EventState>('getEventState')();
	const openActivityEditor: (activityId: Activity['id']) => void = getContext('openActivityEditor');
	const openActivityDeletor: (activityID: Activity['id']) => void =
		getContext('openActivityDeletor');

	let {
		activity,
		activityElem,
		close,
		right
	}: { activity: Activity; activityElem?: HTMLElement; close: () => void; right: boolean } =
		$props();

	const elems = $derived(
		1 +
			(activity.additionalInfos.length > 0 ? 1 : 0) +
			(activity.participantNeeds.length > 0 ? 1 : 0)
	);

	let delayDialog = $state(false);

	const tzOffset = $derived(
		eventState.now.getTimezoneOffset() - activity.startTime.getTimezoneOffset()
	);
	const actualStartTime = $derived.by(() => {
		const startTime = new SvelteDate(activity.startTime);
		startTime.setMinutes(activity.startTime.getMinutes() + tzOffset);
		return startTime;
	});
	const actualEndTime = $derived.by(() => {
		const endTime = new SvelteDate(activity.endTime);
		endTime.setMinutes(activity.endTime.getMinutes() + tzOffset);
		return endTime;
	});
</script>

<div
	class={['rounded bg-white shadow-lg shadow-black/30', elems > 1 ? 'min-w-lg' : 'min-w-64']}
	use:clickOutside={{
		callback: (e) => {
			if (e.target === activityElem || (e.target as HTMLElement)?.classList.contains('activity'))
				return;
			if (document.querySelector('.overlay')) return;

			if (delayDialog) delayDialog = false;
			else close();
		}
	}}
>
	<div class="flex border-b border-dotted p-4">
		<h3 class="text-xl font-bold">{activity.name}</h3>
		<div class="ml-auto flex items-center gap-1 text-2xl">
			<button class="ea-top-btn" title="Meškanie" onclick={() => (delayDialog = true)}>
				<Icon icon="mdi:timer-sand" />
			</button>
			<button
				class="ea-top-btn hover:text-red-500"
				title="Vymazať"
				onclick={() => openActivityDeletor(activity.id)}
			>
				<Icon icon="mdi:trash-can-outline" />
			</button>
			<button class="ea-top-btn" title="Upraviť" onclick={() => openActivityEditor(activity.id)}>
				<Icon icon="mdi:pencil-outline" />
			</button>
		</div>
	</div>
	<div
		class={[
			'grid divide-x divide-y divide-dotted',
			elems > 1 ? 'grid-cols-2' : 'grid-cols-1',
			elems == 3 ? '*:last:col-span-2' : ''
		]}
	>
		<ul class="space-y-2 p-4">
			<li>
				<Icon icon="mdi:calendar" class="mr-0.5 inline-block text-xl" />
				<span
					>{actualStartTime.toLocaleTimeString('sk-SK')}
					- {actualEndTime.toLocaleTimeString('sk-SK')}</span
				>
			</li>
			<div class="flex justify-between">
				<li>
					<Icon icon="mdi:clock-outline" class="mr-0.5 inline-block text-xl" />
					<span
						>{Math.floor((actualEndTime.getTime() - actualStartTime.getTime()) / (1000 * 60))}
						minút</span
					>
				</li>
				{#if activity.delay}
					<li class="font-bold text-red-500">
						<span>{activity.delay} minút</span>
						<Icon icon="mdi:timer-sand" class="mr-0.5 inline-block text-xl" />
					</li>
				{/if}
			</div>
			<li>
				<Icon icon="mdi:map-marker" class="mr-0.5 inline-block text-xl" />
				<span>{activity.location?.name ?? activity.locationId}</span>
			</li>
			<li>
				<Icon icon="mdi:question-box-multiple-outline" class="mr-0.5 inline-block text-xl" />
				<span>{activity.type}</span>
			</li>
		</ul>
		{#if activity.participantNeeds.length > 0}
			<div class="p-4">
				<h5 class="mb-2 font-bold">Účastníci potrebujú:</h5>
				<div class="text-sm">
					{#each activity.participantNeeds as need, i (i)}
						{i > 0 ? ', ' : ''}
						<span class="text-nowrap">{need.need}</span>
					{/each}
				</div>
			</div>
		{/if}
		{#if activity.additionalInfos.length > 0}
			<div class="p-4">
				<h5 class="mb-2 font-bold">Dodatočné informácie:</h5>
				<div class="text-sm">
					{#each activity.additionalInfos as info, i (i)}
						{i > 0 ? ', ' : ''}
						<span class="text-nowrap">{info.info}</span>
					{/each}
				</div>
			</div>
		{/if}
	</div>

	{#if delayDialog}
		<div
			class={['absolute top-0 z-10 cursor-default', right ? 'right-full mr-2' : 'left-full ml-2']}
			transition:fly={{
				x: right ? 20 : -20,
				duration: 150
			}}
		>
			<ActivityDelay {activity} onclose={() => (delayDialog = false)} />
		</div>
	{/if}
</div>

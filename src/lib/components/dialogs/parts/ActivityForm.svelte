<script lang="ts">
	import type { EventState } from '$lib/state.svelte';
	import type { Activity, EditableActivity, Event } from '$lib/types/db';
	import {
		ActivityLocation,
		ActivityType,
		AdditionalInfo,
		ParticipantNeeds
	} from '$lib/types/enums';
	import Icon from '@iconify/svelte';
	import { getContext } from 'svelte';
	import { SvelteDate } from 'svelte/reactivity';

	const eventState = getContext<() => EventState>('getEventState')();

	let {
		event,
		disabled = false,
		initialActivity,
		editableActivity = $bindable(),
		valid = $bindable(false)
	}: {
		event: Event;
		disabled?: boolean;
		initialActivity?: Activity;
		editableActivity?: EditableActivity;
		valid?: boolean;
	} = $props();

	// svelte-ignore state_referenced_locally
	const initDay = initialActivity
		? new SvelteDate(initialActivity.startTime).setHours(0, 0, 0, 0).valueOf()
		: event.startDate.valueOf();

	// svelte-ignore state_referenced_locally
	editableActivity = {
		name: initialActivity?.name || '',
		type: initialActivity?.type || ActivityType.GAME_INSIDE,
		location: initialActivity?.location || ActivityLocation.SPOLOCENSKA,

		day: initDay,
		startTime: initialActivity
			? new SvelteDate(initialActivity.startTime)
			: new SvelteDate(new SvelteDate(initDay).setHours(8, 0, 0, 0)),
		endTime: initialActivity
			? new SvelteDate(initialActivity.endTime)
			: new SvelteDate(new SvelteDate(initDay).setHours(9, 0, 0, 0)),

		delay: initialActivity?.delay || null,
		zvolavanie: initialActivity?.zvolavanie || true,

		additionalInfos: initialActivity?.additionalInfos.map((ai) => ai.info) || [],
		alertTimes: initialActivity?.alertTimes.map((at) => at.minutes) || [30, 15, 10, 5],
		participantNeeds: initialActivity?.participantNeeds.map((pn) => pn.need) || []
	};

	const days = $derived.by(() => {
		if (!event) return [];
		const days = [];
		for (let d = new SvelteDate(event.startDate); d <= event.endDate; d.setDate(d.getDate() + 1)) {
			days.push(new SvelteDate(d));
		}
		return days;
	});

	const tzOffset = $derived.by(() => {
		const dayDate = new SvelteDate(editableActivity.day);
		dayDate.setUTCHours(12, 0, 0, 0); // set to noon to avoid DST issues
		return eventState.now.getTimezoneOffset() - dayDate.getTimezoneOffset();
	});

	$effect(() => {
		let isValid = true;
		if (!editableActivity.name.trim()) isValid = false;
		if (editableActivity.endTime <= editableActivity.startTime) isValid = false;

		// check that day is within event dates
		const dayDate = new SvelteDate(editableActivity.day);
		const eventStartDate = new SvelteDate(event.startDate);
		const eventEndDate = new SvelteDate(event.endDate);
		dayDate.setHours(0, 0, 0, 0);
		eventStartDate.setHours(0, 0, 0, 0);
		eventEndDate.setHours(0, 0, 0, 0);
		if (dayDate < eventStartDate || dayDate > eventEndDate) isValid = false;

		valid = isValid;
	});
</script>

<div class="grid gap-4 border-b border-dotted pb-4 lg:grid-cols-2">
	<div class="col-span-2">
		<label class="mb-2 block font-medium" for="activity-name">Názov aktivity</label>
		<input
			id="activity-name"
			class="form-input w-full rounded"
			type="text"
			{disabled}
			bind:value={editableActivity.name}
		/>
	</div>
	<div>
		<label class="mb-2 block font-medium" for="activity-type">Typ aktivity</label>
		<select
			id="activity-type"
			class="form-select w-full rounded"
			{disabled}
			bind:value={editableActivity.type}
		>
			{#each Object.values(ActivityType) as type (type)}
				<option value={type}>{type}</option>
			{/each}
		</select>
	</div>
	<div>
		<label class="mb-2 block font-medium" for="activity-location">Miesto konania</label>
		<select
			id="activity-location"
			class="form-select w-full rounded"
			{disabled}
			bind:value={editableActivity.location}
		>
			{#each Object.values(ActivityLocation) as location (location)}
				<option value={location}>{location}</option>
			{/each}
		</select>
	</div>
	<div>
		<label class="mb-2 block font-medium" for="activity-day">Deň akcie</label>
		<select
			id="activity-day"
			class="form-select w-full rounded"
			{disabled}
			bind:value={
				() => editableActivity.day,
				(value: number) => {
					const dayDate = new SvelteDate(value);
					dayDate.setHours(0, 0, 0, 0);
					editableActivity.day = dayDate.valueOf();
					editableActivity.startTime.setFullYear(
						dayDate.getFullYear(),
						dayDate.getMonth(),
						dayDate.getDate()
					);
					editableActivity.endTime.setFullYear(
						dayDate.getFullYear(),
						dayDate.getMonth(),
						dayDate.getDate()
					);
				}
			}
		>
			{#each days as day, index (day)}
				<option value={day.valueOf()}>
					Deň {index} - {day.toLocaleDateString('sk-SK')}
				</option>
			{/each}
		</select>
	</div>
	<div>
		<label class="mb-2 block font-medium" for="activity-end-time">Čas</label>
		<div class="flex items-center gap-2">
			<input
				id="activity-start-time"
				class="form-input grow rounded"
				type="time"
				{disabled}
				bind:value={
					() => {
						const startTime = new SvelteDate(editableActivity.startTime);
						startTime.setMinutes(
							startTime.getMinutes() + tzOffset
						); /* adjust for timezone offset */
						const hours = startTime.getHours().toString().padStart(2, '0');
						const minutes = startTime.getMinutes().toString().padStart(2, '0');
						return `${hours}:${minutes}`;
					},
					(value: string) => {
						const [hours, minutes] = value.split(':').map(Number);
						editableActivity.startTime.setHours(hours, minutes - tzOffset, 0, 0);
					}
				}
			/>
			-
			<input
				id="activity-end-time"
				class="form-input grow rounded"
				type="time"
				{disabled}
				bind:value={
					() => {
						const endTime = new SvelteDate(editableActivity.endTime);
						endTime.setMinutes(endTime.getMinutes() + tzOffset); /* adjust for timezone offset */
						const hours = endTime.getHours().toString().padStart(2, '0');
						const minutes = endTime.getMinutes().toString().padStart(2, '0');
						return `${hours}:${minutes}`;
					},
					(value: string) => {
						const [hours, minutes] = value.split(':').map(Number);
						editableActivity.endTime.setHours(hours, minutes - tzOffset, 0, 0);
					}
				}
			/>
		</div>
		{#if editableActivity.endTime <= editableActivity.startTime}
			<p class="mt-1 text-sm text-red-600">Čas konca musí byť neskôr ako čas začiatku.</p>
		{/if}
	</div>
	<div>
		<label class="mb-2 block font-medium" for="activity-delay">Meškanie (minúty)</label>
		<input
			id="activity-delay"
			class="form-input w-full rounded"
			type="number"
			min="0"
			{disabled}
			bind:value={editableActivity.delay}
		/>
		<p class="mt-1 text-sm text-gray-600">Prázdne pole znamená aktivitu bez meškania.</p>
	</div>
	<div>
		<label class="mb-2 block font-medium" for="activity-zvolavanie">Zvolávanie účastníkov</label>
		<input
			id="activity-zvolavanie"
			type="checkbox"
			class="form-checkbox rounded"
			{disabled}
			bind:checked={editableActivity.zvolavanie}
		/>
		<p class="mt-1 text-sm text-gray-600">
			Pri večierke použije zvuk 'večerníček'. Ak je budíček bez zvolávania nič nebude robiť.
		</p>
	</div>
</div>
<div class="flex border-b border-dotted p-4">
	<div>
		<h3 class="mb-2 text-lg font-semibold">Časy hlásení</h3>
		<p class="text-sm text-gray-600">V minútach pred začiatkom aktivity.</p>
	</div>
	<div class="ml-4 flex flex-wrap gap-2">
		{#each editableActivity.alertTimes as alertTime, index (index)}
			<div class="flex items-center gap-2 rounded bg-gray-200 px-1.5 py-1">
				<input
					type="number"
					min="0"
					class="w-16 rounded bg-transparent text-center"
					bind:value={editableActivity.alertTimes[index]}
				/>
				<button
					type="button"
					class="text-xl text-red-600 hover:text-red-800"
					onclick={() => {
						editableActivity.alertTimes.splice(index, 1);
					}}
				>
					<Icon icon="mdi:trash-can-outline" />
				</button>
			</div>
		{/each}
		<button
			type="button"
			class="btn btn-secondary text-3xl"
			onclick={() => {
				editableActivity.alertTimes.push(5);
			}}
		>
			<Icon icon="mdi:plus" />
		</button>
	</div>
</div>
<div class="grid lg:grid-cols-2">
	<div class="p-4">
		<h3 class="mb-2 text-lg font-semibold">Potreby účastníkov</h3>
		<ul class="list-disc px-5">
			{#each editableActivity.participantNeeds as need, index (index)}
				<li>
					<div class="flex w-full items-center">
						<span>{need}</span>
						<button
							type="button"
							class="ml-auto cursor-pointer text-red-600 hover:text-red-800"
							onclick={() => {
								editableActivity.participantNeeds.splice(index, 1);
							}}
						>
							<Icon icon="mdi:trash-can-outline" width="20" height="20" />
						</button>
					</div>
				</li>
			{/each}
		</ul>
		<div class="mt-2 flex gap-2">
			<select
				bind:value={
					() => '',
					(value: string) => {
						editableActivity.participantNeeds.push(value as ParticipantNeeds);
					}
				}
				class="form-select w-full rounded"
			>
				{#each Object.values(ParticipantNeeds) as need (need)}
					<option value={need} disabled={editableActivity.participantNeeds.includes(need)}
						>{need}</option
					>
				{/each}
			</select>
		</div>
	</div>
	<div>
		<h3 class="mt-4 mb-2 text-lg font-semibold">Dodatočné informácie</h3>
		<ul class="list-disc px-5">
			{#each editableActivity.additionalInfos as info, index (index)}
				<li>
					<div class="flex w-full items-center">
						<span>{info}</span>
						<button
							type="button"
							class="ml-auto cursor-pointer text-red-600 hover:text-red-800"
							onclick={() => {
								editableActivity.additionalInfos.splice(index, 1);
							}}
						>
							<Icon icon="mdi:trash-can-outline" width="20" height="20" />
						</button>
					</div>
				</li>
			{/each}
		</ul>
		<div class="mt-2 flex gap-2">
			<select
				bind:value={
					() => '',
					(value: string) => {
						editableActivity.additionalInfos.push(value as AdditionalInfo);
					}
				}
				class="form-select w-full rounded"
			>
				{#each Object.values(AdditionalInfo) as info (info)}
					<option value={info} disabled={editableActivity.additionalInfos.includes(info)}
						>{info}</option
					>
				{/each}
			</select>
		</div>
	</div>
</div>

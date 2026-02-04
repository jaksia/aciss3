<script lang="ts">
	import { createUpdateActivity } from '$lib/functions.remote';
	import { activityFormValidator } from '$lib/schemas';
	import type { EventState } from '$lib/state.svelte';
	import type { Activity, Event } from '$lib/types/db';
	import { ActivityType, AdditionalInfo, ParticipantNeeds } from '$lib/types/enums';
	import type { AddAlert } from '$lib/types/other';
	import Icon from '@iconify/svelte';
	import { getContext } from 'svelte';
	import { SvelteDate } from 'svelte/reactivity';

	const eventState = getContext<() => EventState>('getEventState')();
	const addAlert = getContext<AddAlert>('addAlert');

	let {
		create = true,
		event,
		disabled = $bindable(false),
		initialActivity: initialActivityProp = {},
		oncancel,
		onsave
	}: {
		create?: boolean;
		event: Event;
		disabled?: boolean;
		initialActivity?: Partial<Activity>;
		oncancel: () => void;
		onsave: (newActivity: Activity) => void;
	} = $props();

	// svelte-ignore state_referenced_locally
	const initialActivity = initialActivityProp;

	const initialHasTimes = !!initialActivity?.startTime && !!initialActivity?.endTime;

	// svelte-ignore state_referenced_locally
	let day = $state(
		initialHasTimes
			? new SvelteDate(initialActivity!.startTime!).setHours(0, 0, 0, 0).valueOf()
			: event.startDate.valueOf()
	);
	// svelte-ignore state_referenced_locally
	let startTime = initialHasTimes
		? new SvelteDate(initialActivity!.startTime!)
		: new SvelteDate(new SvelteDate(day).setHours(8, 0, 0, 0));
	// svelte-ignore state_referenced_locally
	let endTime = initialHasTimes
		? new SvelteDate(initialActivity!.endTime!)
		: new SvelteDate(new SvelteDate(day).setHours(9, 0, 0, 0));

	function initFormFromInitial() {
		if (!initialActivity) return;
		createUpdateActivity.fields.eventId.set(event.id);
		if (!create && initialActivity.id) {
			createUpdateActivity.fields.activityId.set(initialActivity.id);
		}

		createUpdateActivity.fields.activityData.name.set(initialActivity.name || '');
		createUpdateActivity.fields.activityData.type.set(
			initialActivity.type || ActivityType.GAME_INSIDE
		);
		createUpdateActivity.fields.activityData.locationId.set(
			initialActivity.locationId || Array.from(eventState.locations.keys())[0]
		);
		if (initialActivity.delay !== undefined && initialActivity.delay !== null)
			createUpdateActivity.fields.activityData.delay.set(initialActivity.delay);

		createUpdateActivity.fields.activityData.zvolavanie.set(initialActivity.zvolavanie ?? true);
		createUpdateActivity.fields.activityData.alertTimes.set(
			initialActivity.alertTimes === undefined
				? [5, 10, 15, 30]
				: initialActivity.alertTimes.map((at) => at.minutes)
		);
		createUpdateActivity.fields.activityData.participantNeeds.set(
			(initialActivity.participantNeeds || []).map((need) => need.need)
		);
		createUpdateActivity.fields.activityData.additionalInfos.set(
			(initialActivity.additionalInfos || []).map((info) => info.info)
		);
	}
	initFormFromInitial();

	$effect(() => {
		createUpdateActivity.fields.activityData.startTime.set(startTime.valueOf());
		createUpdateActivity.fields.activityData.endTime.set(endTime.valueOf());
	});

	const days = $derived.by(() => {
		if (!event) return [];
		const days = [];
		for (let d = new SvelteDate(event.startDate); d <= event.endDate; d.setDate(d.getDate() + 1)) {
			days.push(new SvelteDate(d));
			days[days.length - 1].setHours(0, 0, 0, 0);
		}
		return days;
	});

	const tzOffset = $derived.by(() => {
		const dayDate = new SvelteDate(day);
		dayDate.setUTCHours(12, 0, 0, 0); // set to noon to avoid DST issues
		return eventState.now.getTimezoneOffset() - dayDate.getTimezoneOffset();
	});

	let form = $state<HTMLFormElement | null>(null);
</script>

<form
	class="contents"
	bind:this={form}
	{...createUpdateActivity.preflight(activityFormValidator).enhance(async ({ submit }) => {
		disabled = true;
		try {
			await submit();
			const result = createUpdateActivity.result!;
			onsave(result.activity);
			addAlert({
				type: 'success',
				content: `Aktivita "${createUpdateActivity.fields.activityData.name.value()}" bola úspešne uložená.`
			});
		} catch (error) {
			addAlert({
				type: 'error',
				content: `Nastala chyba pri ukladaní aktivity "${createUpdateActivity.fields.activityData.name.value()}".`
			});
			console.error(error);
		}
		disabled = false;
	})}
	oninput={() => createUpdateActivity.validate({ preflightOnly: true })}
	onchange={() => createUpdateActivity.validate({ preflightOnly: true })}
>
	<div class="flex">
		<h2 class="mb-4 text-xl font-semibold">
			{#if create}Pridať{:else}Upraviť{/if} aktivitu
		</h2>
		<div class="ml-auto flex gap-2">
			<button
				type="button"
				class="btn btn-secondary"
				{disabled}
				onclick={() => !disabled && oncancel()}>Zrušiť</button
			>
			<button
				class="btn btn-success"
				{disabled}
				onclick={() => {
					form?.requestSubmit();
				}}
				>{#if create}Vytvoriť{:else}Uložiť{/if}</button
			>
		</div>
	</div>

	{#each createUpdateActivity.fields.allIssues() as issue (issue.message)}
		<p class="mt-1 text-sm text-red-600">{issue.path} {issue.message}</p>
	{/each}
	{#each createUpdateActivity.fields.issues() as issue (issue.message)}
		<p class="mt-1 text-sm text-red-600">{issue.message}</p>
	{/each}

	<div class="hidden">
		<input {...createUpdateActivity.fields.eventId.as('number')} />
		<input {...createUpdateActivity.fields.activityId.as('number')} />
		<input {...createUpdateActivity.fields.activityData.startTime.as('number')} />
		<input {...createUpdateActivity.fields.activityData.endTime.as('number')} />
	</div>

	<div class="grid gap-4 border-b border-dotted pb-4 lg:grid-cols-2">
		<div class="col-span-2">
			<label class="mb-2 block font-medium" for="activity-name">Názov aktivity</label>
			<input
				id="activity-name"
				class="w-full"
				{disabled}
				{...createUpdateActivity.fields.activityData.name.as('text')}
			/>
			{#each createUpdateActivity.fields.activityData.name.issues() as issue (issue.message)}
				<p class="mt-1 text-sm text-red-600">{issue.message}</p>
			{/each}
		</div>
		<div>
			<label class="mb-2 block font-medium" for="activity-type">Typ aktivity</label>
			<select
				id="activity-type"
				class="w-full"
				{disabled}
				{...createUpdateActivity.fields.activityData.type.as('select')}
			>
				{#each Object.values(ActivityType) as type (type)}
					<option value={type}>{type}</option>
				{/each}
			</select>
			{#each createUpdateActivity.fields.activityData.type.issues() as issue (issue.message)}
				<p class="mt-1 text-sm text-red-600">{issue.message}</p>
			{/each}
		</div>
		<div>
			<label class="mb-2 block font-medium" for="activity-location">Miesto konania</label>
			<select
				id="activity-location"
				class="w-full"
				{disabled}
				name={createUpdateActivity.fields.activityData.locationId.as('number').name}
			>
				{#each eventState.locations as [id, location] (id)}
					<option value={id}>{location.name}</option>
				{/each}
			</select>
			{#each createUpdateActivity.fields.activityData.locationId.issues() as issue (issue.message)}
				<p class="mt-1 text-sm text-red-600">{issue.message}</p>
			{/each}
		</div>
		<div>
			<label class="mb-2 block font-medium" for="activity-day">Deň akcie</label>
			<select
				id="activity-day"
				class="w-full"
				{disabled}
				bind:value={
					() => day,
					(value: number) => {
						const dayDate = new SvelteDate(value);
						dayDate.setHours(0, 0, 0, 0);
						day = dayDate.valueOf();
						startTime.setFullYear(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate());
						endTime.setFullYear(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate());
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
			<label class="mb-2 block font-medium" for="activity-time">Čas</label>
			<div class="flex items-center gap-2" id="activity-time">
				<input
					aria-label="Čas začiatku"
					class="grow"
					type="time"
					{disabled}
					bind:value={
						() => {
							const startTimeCopy = new SvelteDate(startTime);
							startTimeCopy.setMinutes(
								startTimeCopy.getMinutes() + tzOffset
							); /* adjust for timezone offset */
							const hours = startTimeCopy.getHours().toString().padStart(2, '0');
							const minutes = startTimeCopy.getMinutes().toString().padStart(2, '0');
							return `${hours}:${minutes}`;
						},
						(value: string) => {
							const [hours, minutes] = value.split(':').map(Number);
							startTime.setHours(hours, minutes - tzOffset, 0, 0);
						}
					}
				/>
				-
				<input
					aria-label="Čas konca"
					class="grow"
					type="time"
					{disabled}
					bind:value={
						() => {
							const endTimeCopy = new SvelteDate(endTime);
							endTimeCopy.setMinutes(
								endTimeCopy.getMinutes() + tzOffset
							); /* adjust for timezone offset */
							const hours = endTimeCopy.getHours().toString().padStart(2, '0');
							const minutes = endTimeCopy.getMinutes().toString().padStart(2, '0');
							return `${hours}:${minutes}`;
						},
						(value: string) => {
							const [hours, minutes] = value.split(':').map(Number);
							endTime.setHours(hours, minutes - tzOffset, 0, 0);
						}
					}
				/>
			</div>
			{#each createUpdateActivity.fields.activityData.startTime.issues() as issue (issue.message)}
				<p class="mt-1 text-sm text-red-600">{issue.message}</p>
			{/each}
			{#each createUpdateActivity.fields.activityData.endTime.issues() as issue (issue.message)}
				<p class="mt-1 text-sm text-red-600">{issue.message}</p>
			{/each}
		</div>
		<div>
			<label class="mb-2 block font-medium" for="activity-delay">Meškanie (minúty)</label>
			<input
				id="activity-delay"
				class="w-full"
				min="1"
				{disabled}
				{...createUpdateActivity.fields.activityData.delay.as('number')}
			/>
			<p class="text-light-content mt-1 text-sm">Prázdne pole znamená aktivitu bez meškania.</p>
			{#each createUpdateActivity.fields.activityData.delay.issues() as issue (issue.message)}
				<p class="mt-1 text-sm text-red-600">{issue.message}</p>
			{/each}
		</div>
		<div>
			<label class="mb-2 block font-medium" for="activity-zvolavanie">Zvolávanie účastníkov</label>
			<input
				id="activity-zvolavanie"
				{disabled}
				{...createUpdateActivity.fields.activityData.zvolavanie.as('checkbox')}
			/>
			<p class="text-light-content mt-1 text-sm">
				Pri večierke použije zvuk 'večerníček'. Ak je budíček bez zvolávania, nebude nič robiť.
			</p>
			{#each createUpdateActivity.fields.activityData.zvolavanie.issues() as issue (issue.message)}
				<p class="mt-1 text-sm text-red-600">{issue.message}</p>
			{/each}
		</div>
	</div>
	<div class="border-b border-dotted p-4">
		<div class="flex">
			<div>
				<h3 class="mb-2 text-lg font-semibold">Časy hlásení</h3>
				<p class="text-light-content text-sm">V minútach pred začiatkom aktivity.</p>
			</div>
			<div class="ml-4 flex flex-wrap justify-end gap-2">
				{#each createUpdateActivity.fields.activityData.alertTimes.value(), index (index)}
					<div class="bg-base-300 flex gap-2 rounded px-1.5 py-1">
						<input
							min="0"
							class="no-spinner w-16 bg-transparent text-center"
							{...createUpdateActivity.fields.activityData.alertTimes[index].as('number')}
						/>
						<button
							type="button"
							class="cursor-pointer text-xl text-red-600 hover:text-red-800"
							onclick={() => {
								const alertTimes = createUpdateActivity.fields.activityData.alertTimes.value();
								alertTimes.splice(index, 1);
								createUpdateActivity.fields.activityData.alertTimes.set(alertTimes);
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
						const alertTimes = createUpdateActivity.fields.activityData.alertTimes.value() || [];
						alertTimes.push(5);
						createUpdateActivity.fields.activityData.alertTimes.set(alertTimes);
					}}
				>
					<Icon icon="mdi:plus" />
				</button>
			</div>
		</div>
		{#each createUpdateActivity.fields.activityData.alertTimes.issues() as issue (issue.message)}
			<p class="mt-1 text-sm text-red-600">{issue.message}</p>
		{/each}
	</div>
	<div class="grid lg:grid-cols-2">
		<div class="p-4">
			<h3 class="mb-2 text-lg font-semibold">Potreby účastníkov</h3>
			<ul class="list-disc px-5">
				{#each createUpdateActivity.fields.activityData.participantNeeds.value() || [] as need, index (index)}
					<li>
						<div class="flex w-full items-center">
							<span>{need}</span>
							<button
								type="button"
								class="ml-auto cursor-pointer text-red-600 hover:text-red-800"
								onclick={() => {
									const participantNeeds =
										createUpdateActivity.fields.activityData.participantNeeds.value();
									participantNeeds.splice(index, 1);
									createUpdateActivity.fields.activityData.participantNeeds.set(participantNeeds);
								}}
							>
								<Icon icon="mdi:trash-can-outline" width="20" height="20" />
							</button>
							<input
								class="hidden"
								{...createUpdateActivity.fields.activityData.participantNeeds[index].as('text')}
							/>
						</div>
					</li>
				{/each}
			</ul>
			<div class="mt-2 flex gap-2">
				<select
					bind:value={
						() => '',
						(value: string) => {
							const participantNeeds =
								createUpdateActivity.fields.activityData.participantNeeds.value() || [];
							participantNeeds.push(value as ParticipantNeeds);
							createUpdateActivity.fields.activityData.participantNeeds.set(participantNeeds);
						}
					}
					class="form-select w-full rounded"
				>
					{#each Object.values(ParticipantNeeds) as need (need)}
						<option
							value={need}
							disabled={(
								createUpdateActivity.fields.activityData.participantNeeds.value() || []
							).includes(need)}>{need}</option
						>
					{/each}
				</select>
			</div>
		</div>
		<div>
			<h3 class="mt-4 mb-2 text-lg font-semibold">Dodatočné informácie</h3>
			<ul class="list-disc px-5">
				{#each createUpdateActivity.fields.activityData.additionalInfos.value() || [] as info, index (index)}
					<li>
						<div class="flex w-full items-center">
							<span>{info}</span>
							<button
								type="button"
								class="ml-auto cursor-pointer text-red-600 hover:text-red-800"
								onclick={() => {
									const additionalInfos =
										createUpdateActivity.fields.activityData.additionalInfos.value();
									additionalInfos.splice(index, 1);
									createUpdateActivity.fields.activityData.additionalInfos.set(additionalInfos);
								}}
							>
								<Icon icon="mdi:trash-can-outline" width="20" height="20" />
							</button>
							<input
								class="hidden"
								{...createUpdateActivity.fields.activityData.additionalInfos[index].as('text')}
							/>
						</div>
					</li>
				{/each}
			</ul>
			<div class="mt-2 flex gap-2">
				<select
					bind:value={
						() => '',
						(value: string) => {
							const additionalInfos =
								createUpdateActivity.fields.activityData.additionalInfos.value() || [];
							additionalInfos.push(value as AdditionalInfo);
							createUpdateActivity.fields.activityData.additionalInfos.set(additionalInfos);
						}
					}
					class="form-select w-full rounded"
				>
					{#each Object.values(AdditionalInfo) as info (info)}
						<option
							value={info}
							disabled={(
								createUpdateActivity.fields.activityData.additionalInfos.value() || []
							).includes(info)}>{info}</option
						>
					{/each}
				</select>
			</div>
		</div>
	</div>
</form>

<style>
	.no-spinner {
		appearance: textfield;
	}
</style>

<script lang="ts">
	import ConfirmActivityDeletion from '$lib/components/dialogs/ConfirmActivityDeletion.svelte';
	import CreateActivity from '$lib/components/dialogs/CreateActivity.svelte';
	import EditActivity from '$lib/components/dialogs/EditActivity.svelte';
	import EventSchedule from '$lib/components/EventSchedule.svelte';
	import type { EventState } from '$lib/state.svelte';
	import { styleData } from '$lib/themes';
	import type { Activity, ActivityLocation, EditableActivity } from '$lib/types/db';
	import Icon from '@iconify/svelte';
	import { getContext, onMount, setContext } from 'svelte';
	import { slide } from 'svelte/transition';
	import type { AddAlert } from '$lib/types/other';
	import OrphanedActivities from '$lib/components/dialogs/OrphanedActivities.svelte';
	import LocationSelector from '$lib/components/dialogs/LocationSelector.svelte';
	import { SvelteDate } from 'svelte/reactivity';
	import {
		deleteActivity as deleteActivityFunc,
		editActivity,
		createActivity as createActivityFunc
	} from '$lib/functions.remote';
	import SoundControl from '$lib/components/SoundControl.svelte';
	import Overlay from '$lib/components/Overlay.svelte';

	const eventState = getContext<() => EventState>('getEventState')();
	const addAlert = getContext<AddAlert>('addAlert');

	const event = $derived(eventState.event);

	let submitPending = $state(false);

	let editorActivityId: Activity['id'] | null = $state(null);
	let deletorActivityId: Activity['id'] | null = $state(null);
	let createActivity:
		| {
				startTime?: Date;
				endTime?: Date;
		  }
		| boolean = $state(false);
	let locationSelectorResolve: ((location: ActivityLocation | null) => void) | null = $state(null);
	let locationSelectorPurpose: string = $state('');
	let orphanedDialogShown = $state(false);
	let soundControlOpen = $state(false);

	setContext('openActivityCreator', (initial?: { startTime?: Date; endTime?: Date }) => {
		createActivity = initial || true;
	});
	setContext('openActivityEditor', (activityId: Activity['id']) => {
		editorActivityId = activityId;
	});
	setContext('openActivityDeletor', (activityId: Activity['id']) => {
		deletorActivityId = activityId;
	});

	async function deleteActivity(activityId: Activity['id']) {
		submitPending = true;
		try {
			await deleteActivityFunc({ eventId: event.id, activityId });
			eventState.setActivity(activityId, null);
			addAlert({
				type: 'success',
				content: `Aktivita bola úspešne zmazaná.`
			});
			deletorActivityId = null;
		} catch (error) {
			addAlert({
				type: 'error',
				content: `Nastala chyba pri mazaní aktivity.`
			});
			console.error(error);
		}
		submitPending = false;
	}

	async function createUpdateActivity(
		changedActivity: EditableActivity,
		activityId?: Activity['id']
	) {
		submitPending = true;

		try {
			let newActivity: Activity;

			if (activityId) {
				newActivity = await editActivity({
					eventId: event.id,
					activityId,
					activity: changedActivity
				});
			} else {
				newActivity = await createActivityFunc({ eventId: event.id, activity: changedActivity });
			}

			eventState.setActivity(newActivity.id, newActivity);
			editorActivityId = null;
			createActivity = false;
			addAlert({
				type: 'success',
				content: `Aktivita "${newActivity.name}" bola úspešne ${activityId ? 'upravená' : 'vytvorená'}.`
			});
		} catch (error) {
			addAlert({
				type: 'error',
				content: `Nastala chyba pri ${activityId ? 'úprave' : 'vytváraní'} aktivity.`
			});
			console.error(error);
		}

		submitPending = false;
	}

	function locationSelector(purpose: string): Promise<ActivityLocation | null> {
		locationSelectorPurpose = purpose;
		return new Promise<ActivityLocation | null>((resolve) => {
			locationSelectorResolve = (location) => {
				resolve(location);
				locationSelectorResolve = null;
				locationSelectorPurpose = '';
			};
		});
	}

	const orphanedActivities = $derived.by(() => {
		if (!eventState.event) return [];
		const eventEndDate = new SvelteDate(eventState.event.endDate).setUTCHours(23, 59, 59, 999);
		return eventState.activityList.filter((a) => {
			return a.endTime < eventState.event.startDate || a.startTime.valueOf() > eventEndDate;
		});
	});

	onMount(() => {
		if (orphanedActivities.length > 0) {
			addAlert({
				type: 'warning',
				content:
					`Táto akcia má priradené aktivity mimo jej trvania.<br>` +
					`<a id="orphaned-activities-link" class="underline text-blue-400 cursor-pointer">Klikni sem</a> pre zobrazenie detailov.`,
				timeout: 15000
			});
		}

		const endDate = new SvelteDate(event.endDate);
		endDate.setHours(12, 0, 0, 0); // set to noon to avoid DST issues

		if (event.startDate.getTimezoneOffset() !== endDate.getTimezoneOffset()) {
			addAlert({
				type: 'warning',
				content:
					`Akcia začína a končí v rôznych časových zónach (kvôli zmene letného času).<br>` +
					`AČISS by to mal zvládnuť správne spracovať, ale neodporúčam sa na to spoliehať.`,
				timeout: 15000
			});
		}
	});
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'Escape') {
			if (!editorActivityId && !deletorActivityId && !createActivity) {
				orphanedDialogShown = false;
				if (locationSelectorResolve) {
					locationSelectorResolve(null);
				}
				return;
			}

			editorActivityId = null;
			deletorActivityId = null;
			createActivity = false;
		}
	}}
	onclick={(e) => {
		const target = e.target as HTMLElement;
		if (target.id === 'orphaned-activities-link') {
			e.preventDefault();
			orphanedDialogShown = true;
		}
	}}
/>

{#if locationSelectorResolve}
	<Overlay>
		<LocationSelector
			purpose={locationSelectorPurpose}
			oncancel={() => locationSelectorResolve!(null)}
			onselect={(location: ActivityLocation) => locationSelectorResolve!(location)}
		/>
	</Overlay>
{/if}

{#if orphanedDialogShown}
	<Overlay>
		<OrphanedActivities
			{event}
			{orphanedActivities}
			onclose={() => (orphanedDialogShown = false)}
		/>
	</Overlay>
{/if}

{#if deletorActivityId}
	<Overlay>
		<ConfirmActivityDeletion
			disabled={submitPending}
			activity={eventState.activityList.find((a) => a.id === deletorActivityId)!}
			oncancel={() => (deletorActivityId = null)}
			onconfirm={() => {
				deleteActivity(deletorActivityId!);
			}}
		/>
	</Overlay>
{/if}

{#if editorActivityId}
	<Overlay>
		<EditActivity
			{event}
			disabled={submitPending}
			activity={eventState.activityList.find((a) => a.id === editorActivityId)!}
			oncancel={() => (editorActivityId = null)}
			onsave={(changedActivity: EditableActivity) => {
				createUpdateActivity(changedActivity, editorActivityId!);
			}}
		/>
	</Overlay>
{/if}

{#if createActivity}
	<Overlay>
		<CreateActivity
			{event}
			disabled={submitPending}
			initial={createActivity instanceof Object ? createActivity : undefined}
			oncancel={() => (createActivity = false)}
			onsave={(newActivity: EditableActivity) => {
				createUpdateActivity(newActivity);
			}}
		/>
	</Overlay>
{/if}

<div class="mb-4 flex justify-end">
	<div
		class="rounded-bl-lg p-2 pt-0 text-white"
		style="background-color: {styleData[event.style].primaryColor};"
	>
		<button class="btn border-0! hover:bg-black/20" onclick={() => (createActivity = true)}>
			Pridať aktivitu
		</button>
		<div class="group relative inline-block">
			<button
				class="btn ml-1 inline-flex items-center border-0! pr-1! hover:bg-black/20"
				onclick={() => (soundControlOpen = !soundControlOpen)}
			>
				Okamžité hlásenie
				<Icon icon="mdi:chevron-down" class="text-2xl" />
			</button>
			<div
				class={[
					'absolute top-full right-0 z-10 w-48 cursor-default pt-1 group-hover:block',
					soundControlOpen ? 'block' : 'hidden'
				]}
			>
				<div class="bg-base-100 rounded p-2 shadow-lg" transition:slide>
					<SoundControl {locationSelector} />
				</div>
			</div>
		</div>
	</div>
</div>

<div class="bg-base-100 text-base-content flex grow overflow-x-hidden">
	<div class="my-auto w-full">
		<EventSchedule {event} activities={eventState.activityList} />
	</div>
</div>

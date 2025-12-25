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
	import { fade, slide } from 'svelte/transition';
	import type { AddAlert } from '$lib/types/other';
	import OrphanedActivities from '$lib/components/dialogs/OrphanedActivities.svelte';
	import { OtherSounds } from '$lib/types/sounds';
	import { builder } from '$lib/sounds/builder';
	import { ConfigurableSounds } from '$lib/types/enums';
	import LocationSelector from '$lib/components/dialogs/LocationSelector.svelte';
	import { SvelteDate } from 'svelte/reactivity';

	const eventState = getContext<() => EventState>('getEventState')();
	const addAlert = getContext<AddAlert>('addAlert');

	const event = $derived(eventState.event);

	let submitPending = $state(false);

	let editorActivityId: Activity['id'] | null = $state(null);
	let deletorActivityId: Activity['id'] | null = $state(null);
	let createActivity:
		| boolean
		| {
				startTime?: Date;
				endTime?: Date;
		  } = $state(false);

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
		const response = await fetch(`/api/events/${event.id}/activities/${activityId}`, {
			method: 'DELETE'
		});
		if (!response.ok) {
			addAlert({
				type: 'error',
				content: `Nastala chyba pri mazaní aktivity.`
			});
			console.error(await response.json());
		} else {
			eventState.setActivity(activityId, null);
			addAlert({
				type: 'success',
				content: `Aktivita bola úspešne zmazaná.`
			});
			deletorActivityId = null;
		}
		submitPending = false;
	}

	async function createUpdateActivity(
		changedActivity: EditableActivity,
		activityId?: Activity['id']
	) {
		submitPending = true;
		const response = await fetch(
			activityId
				? `/api/events/${event.id}/activities/${activityId}`
				: `/api/events/${event.id}/activities`,
			{
				method: activityId ? 'PUT' : 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					activity: {
						...changedActivity,
						startTime: changedActivity.startTime.valueOf(),
						endTime: changedActivity.endTime.valueOf()
					}
				})
			}
		);
		const data = await response.json();
		if (!response.ok || !data.success) {
			addAlert({
				type: 'error',
				content: `Nastala chyba pri ${activityId ? 'úprave' : 'vytváraní'} aktivity.`
			});
			console.error(data);
		} else {
			eventState.setActivity(data.activity.id, data.activity);
			if (activityId) {
				editorActivityId = null;
				addAlert({
					type: 'success',
					content: `Aktivita "${data.activity.name}" bola úspešne upravená.`
				});
			} else {
				createActivity = false;
				addAlert({
					type: 'success',
					content: `Aktivita "${data.activity.name}" bola úspešne vytvorená.`
				});
			}
		}
		submitPending = false;
	}

	let locationSelectorResolve: ((location: ActivityLocation | null) => void) | null = $state(null);
	let locationSelectorPurpose: string = $state('');

	function locationSelector(purpose: string): Promise<ActivityLocation | null> {
		const promise = new Promise<ActivityLocation | null>((resolve) => {
			locationSelectorResolve = resolve;
		});
		promise.then(() => {
			locationSelectorResolve = null;
			locationSelectorPurpose = '';
		});
		locationSelectorPurpose = purpose;
		return promise;
	}

	let orphanedDialogShown = $state(false);
	const orphanedActivities = $derived.by(() => {
		if (!eventState.event) return [];
		const eventEndDate = new SvelteDate(eventState.event.endDate).setUTCHours(23, 59, 59, 999);
		return eventState.activityList.filter((a) => {
			return a.endTime < eventState.event.startDate || a.startTime.valueOf() > eventEndDate;
		});
	});
	let soundControlOpen = $state(false);
	let soundControlPending = $state(false);

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
	});

	onMount(() => {
		const endDate = new SvelteDate(event.endDate);
		endDate.setHours(12, 0, 0, 0); // set to noon to avoid DST issues
		const matches = event.startDate.getTimezoneOffset() === endDate.getTimezoneOffset();

		if (!matches) {
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

{#snippet soundControl()}
	<div class="text-secondary flex flex-col [&>button]:border-0! [&>button]:hover:bg-gray-200">
		<button
			class="btn"
			disabled={soundControlPending}
			onclick={async () => {
				if (soundControlPending) return;
				soundControlPending = true;
				const result = await eventState.playerControl({ type: 'stopPlaying' });
				if (result.success)
					addAlert({
						type: 'success',
						content: 'Hlásenie bolo zastavené.'
					});
				soundControlPending = false;
			}}
		>
			Zastaviť hlásenie
		</button>
		<hr class="border-secondary my-2 border-dotted" />
		<button
			class="btn"
			disabled={soundControlPending}
			onclick={async () => {
				if (soundControlPending) return;
				soundControlPending = true;
				const location = await locationSelector('desiata');
				if (!location) {
					soundControlPending = false;
					return;
				}
				const result = await eventState.playerControl({
					type: 'customSound',
					sounds: builder(true).sound(OtherSounds.DESIATA).location(location).getSounds()
				});
				if (result.success)
					addAlert({
						type: 'success',
						content: 'Hlásenie desiaty bolo spustené.'
					});
				soundControlPending = false;
			}}
		>
			Desiata
		</button>
		<button
			class="btn mt-1"
			disabled={soundControlPending}
			onclick={async () => {
				if (soundControlPending) return;
				soundControlPending = true;
				const location = await locationSelector('vecernicek');
				if (!location) {
					soundControlPending = false;
					return;
				}
				const result = await eventState.playerControl({
					type: 'customSound',
					sounds: builder(true).sound(OtherSounds.OLOVRANT).location(location).getSounds()
				});
				if (result.success)
					addAlert({
						type: 'success',
						content: 'Hlásenie olovrantu bolo spustené.'
					});
				soundControlPending = false;
			}}
		>
			Olovrant
		</button>
		<button
			class="btn mt-1"
			disabled={soundControlPending}
			onclick={async () => {
				if (soundControlPending) return;
				soundControlPending = true;
				const location = await locationSelector('vecernicek');
				if (!location) {
					soundControlPending = false;
					return;
				}
				const result = await eventState.playerControl({
					type: 'customSound',
					sounds: builder(true).sound(OtherSounds.SECOND_DINNER).location(location).getSounds()
				});
				if (result.success)
					addAlert({
						type: 'success',
						content: 'Hlásenie druhej večere bolo spustené.'
					});
				soundControlPending = false;
			}}
		>
			Druhá večera
		</button>
		<button
			class="btn mt-1"
			disabled={soundControlPending}
			onclick={async () => {
				if (soundControlPending) return;
				soundControlPending = true;
				await eventState.playerControl({
					type: 'customSound',
					sounds: builder().sound(ConfigurableSounds.VECERNICEK).getSounds()
				});
				addAlert({
					type: 'success',
					content: 'Večerníček bol spustený.'
				});
				soundControlPending = false;
			}}
		>
			Večerníček
		</button>
	</div>
{/snippet}

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
	<div class="overlay" transition:fade={{ duration: 200 }}>
		<LocationSelector
			purpose={locationSelectorPurpose}
			oncancel={() => locationSelectorResolve!(null)}
			onselect={(location: ActivityLocation) => locationSelectorResolve!(location)}
		/>
	</div>
{/if}

{#if orphanedDialogShown}
	<div class="overlay" transition:fade={{ duration: 200 }}>
		<OrphanedActivities
			{event}
			{orphanedActivities}
			onclose={() => (orphanedDialogShown = false)}
		/>
	</div>
{/if}

{#if deletorActivityId}
	<div class="overlay" transition:fade={{ duration: 200 }}>
		<ConfirmActivityDeletion
			disabled={submitPending}
			activity={eventState.activityList.find((a) => a.id === deletorActivityId)!}
			oncancel={() => (deletorActivityId = null)}
			onconfirm={() => {
				deleteActivity(deletorActivityId!);
			}}
		/>
	</div>
{/if}

{#if editorActivityId}
	<div class="overlay" transition:fade={{ duration: 200 }}>
		<EditActivity
			{event}
			disabled={submitPending}
			activity={eventState.activityList.find((a) => a.id === editorActivityId)!}
			oncancel={() => (editorActivityId = null)}
			onsave={(changedActivity: EditableActivity) => {
				createUpdateActivity(changedActivity, editorActivityId!);
			}}
		/>
	</div>
{/if}

{#if createActivity}
	<div class="overlay" transition:fade={{ duration: 200 }}>
		<CreateActivity
			{event}
			disabled={submitPending}
			initial={createActivity instanceof Object ? createActivity : undefined}
			oncancel={() => (createActivity = false)}
			onsave={(newActivity: EditableActivity) => {
				createUpdateActivity(newActivity);
			}}
		/>
	</div>
{/if}

<div class="flex justify-end">
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
				<div class="rounded bg-white p-2 shadow-lg" transition:slide>
					{@render soundControl()}
				</div>
			</div>
		</div>
	</div>
</div>

<div class="flex grow overflow-x-hidden">
	<div class="my-auto w-full">
		<EventSchedule {event} activities={eventState.activityList} />
	</div>
</div>

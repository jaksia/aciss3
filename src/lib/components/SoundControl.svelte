<script lang="ts">
	import type { EventState } from '$lib/state.svelte';
	import type { ActivityLocation } from '$lib/types/db';
	import { getContext } from 'svelte';
	import type { AddAlert } from '$lib/types/other';
	import { OtherSounds } from '$lib/types/sounds';
	import { builder } from '$lib/sounds/builder';
	import { ConfigurableSounds } from '$lib/types/enums';

	let {
		locationSelector
	}: {
		locationSelector: (purpose: string) => Promise<ActivityLocation | null>;
	} = $props();

	const eventState = getContext<() => EventState>('getEventState')();
	const addAlert = getContext<AddAlert>('addAlert');

	let soundControlPending = $state(false);
</script>

<div class="[&>button]:hover:bg-base-200 flex flex-col [&>button]:border-0!">
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
				sounds: builder().sound(ConfigurableSounds.ZVOLAVACKA).getSounds()
			});
			addAlert({
				type: 'success',
				content: 'Zvolávanie bolo spustené.'
			});
			soundControlPending = false;
		}}
	>
		Zvolávanie
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
	<button
		class="btn mt-1"
		disabled={soundControlPending}
		onclick={async () => {
			if (soundControlPending) return;
			soundControlPending = true;
			const now = new Date();
			await eventState.playerControl({
				type: 'customSound',
				sounds: builder()
					.sound(ConfigurableSounds.ALERT_START, OtherSounds.BUDICEK_START)
					.time(now.getMinutes() + now.getHours() * 60)
					.sound(OtherSounds.BUDICEK_END)
					.getSounds()
			});
			addAlert({
				type: 'success',
				content: 'Budíček bol spustený.'
			});
			soundControlPending = false;
		}}
	>
		Budíček
	</button>
</div>

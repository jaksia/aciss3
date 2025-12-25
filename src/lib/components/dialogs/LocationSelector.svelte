<script lang="ts">
	import type { EventState } from '$lib/state.svelte';
	import type { ActivityLocation } from '$lib/types/db';
	import { getContext } from 'svelte';

	const eventState = getContext<() => EventState>('getEventState')();

	let {
		purpose,
		oncancel,
		onselect
	}: {
		purpose: string;
		oncancel: () => void;
		onselect: (location: ActivityLocation) => void;
	} = $props();

	let locationInput: ActivityLocation | null = $state(null);
</script>

<div class="max-w-2xl rounded bg-white p-6 shadow-lg">
	<h2 class="mb-4 text-xl font-semibold">Vyberte umiestnenie pre {purpose}</h2>
	<div class="flex gap-2">
		<select class="form-input grow rounded pr-8" bind:value={locationInput}>
			<option value={null} disabled selected>-- Vyberte umiestnenie --</option>
			{#each eventState.locations as [id, location] (location)}
				<option value={id}>{location.name}</option>
			{/each}
		</select>
		<button
			type="button"
			class="btn btn-success"
			disabled={locationInput === null}
			onclick={() => locationInput && onselect(locationInput)}>Vybrať</button
		>
		<button type="button" class="btn btn-secondary" onclick={oncancel}>Zavrieť</button>
	</div>
</div>

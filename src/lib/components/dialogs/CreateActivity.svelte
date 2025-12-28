<script lang="ts">
	import type { EditableActivity, Event } from '$lib/types/db';
	import ActivityForm from './parts/ActivityForm.svelte';

	const {
		event,
		disabled = false,
		initial,
		oncancel,
		onsave
	}: {
		event: Event;
		disabled?: boolean;
		initial?: {
			startTime?: Date;
			endTime?: Date;
		};
		oncancel: () => void;
		onsave: (changedActivity: EditableActivity) => void;
	} = $props();

	let editableActivity: EditableActivity | undefined = $state(undefined);
	let valid = $state(false);
</script>

<div class="bg-base-100 w-11/12 max-w-2xl rounded p-6 shadow-lg">
	<div class="flex">
		<h2 class="mb-4 text-xl font-semibold">Pridať aktivitu</h2>
		<div class="ml-auto flex gap-2">
			<button
				type="button"
				class="btn btn-secondary"
				{disabled}
				onclick={() => !disabled && oncancel()}>Zrušiť</button
			>
			<button
				type="button"
				class="btn btn-success"
				disabled={disabled || !editableActivity || !valid}
				onclick={() => {
					if (disabled || !editableActivity || !valid) return;
					onsave(editableActivity);
				}}>Vytvoriť</button
			>
		</div>
	</div>

	<ActivityForm initialActivity={initial} {disabled} {event} bind:editableActivity bind:valid />
</div>

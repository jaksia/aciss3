<script lang="ts">
	import type { Activity, EditableActivity, Event } from '$lib/types/db';
	import ActivityForm from './parts/ActivityForm.svelte';

	const {
		event,
		activity,
		disabled = false,
		oncancel,
		onsave
	}: {
		event: Event;
		activity: Activity;
		disabled?: boolean;
		oncancel: () => void;
		onsave: (changedActivity: EditableActivity) => void;
	} = $props();

	let editableActivity: EditableActivity | undefined = $state(undefined);
	let valid = $state(false);
</script>

<div class="bg-base-100 w-11/12 max-w-2xl rounded p-6 shadow-lg">
	<div class="flex">
		<h2 class="mb-4 text-xl font-semibold">Upraviť aktivitu</h2>
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
				disabled={!editableActivity || !valid || disabled}
				onclick={() => {
					if (!editableActivity || !valid || disabled) return;
					onsave(editableActivity);
				}}>Uložiť</button
			>
		</div>
	</div>

	<ActivityForm {disabled} {event} initialActivity={activity} bind:editableActivity bind:valid />
</div>

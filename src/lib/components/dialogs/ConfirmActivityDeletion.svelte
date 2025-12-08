<script lang="ts">
	import type { Activity } from '$lib/types/db';

	const {
		activity,
		disabled = false,
		oncancel,
		onconfirm
	}: {
		activity: Activity;
		disabled?: boolean;
		oncancel: () => void;
		onconfirm: () => void;
	} = $props();
</script>

<div class="w-11/12 max-w-2xl rounded bg-white p-6 shadow-lg">
	<h2 class="mb-4 text-xl font-semibold">Zmazať aktivitu</h2>
	<p class="mb-6">
		Naozaj chcete zmazať aktivitu "<strong>{activity.name}</strong>"? Túto akciu nie je možné vrátiť
		späť.
	</p>
	<div class="">
		<button class="btn btn-error" {disabled} onclick={() => !disabled && onconfirm()}>Zmazať</button
		>
		<button class="btn btn-secondary ml-2" {disabled} onclick={() => !disabled && oncancel()}
			>Zrušiť</button
		>
	</div>
</div>

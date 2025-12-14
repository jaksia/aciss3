<script lang="ts">
	import { EventStyle } from '$lib/themes';
	import type { EditableEvent } from '$lib/types/db';
	import { DatePicker } from '@svelte-plugins/datepicker';
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	import { SvelteDate } from 'svelte/reactivity';

	let { form }: PageProps = $props();

	// svelte-ignore state_referenced_locally
	let editableEvent: EditableEvent = $state({
		name: form?.data?.name ?? '',
		location: form?.data?.location ?? '',
		style: form?.data?.style ?? EventStyle.DEFAULT,
		startDate: form?.data?.startDate ?? new SvelteDate().valueOf(),
		endDate: form?.data?.endDate ?? new SvelteDate().setDate(new SvelteDate().getDate() + 5)
	} as EditableEvent);

	function formatDate(date: number | null): string {
		if (date === null) return '';
		const d = new Date(date);
		return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d
			.getDate()
			.toString()
			.padStart(2, '0')}`;
	}

	let datePickerOpen = $state(false);
	let formattedStartDate: string = $derived(formatDate(editableEvent.startDate));
	let formattedEndDate: string = $derived(formatDate(editableEvent.endDate));

	let submitPending = $state(false);
</script>

<div class="mx-auto flex h-full flex-col p-8 md:max-w-1/2 lg:max-w-1/3">
	<h2 class="mb-3 text-3xl font-bold">Vytvorenie akcie</h2>
	<div class="flex gap-8">
		<form
			class="flex flex-1 flex-col gap-4"
			method="POST"
			use:enhance={() => {
				submitPending = true;

				return async ({ update }) => {
					submitPending = false;
					await update();
				};
			}}
		>
			{#if form?.errors}
				<div class="mb-4 rounded bg-red-100 p-4 text-red-700">
					<h3 class="mb-2 text-lg font-semibold">Chyby pri vytváraní akcie:</h3>
					<ul class="list-disc pl-5">
						{#each Object.values(form.errors) as error (error)}
							<li>{error}</li>
						{/each}
					</ul>
				</div>
			{/if}

			<input type="hidden" name="startDate" value={formattedStartDate} />
			<input type="hidden" name="endDate" value={formattedEndDate} />
			<div>
				<label for="name" class="mb-2 block text-lg font-semibold">Názov akcie</label>
				<input
					id="name"
					name="name"
					type="text"
					bind:value={editableEvent.name}
					class=" w-full rounded"
				/>
				{#if !editableEvent.name}
					<p class="mt-1 text-sm text-red-500">Názov akcie je povinný.</p>
				{/if}
			</div>
			<div>
				<label for="location" class="mb-2 block text-lg font-semibold">Miesto konania</label>
				<input
					id="location"
					name="location"
					type="text"
					bind:value={editableEvent.location}
					class="w-full rounded"
				/>
				{#if !editableEvent.location}
					<p class="mt-1 text-sm text-red-500">Miesto konania je povinné.</p>
				{/if}
			</div>
			<div>
				<label for="style" class="mb-2 block text-lg font-semibold"
					>Štýl akcie
					<em class="font-normal">(mení iba vzhľad)</em></label
				>
				<select id="style" name="style" bind:value={editableEvent.style} class=" w-full rounded">
					{#each Object.values(EventStyle) as name (name)}
						<option value={name}>{name}</option>
					{/each}
				</select>
			</div>
			<div>
				<h3 class="mb-3 text-xl font-bold">Dátum akcie</h3>

				<DatePicker
					isOpen={datePickerOpen}
					bind:startDate={editableEvent.startDate}
					bind:endDate={editableEvent.endDate}
					enableFutureDates={true}
					isRange
					isMultipane
				>
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="form-input rounded"
						onclick={() => (datePickerOpen = !datePickerOpen)}
						class:open={datePickerOpen}
					>
						<div class="date">
							{new Date(editableEvent.startDate).toLocaleDateString('sk-SK')} - {new Date(
								editableEvent.endDate
							).toLocaleDateString('sk-SK')}
						</div>
						{#if editableEvent.startDate > editableEvent.endDate}
							<p class="mt-1 text-sm text-red-500">Dátum začiatku musí byť pred dátumom konca.</p>
						{/if}
					</div>
				</DatePicker>
			</div>
			<button
				type="submit"
				class="btn btn-success mx-auto mt-4"
				disabled={!editableEvent.name ||
					!editableEvent.location ||
					!editableEvent.startDate ||
					!editableEvent.endDate ||
					editableEvent.startDate > editableEvent.endDate ||
					submitPending}
			>
				Vytvoriť
			</button>
		</form>
	</div>
</div>

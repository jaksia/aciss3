<script lang="ts">
	import { EventStyle } from '$lib/themes';
	import type { EditableEvent } from '$lib/types/db';
	import { DatePicker } from '@svelte-plugins/datepicker';
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	import { getContext, untrack } from 'svelte';
	import { EventState } from '$lib/state.svelte';

	const eventState = getContext<() => EventState>('getEventState')();

	const event = $derived(eventState.event);

	let { form }: PageProps = $props();

	$effect(() => {
		form;
		if (form?.success && form.newEvent) {
			eventState.event = form.newEvent;
		}
		untrack(() => {
			editableEvent = {
				name: (form?.name as string) ?? event.name,
				location: (form?.location as string) ?? event.location,
				style: (form?.style as EventStyle) ?? event.style,
				startDate: form?.startDate
					? new Date(form.startDate as string).valueOf()
					: event.startDate.valueOf(),
				endDate: form?.endDate
					? new Date(form.endDate as string).valueOf()
					: event.endDate.valueOf()
			};
		});
	});

	let editableEvent: EditableEvent = $state({} as EditableEvent);

	function formatDate(date: number | null): string {
		if (date === null) return '';
		const d = new Date(date);
		return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d
			.getDate()
			.toString()
			.padStart(2, '0')}`;
	}

	let formattedStartDate: string = $derived(formatDate(editableEvent.startDate));
	let formattedEndDate: string = $derived(formatDate(editableEvent.endDate));
</script>

<div class="flex h-full flex-col p-8">
	<h2 class="mb-3 text-3xl font-bold">Nastavenia akcie</h2>
	<div class="flex gap-8">
		<form class="flex flex-1 flex-col gap-4" method="POST" use:enhance>
			<input type="hidden" name="startDate" value={formattedStartDate} />
			<input type="hidden" name="endDate" value={formattedEndDate} />
			<div>
				<label for="name" class="mb-2 block text-lg font-semibold">Názov akcie</label>
				<input
					id="name"
					name="name"
					type="text"
					bind:value={editableEvent.name}
					class="input-field w-full rounded"
				/>
			</div>
			<div>
				<label for="location" class="mb-2 block text-lg font-semibold">Miesto konania</label>
				<input
					id="location"
					name="location"
					type="text"
					bind:value={editableEvent.location}
					class="input-field w-full rounded"
				/>
			</div>
			<div>
				<label for="style" class="mb-2 block text-lg font-semibold"
					>Štýl akcie
					<em class="font-normal">(mení iba vzhľad)</em></label
				>
				<select
					id="style"
					name="style"
					bind:value={editableEvent.style}
					class="input-field w-full rounded"
				>
					{#each Object.entries(EventStyle) as [key, name]}
						<option value={name}>{name}</option>
					{/each}
				</select>
			</div>
			<button
				type="submit"
				class="btn btn-success mx-auto mt-4"
				disabled={(editableEvent.name === event.name &&
					editableEvent.location === event.location &&
					editableEvent.style === event.style &&
					editableEvent.startDate === new Date(event.startDate).valueOf() &&
					editableEvent.endDate === new Date(event.endDate).valueOf()) ||
					editableEvent.endDate === null}>Uložiť zmeny</button
			>
		</form>
		<div class="flex flex-1 flex-col">
			<h3 class="mb-3 text-xl font-bold">Dátum akcie</h3>
			<DatePicker
				isOpen
				alwaysShow
				bind:startDate={editableEvent.startDate}
				bind:endDate={editableEvent.endDate}
				isRange
				isMultipane
			></DatePicker>
		</div>
	</div>
</div>

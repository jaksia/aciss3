<script lang="ts">
	import { EventStyle } from '$lib/themes';
	import type { EditableEvent } from '$lib/types/db';
	import { DatePicker } from '@svelte-plugins/datepicker';
	import { applyAction, enhance } from '$app/forms';
	import type { PageProps } from './$types';
	import { getContext, untrack } from 'svelte';
	import { EventState } from '$lib/state.svelte';
	import type { AddAlert } from '$lib/types/other';

	// Linter removes <> when the type is used in enhance block, this is a workaround
	// TODO: diagnose
	type PEditableEvent = Partial<EditableEvent>;

	const eventState = getContext<() => EventState>('getEventState')();
	const addAlert = getContext<AddAlert>('addAlert');

	const event = $derived(eventState.event);

	// svelte-ignore state_referenced_locally
	let editableEvent: EditableEvent = $state({
		name: event.name,
		location: event.location,
		style: event.style,
		startDate: new Date(event.startDate).valueOf(),
		endDate: new Date(event.endDate).valueOf()
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

	let editPending = $state(false);
	let passwordPending = $state(false);
</script>

<div class="flex h-full flex-col p-8">
	<h2 class="mb-3 text-3xl font-bold">Nastavenia akcie</h2>
	<div class="flex gap-8">
		<form
			class="flex flex-1 flex-col gap-4"
			method="POST"
			action="?/edit"
			use:enhance={({ formElement, formData, action, cancel }) => {
				editPending = true;

				return async ({ result, update }) => {
					if (result.type === 'error' || result.type === 'redirect') {
						return await update();
					}
					if (result.type === 'success') {
						addAlert({
							type: 'success',
							content: `Údaje o akcii boli úspešne upravené.`
						});
					} else if (result.type === 'failure') {
						addAlert({
							type: 'error',
							content:
								(result.data?.error as string | undefined) ??
								(result.data?.invalid
									? `Pole "${result.data.invalid}" je neplatné. Skontrolujte prosím zadané údaje.`
									: 'Nastala neznáma chyba')
						});
					}
					const data = (result.data?.data ?? {}) as PEditableEvent;
					editableEvent = {
						name: data.name ?? event.name,
						location: data.location ?? event.location,
						style: data.style ?? event.style,
						startDate: data.startDate
							? new Date(data.startDate).valueOf()
							: event.startDate.valueOf(),
						endDate: data.endDate ? new Date(data.endDate).valueOf() : event.endDate.valueOf()
					};
					await update();
				};
			}}
		>
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
			</div>
			<div>
				<label for="location" class="mb-2 block text-lg font-semibold">Miesto konania</label>
				<input
					id="location"
					name="location"
					type="text"
					bind:value={editableEvent.location}
					class=" w-full rounded"
				/>
			</div>
			<div>
				<label for="style" class="mb-2 block text-lg font-semibold"
					>Štýl akcie
					<em class="font-normal">(mení iba vzhľad)</em></label
				>
				<select id="style" name="style" bind:value={editableEvent.style} class=" w-full rounded">
					{#each Object.entries(EventStyle) as [key, name]}
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
					</div>
				</DatePicker>
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
			<h3 class="mb-3 text-xl font-bold">Zmena administrátorského hesla</h3>
			<p class="mb-4">
				Môžete zmeniť administrátorské heslo potrebné na prístup do administrátorského rozhrania
				tejto akcie. Ak necháte nové heslo prázdne, heslo sa vymaže a nebude už potrebné na
				prihlásenie.
				<br />
				<strong>
					{#if event.adminPasswordHash}
						Aktuálne je nastavené administrátorské heslo.
					{:else}
						Aktuálne nie je nastavené žiadne administrátorské heslo.
					{/if}
				</strong>
			</p>
			<form
				class="flex flex-col gap-4"
				method="POST"
				action="?/password"
				use:enhance={({ formElement, formData, action, cancel }) => {
					passwordPending = true;

					return async ({ result, update }) => {
						passwordPending = false;

						if (result.type === 'success') {
							addAlert({
								type: 'success',
								content: `Administrátorské heslo bolo úspešne zmenené.`
							});
						} else if (result.type === 'failure') {
							addAlert({
								type: 'error',
								content: (result.data?.error as string | undefined) ?? 'Nastala neznáma chyba'
							});
						}
						await update();
					};
				}}
			>
				<div>
					<label for="currentAdminPassword" class="mb-2 block text-lg font-semibold"
						>Súčasné administrátorské heslo</label
					>
					<input
						id="currentAdminPassword"
						name="currentAdminPassword"
						type="password"
						placeholder="Zadajte súčasné heslo"
						class={[' w-full rounded', !event.adminPasswordHash && 'cursor-not-allowed opacity-50']}
						disabled={!event.adminPasswordHash}
					/>
				</div>
				<div>
					<label for="adminPassword" class="mb-2 block text-lg font-semibold"
						>Nové administrátorské heslo</label
					>
					<input
						id="adminPassword"
						name="adminPassword"
						type="password"
						placeholder="Zadajte nové heslo"
						class="w-full rounded"
					/>
					<input
						id="adminPasswordConfirm"
						name="adminPasswordConfirm"
						type="password"
						placeholder="Zadajte nové heslo znova"
						class=" mt-2 w-full rounded"
					/>
				</div>
				<button type="submit" class="btn btn-warning mx-auto mt-4">Zmeniť heslo</button>
			</form>
		</div>
	</div>
</div>

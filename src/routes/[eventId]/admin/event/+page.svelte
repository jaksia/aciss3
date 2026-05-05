<script lang="ts">
	import { EventStyle } from '$lib/themes';
	import { DatePicker } from '@svelte-plugins/datepicker';
	import { getContext } from 'svelte';
	import { EventState } from '$lib/state.svelte';
	import type { AddAlert } from '$lib/types/other';
	import { changeEventPassword, updateEvent } from '$lib/functions.remote';
	import type { Event } from '$lib/types/db';
	import { eventDataValidator } from '$lib/schemas';

	const eventState = getContext<() => EventState>('getEventState')();
	const addAlert = getContext<AddAlert>('addAlert');

	const event = $derived(eventState.event);

	let datePickerOpen = $state(false);

	function initFormFromEvent(event: Event) {
		updateEvent.fields.eventId.set(event.id);
		updateEvent.fields.name.set(event.name);
		updateEvent.fields.location.set(event.location ?? undefined);
		updateEvent.fields.style.set(event.style);
		updateEvent.fields.startDate.set(event.startDate.valueOf());
		updateEvent.fields.endDate.set(event.endDate.valueOf());

		changeEventPassword.fields.eventId.set(event.id);
		changeEventPassword.fields._currentPassword.set('');
		changeEventPassword.fields._password.set('');
		changeEventPassword.fields._passwordConfirm.set('');
	}
	$effect(() => {
		if (event) initFormFromEvent(event);
	});
</script>

<div class="flex h-full flex-col p-8">
	<h2 class="mb-3 text-3xl font-bold">Nastavenia akcie</h2>
	<div class="flex gap-8">
		<form
			class="flex flex-1 flex-col gap-4"
			{...updateEvent.enhance(async ({ submit }) => {
				try {
					if (await submit()) {
						addAlert({
							type: 'success',
							content: `Údaje o akcii boli úspešne upravené.`
						});
					} else {
						addAlert({
							type: 'error',
							content: `Nastala chyba pri ukladaní zmien.`
						});
					}
				} catch (error) {
					addAlert({
						type: 'error',
						content: 'Nastala chyba pri ukladaní zmien.'
					});
					console.error(error);
				}
			})}
			oninput={() => updateEvent.validate()}
		>
			<div>
				<label for="name" class="mb-2 block text-lg font-semibold">Názov akcie</label>
				<input id="name" class="w-full" {...updateEvent.fields.name.as('text')} />
				{#each updateEvent.fields.name.issues() as issue (issue.message)}
					<p class="mt-1 text-sm text-red-500">{issue.message}</p>
				{/each}
			</div>
			<div>
				<label for="location" class="mb-2 block text-lg font-semibold">Miesto konania</label>
				<input id="location" class="w-full" {...updateEvent.fields.location.as('text')} />
				{#each updateEvent.fields.location.issues() as issue (issue.message)}
					<p class="mt-1 text-sm text-red-500">{issue.message}</p>
				{/each}
			</div>
			<div>
				<label for="style" class="mb-2 block text-lg font-semibold"
					>Štýl akcie
					<em class="font-normal">(mení iba vzhľad)</em></label
				>
				<select id="style" class="w-full" {...updateEvent.fields.style.as('select')}>
					{#each Object.values(EventStyle) as name (name)}
						<option value={name}>{name}</option>
					{/each}
				</select>
				{#each updateEvent.fields.style.issues() as issue (issue.message)}
					<p class="mt-1 text-sm text-red-500">{issue.message}</p>
				{/each}
			</div>
			<input
				type="hidden"
				name={updateEvent.fields.eventId.as('number').name}
				value={updateEvent.fields.eventId.value()}
			/>
			<input
				type="hidden"
				name={updateEvent.fields.startDate.as('number').name}
				value={updateEvent.fields.startDate.value()}
			/>
			<input
				type="hidden"
				name={updateEvent.fields.endDate.as('number').name}
				value={updateEvent.fields.endDate.value()}
			/>
			<div>
				<h3 class="mb-3 text-xl font-bold">Dátum akcie</h3>

				<DatePicker
					isOpen={datePickerOpen}
					bind:startDate={
						() => updateEvent.fields.startDate.value(),
						(value) => updateEvent.fields.startDate.set(value)
					}
					bind:endDate={
						() => updateEvent.fields.endDate.value(),
						(value) => updateEvent.fields.endDate.set(value)
					}
					enableFutureDates={true}
					isRange
					isMultipane
				>
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="form-input"
						onclick={() => (datePickerOpen = !datePickerOpen)}
						class:open={datePickerOpen}
					>
						<div class="date">
							{new Date(event.startDate).toLocaleDateString('sk-SK')} - {new Date(
								event.endDate
							).toLocaleDateString('sk-SK')}
						</div>
					</div>
				</DatePicker>
			</div>
			<button type="submit" class="btn btn-success mx-auto mt-4">Uložiť zmeny</button>
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
				{...changeEventPassword.enhance(async ({ submit }) => {
					try {
						if (await submit()) {
							addAlert({
								type: 'success',
								content: `Administrátorské heslo bolo úspešne zmenené.`
							});
						} else {
							addAlert({
								type: 'error',
								content: 'Nastala chyba pri zmene hesla.'
							});
						}
					} catch (error) {
						addAlert({
							type: 'error',
							content: error instanceof Error ? error.message : 'Nastala chyba pri zmene hesla.'
						});
						console.error(error);
					}
				})}
			>
				<input
					type="hidden"
					name={changeEventPassword.fields.eventId.as('number').name}
					value={changeEventPassword.fields.eventId.value()}
				/>
				<div>
					<label for="currentAdminPassword" class="mb-2 block text-lg font-semibold"
						>Súčasné administrátorské heslo</label
					>
					<input
						id="currentAdminPassword"
						placeholder="Zadajte súčasné heslo"
						class={[' w-full rounded', !event.adminPasswordHash && 'cursor-not-allowed opacity-50']}
						disabled={!event.adminPasswordHash}
						{...changeEventPassword.fields._currentPassword.as('password')}
					/>
					{#each changeEventPassword.fields._currentPassword.issues() as issue (issue.message)}
						<p class="mt-1 text-sm text-red-500">{issue.message}</p>
					{/each}
				</div>
				<div>
					<label for="password" class="mb-2 block text-lg font-semibold"
						>Nové administrátorské heslo</label
					>
					<input
						id="password"
						placeholder="Zadejte nové heslo"
						class="w-full rounded"
						{...changeEventPassword.fields._password.as('password')}
					/>
					{#each changeEventPassword.fields._password.issues() as issue (issue.message)}
						<p class="mt-1 text-sm text-red-500">{issue.message}</p>
					{/each}
					<input
						id="passwordConfirm"
						placeholder="Zadejte nové heslo znovu"
						class="mt-2 w-full rounded"
						{...changeEventPassword.fields._passwordConfirm.as('password')}
					/>
					{#each changeEventPassword.fields._passwordConfirm.issues() as issue (issue.message)}
						<p class="mt-1 text-sm text-red-500">{issue.message}</p>
					{/each}
				</div>
				<button type="submit" class="btn btn-warning mx-auto mt-4">Zmeniť heslo</button>
			</form>
		</div>
	</div>
</div>

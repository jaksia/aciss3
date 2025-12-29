<script lang="ts">
	import { EventStyle } from '$lib/themes';
	import { DatePicker } from '@svelte-plugins/datepicker';
	import type { PageProps } from './$types';
	import { createEvent } from '$lib/functions.remote';
	import { getCreateEventSchema } from '$lib/schemas';
	import { getContext } from 'svelte';
	import type { AddAlert } from '$lib/types/other';

	let { data }: PageProps = $props();

	const addAlert = getContext<AddAlert>('addAlert');

	let datePickerOpen = $state(false);

	let submitPending = $state(false);
</script>

<div
	class="bg-base-100 text-base-content flex min-h-screen min-w-screen flex-col items-center p-8 md:max-w-1/2 lg:max-w-1/3"
>
	<h2 class="mb-3 text-3xl font-bold">Vytvorenie akcie</h2>
	<div class="flex gap-8">
		<form
			class="flex flex-1 flex-col gap-4"
			{...createEvent
				.preflight(getCreateEventSchema(data.hasRootPassword))
				.enhance(async ({ submit }) => {
					submitPending = true;
					try {
						await submit();
						addAlert({
							type: 'success',
							content: 'Akcia bola úspešne vytvorená.'
						});
					} catch (error) {
						addAlert({
							type: 'error',
							content: 'Nastala chyba pri vytváraní akcie.'
						});
						console.error(error);
					}
					submitPending = false;
				})}
			oninput={() => createEvent.validate({ preflightOnly: true })}
		>
			{#if !data.validRootPassword}
				<div class="mb-4 rounded bg-red-100 p-4 text-red-700">
					<h3 class="mb-2 text-lg font-semibold">Nesprávne nastavenie servera</h3>
					<p>
						Kvôli nesprávnemu nastaveniu servera nie je možné vytvoriť akciu. Prosím, kontaktujte
						správcu servera.
					</p>
				</div>
			{/if}

			<div>
				<label for="name" class="mb-2 block text-lg font-semibold">Názov akcie</label>
				<input id="name" class="w-full" {...createEvent.fields.name.as('text')} />
				{#each createEvent.fields.name.issues() as issue (issue.message)}
					<p class="mt-1 text-sm text-red-500">{issue.message}</p>
				{/each}
			</div>
			<div>
				<label for="location" class="mb-2 block text-lg font-semibold">Miesto konania</label>
				<input id="location" class="w-full" {...createEvent.fields.location.as('text')} />
				{#each createEvent.fields.location.issues() as issue (issue.message)}
					<p class="mt-1 text-sm text-red-500">{issue.message}</p>
				{/each}
			</div>
			<div>
				<label for="style" class="mb-2 block text-lg font-semibold"
					>Štýl akcie
					<em class="font-normal">(mení iba vzhľad)</em></label
				>
				<select id="style" class="w-full" {...createEvent.fields.style.as('select')}>
					{#each Object.values(EventStyle) as name (name)}
						<option value={name}>{name}</option>
					{/each}
				</select>
				{#each createEvent.fields.style.issues() as issue (issue.message)}
					<p class="mt-1 text-sm text-red-500">{issue.message}</p>
				{/each}
			</div>
			<input
				type="hidden"
				name={createEvent.fields.startDate.as('number').name}
				value={createEvent.fields.startDate.value()}
			/>
			<input
				type="hidden"
				name={createEvent.fields.endDate.as('number').name}
				value={createEvent.fields.endDate.value()}
			/>
			<div>
				<h3 class="mb-3 text-xl font-bold">Dátum akcie</h3>

				<DatePicker
					isOpen={datePickerOpen}
					bind:startDate={
						() => createEvent.fields.startDate.value(),
						(value) => createEvent.fields.startDate.set(value)
					}
					bind:endDate={
						() => createEvent.fields.endDate.value(),
						(value) => createEvent.fields.endDate.set(value)
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
							{new Date(createEvent.fields.startDate.value()).toLocaleDateString('sk-SK')} -
							{#if createEvent.fields.endDate.value() !== null}
								{new Date(createEvent.fields.endDate.value()).toLocaleDateString('sk-SK')}
							{/if}
						</div>
					</div>
					{#each createEvent.fields.startDate.issues() as issue (issue.message)}
						<p class="mt-1 text-sm text-red-500">{issue.message}</p>
					{/each}
					{#each createEvent.fields.endDate.issues() as issue (issue.message)}
						<p class="mt-1 text-sm text-red-500">{issue.message}</p>
					{/each}
				</DatePicker>
			</div>
			{#if data.hasRootPassword}
				<div>
					<label for="rootPassword" class="mb-2 block text-lg font-semibold">Heslo</label>
					<input
						id="rootPassword"
						class="w-full"
						{...createEvent.fields._rootPassword.as('password')}
					/>
					<p class="mt-1 text-sm text-gray-500">
						Na temto serveri je možné vytvoriť akciu iba s pomocou správneho root hesla. Ak ho
						nemáte, kontaktujte správcu servera.
					</p>
					{#each createEvent.fields._rootPassword.issues() as issue (issue.message)}
						<p class="mt-1 text-sm text-red-500">{issue.message}</p>
					{/each}
				</div>
			{/if}
			{submitPending}
			{!data.validRootPassword}
			<button
				class="btn btn-success mx-auto mt-4"
				disabled={submitPending || !data.validRootPassword}
				type="submit"
			>
				Vytvoriť
			</button>
		</form>
	</div>
</div>

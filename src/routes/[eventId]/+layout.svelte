<script lang="ts">
	import { styleData } from '$lib/themes';
	import type { LayoutProps } from './$types';
	import { page } from '$app/state';
	import { getContext, setContext } from 'svelte';
	import { EventState } from '$lib/state.svelte';
	import type { AddAlert } from '$lib/types/other';
	import { resolve } from '$app/paths';

	const adminSection = $derived.by(() => {
		return page.url.pathname.includes('/admin') ? page.url.pathname.split('/admin')[1] : null;
	});

	let { children, data }: LayoutProps = $props();

	// svelte-ignore state_referenced_locally
	const eventState = new EventState(data.event, Object.values(data.activities), data.locations);
	setContext('getEventState', () => eventState);

	const event = $derived(eventState.event);
	const styles = $derived(styleData[event.style]);

	const addAlert = getContext<AddAlert>('addAlert');
	eventState.setAddAlert(addAlert);
</script>

<div class="text-base-content flex min-h-screen flex-col">
	<nav
		class="sticky top-0 z-10 flex h-24 text-white"
		style="background-color: {styles.primaryColor};"
	>
		<div class="flex w-1/6 p-3">
			<img src={styles.logoPath} alt="{event.style} Logo" class="mx-auto h-full" />
		</div>
		<div class="my-auto ml-4 flex flex-col font-black">
			<h3 class="text-3xl">{event.name}</h3>
			<span
				>{event.startDate.getDate()}.
				{event.startDate.getMonth() + 1}.
				{#if event.startDate.getFullYear() !== event.endDate.getFullYear()}{event.startDate.getFullYear()}{/if}
				-
				{event.endDate.getDate()}. {event.endDate.getMonth() + 1}. {event.endDate.getFullYear()}
				{#if event.location}
					/ {event.location}{/if}
			</span>
		</div>
		{#if adminSection !== null}
			<div class="mr-4 flex grow items-center justify-end space-x-4">
				<a
					href={resolve('/[eventId]/admin/sounds', { eventId: event.id.toString() })}
					class={['navbar-btn text-lg', adminSection === '/sounds' && 'active']}>Zvuky</a
				>
				<a
					href={resolve('/[eventId]/admin', { eventId: event.id.toString() })}
					class={['navbar-btn text-lg', adminSection === '' && 'active']}>Program</a
				>
				<a
					href={resolve('/[eventId]/admin/event', { eventId: event.id.toString() })}
					class={['navbar-btn text-lg', adminSection === '/event' && 'active']}>Nastavenia akcie</a
				>
			</div>
		{:else}
			<div class="mr-8 flex grow items-center justify-end">
				<span class="font-mono text-3xl font-black"
					>{eventState.now.getHours().toString().padStart(2, '0')}<span
						class={[eventState.now.getSeconds() % 2 === 0 ? 'invisible' : '']}>:</span
					>{eventState.now.getMinutes().toString().padStart(2, '0')}</span
				>
			</div>
		{/if}
	</nav>

	<div class="flex grow flex-col">
		{@render children()}
	</div>
</div>

<div class="fixed bottom-6 left-6 z-50">
	<div class={['indicator', eventState.socketActive ? 'active' : 'inactive']}></div>
</div>

<style lang="scss">
	.indicator {
		border-radius: 50%;
		display: inline-block;

		box-shadow:
			0 0 10px 4px var(--color),
			0 0 20px 10px var(--color);

		&.active {
			--color: var(--color-emerald-500);
		}

		&.inactive {
			--color: var(--color-amber-600);
		}
	}
</style>

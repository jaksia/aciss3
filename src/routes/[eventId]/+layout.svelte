<script lang="ts">
	import { styleData } from '$lib/themes';
	import type { LayoutProps } from './$types';
	import { page } from '$app/state';
	import { setContext } from 'svelte';
	import { EventState } from '$lib/state.svelte';
	import type { AddAlert, Alert } from '$lib/types/other';
	import Icon from '@iconify/svelte';
	import { fade, fly } from 'svelte/transition';
	import { resolve } from '$app/paths';

	const adminSection = $derived.by(() => {
		return page.url.pathname.includes('/admin') && !page.url.pathname.includes('/login')
			? page.url.pathname.split('/admin')[1]
			: null;
	});

	let { children, data }: LayoutProps = $props();

	// svelte-ignore state_referenced_locally
	const eventState = new EventState(data.event, Object.values(data.activities), data.locations);
	setContext('getEventState', () => eventState);

	const event = $derived(eventState.event);
	const styles = $derived(styleData[event.style]);

	let alerts = $state<Alert[]>([]);

	const addAlert: AddAlert = function (alert) {
		const id = Math.random().toString(36).substring(2, 9);
		if (!alert.timeout) alert.timeout = 5000;

		alerts.push({ ...alert, id, dismissedAt: Date.now() + alert.timeout, timeout: alert.timeout });
		setTimeout(() => {
			dismissAlert(id);
		}, alert.timeout);
		return id;
	};
	setContext('addAlert', addAlert);
	eventState.setAddAlert(addAlert);

	function dismissAlert(id: string) {
		alerts = alerts.filter((a) => a.id !== id);
	}
</script>

<div class="text-base-content flex min-h-screen flex-col">
	<nav
		class="sticky top-0 z-10 flex h-24 text-white"
		style="background-color: {styles.primaryColor};"
	>
		<div class="flex w-1/6">
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
		{/if}
	</nav>

	<div class="flex grow flex-col">
		{@render children()}
	</div>
</div>

<div id="alert-container" class="fixed right-4 bottom-4 z-50 text-stone-800">
	{#each alerts as alert (alert.id)}
		<div
			class={[
				'mb-2 flex flex-col rounded border-l-4 px-4 pt-2 shadow-md',
				alert.type === 'info' && 'border-blue-500 bg-blue-50',
				alert.type === 'success' && 'border-green-500 bg-green-50',
				alert.type === 'warning' && 'border-yellow-500 bg-yellow-50',
				alert.type === 'error' && 'border-red-500 bg-red-50'
			]}
			out:fade={{ duration: 200 }}
			in:fly={{ x: 50, duration: 200 }}
		>
			<div class="flex text-2xl">
				{#if alert.type === 'info'}
					<Icon icon="mdi:information-outline" class="text-blue-500" />
				{:else if alert.type === 'success'}
					<Icon icon="mdi:check-circle-outline" class="text-green-500" />
				{:else if alert.type === 'warning'}
					<Icon icon="mdi:alert-outline" class="text-yellow-500" />
				{:else if alert.type === 'error'}
					<Icon icon="mdi:close-circle-outline" class="text-red-500" />
				{/if}
				<button class="ml-auto cursor-pointer" onclick={() => dismissAlert(alert.id)}>
					<Icon icon="mdi:close" />
				</button>
			</div>
			<div class="mt-1">
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html alert.content}
			</div>
			<div class="-mx-4 mt-4">
				<div
					class={[
						'h-1',
						alert.type === 'info' && 'bg-blue-500',
						alert.type === 'success' && 'bg-green-500',
						alert.type === 'warning' && 'bg-yellow-500',
						alert.type === 'error' && 'bg-red-500'
					]}
					style="width: {(Math.max(alert.dismissedAt - eventState.now.valueOf(), 0) /
						alert.timeout) *
						100}%;"
				></div>
			</div>
		</div>
	{/each}
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

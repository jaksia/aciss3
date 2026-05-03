<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import type { AddAlert, Alert } from '$lib/types/other';
	import { setContext } from 'svelte';
	import Icon from '@iconify/svelte';
	import { fade, fly } from 'svelte/transition';

	let { children } = $props();

	let now = $state(new Date());
	setInterval(() => {
		now = new Date();
	}, 20);
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

	function dismissAlert(id: string) {
		alerts = alerts.filter((a) => a.id !== id);
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

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
					style="width: {(Math.max(alert.dismissedAt - now.valueOf(), 0) / alert.timeout) * 100}%;"
				></div>
			</div>
		</div>
	{/each}
</div>

{@render children()}

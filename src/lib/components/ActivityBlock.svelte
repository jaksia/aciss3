<script lang="ts">
	import type { Activity } from '$lib/types/db';
	import type { GlobalBlockProps } from '$lib/types/other';
	import { fly } from 'svelte/transition';
	import ExpandedActivity from './ExpandedActivity.svelte';
	import { browser } from '$app/environment';
	import { getContext } from 'svelte';
	import type { EventState } from '$lib/state.svelte';

	const eventState = getContext<() => EventState>('getEventState')();

	const {
		activity,
		hourWidth,
		expandedActivityId,
		expandActivity,
		viewportReactivityTrigger
	}: {
		activity: Activity;
		hourWidth: number;
		viewportReactivityTrigger?: number;
	} & GlobalBlockProps = $props();

	const tzOffset = $derived(
		eventState.now.getTimezoneOffset() - activity.startTime.getTimezoneOffset()
	);
	const actualStartTime = $derived.by(() => {
		const startTime = new Date(activity.startTime);
		startTime.setMinutes(activity.startTime.getMinutes() + (activity.delay ?? 0) + tzOffset);
		return startTime;
	});

	// generate color based on activity id (numeric)
	const color = $derived.by(() => {
		const hash = (113 * activity.id) % 360;
		return `hsl(${hash}, 70%, 50%)`;
	});

	const startMinutes = $derived(actualStartTime.getHours() * 60 + actualStartTime.getMinutes());
	const duration = $derived(
		(activity.endTime.getTime() - activity.startTime.getTime()) / (1000 * 60)
	);

	const alertTimes = $derived.by(() => {
		return activity.alertTimes.map((at) => [startMinutes - at.minutes, at.minutes]);
	});

	let htmlElement = $state(null) as HTMLDivElement | null;
	let expandElement = $state(null) as HTMLDivElement | null;
	let expandedWidth = $state(0);
	const rightEdge = $derived.by(() => {
		viewportReactivityTrigger; // to trigger reactivity
		if (!htmlElement) return 0;
		return htmlElement.getBoundingClientRect().right;
	});

	const expandedDialogRight = $derived.by(() => {
		return rightEdge + expandedWidth + 100 > (browser ? window.innerWidth : 0);
	});
</script>

{#if activity.delay}
	<div
		class="delay absolute top-1/10 h-4/5 rounded"
		style="left: {((startMinutes - activity.delay) / 60) * hourWidth}px; width: {(activity.delay /
			60) *
			hourWidth}px;"
		title="Meškanie {activity.delay} min"
	></div>
{/if}

{#each alertTimes as [alertTime, minutes]}
	<div
		class="absolute top-0 h-full -translate-x-1/2"
		style="left: {(alertTime / 60) * hourWidth}px; background-color: {color}; width: {Math.max(
			hourWidth / 120,
			2.5
		)}px;"
		title="Upozornenie - {minutes} min"
	></div>
{/each}

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="activity absolute top-1/10 h-4/5 cursor-pointer rounded px-1"
	style="
    left: {(startMinutes / 60) * hourWidth}px;
    width: {(duration / 60) * hourWidth}px;
    background-color: {color};"
	bind:this={htmlElement}
	onclick={(e) => {
		if (expandElement && expandElement.contains(e.target as Node)) return;

		if (expandedActivityId == activity.id) expandActivity(null);
		else expandActivity(activity.id);
	}}
>
	<span>{activity.name}</span>
	{#if expandedActivityId == activity.id}
		<div
			class={[
				'absolute top-0 z-10 cursor-default',
				expandedDialogRight ? 'right-full mr-2' : 'left-full ml-2'
			]}
			transition:fly={{
				x: expandedDialogRight ? 20 : -20,
				duration: 150
			}}
			bind:clientWidth={expandedWidth}
			bind:this={expandElement}
		>
			<ExpandedActivity
				right={expandedDialogRight}
				{activity}
				activityElem={htmlElement}
				close={() => expandActivity(null)}
			/>
		</div>
	{/if}
</div>

<style>
	.delay {
		background: repeating-linear-gradient(
			120deg,
			var(--color-amber-500),
			var(--color-amber-500) 5px,
			black 5px,
			black 10px
		);
		opacity: 0.5;
	}
</style>

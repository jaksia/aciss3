<script lang="ts">
	import type { Activity, Event } from '#lib/types/index.js';
	import { SvelteDate } from 'svelte/reactivity';
	import ScheduleTable from './ScheduleTable.svelte';

	const {
		event,
		activities
	}: {
		event: Event;
		activities: Activity[];
	} = $props();

	const days = $derived.by(() => {
		if (!event) return [];
		const days = [];
		for (let d = new SvelteDate(event.startDate); d <= event.endDate; d.setDate(d.getDate() + 1)) {
			days.push(new SvelteDate(d));
		}
		return days;
	});

	const perDayActivities: Record<number, Activity[]> = $derived.by(() => {
		const perDay: Record<number, Activity[]> = {};
		activities.forEach((activity) => {
			const dayNum = Math.floor(
				(activity.startTime.getTime() - event.startDate.getTime()) / (1000 * 60 * 60 * 24)
			);
			if (!perDay[dayNum]) perDay[dayNum] = [];
			perDay[dayNum].push(activity);
		});
		return perDay;
	});

	let expandedActivityId = $state<Activity['id'] | null>(null);
</script>

<ScheduleTable {days} {perDayActivities} bind:expandedActivityId />

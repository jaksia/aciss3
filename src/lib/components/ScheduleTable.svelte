<script lang="ts">
	import type { Activity } from '$lib/types/db';
	import { usePinch, type PinchCustomEvent, usePan, type PanCustomEvent } from 'svelte-gestures';
	import ActivityBlock from './ActivityBlock.svelte';
	import type { GlobalBlockProps } from '$lib/types/other';
	import { getContext, onMount, tick } from 'svelte';
	import type { EventState } from '$lib/state.svelte';
	import { SvelteDate } from 'svelte/reactivity';

	const eventState = getContext<() => EventState>('getEventState')();

	// On 1920px width, this shows approx. 7:00 - 22:00
	const DEFAULT_SCALE = 1.56;
	const DEFAULT_STARTING_MINUTES = 7 * 60 - 1; // 7:00

	const SCALE_MIN = 1;
	const SCALE_MAX = 6;

	let {
		days,
		perDayActivities,
		globalBlockProps
	}: {
		days: Date[];
		perDayActivities: Record<number, Activity[]>;
		globalBlockProps: GlobalBlockProps;
	} = $props();

	function formatDayDate(date: Date) {
		return `${date.getDate()}. ${date.getMonth() + 1}. ${date.getFullYear()}`;
	}

	// Used for anything that needs to react to viewport changes
	// needed, as there is no built-in way to get reactive element positions
	let viewportReactivityTrigger = $state(0);

	let timeRowHeight = $state(0);
	let dayTextHeight: Record<number, number> = $state({});
	let dayRowHeight: Record<number, number> = $state({});

	let chartElement: HTMLDivElement | null = $state(null);
	let chartWidth = $state(0);

	let lastPinchScale: number | null = $state(null);
	let lastPanX: number | null = $state(null);

	let scale = $state(DEFAULT_SCALE);
	let startingMinutes = $state(DEFAULT_STARTING_MINUTES);

	let hourWidth = $derived(scale * (chartWidth / 24));
	let leftPx = $derived((startingMinutes / 60) * hourWidth);

	function pinchHandler(event: PinchCustomEvent) {
		const pinchX = event.detail.center.x - (chartElement?.getBoundingClientRect().left ?? 0);
		const pinchMinutes = ((leftPx + pinchX) / hourWidth) * 60;

		const scaleDiff =
			lastPinchScale === null ? event.detail.scale : event.detail.scale / lastPinchScale;
		lastPinchScale = event.detail.scale;
		scale = Math.min(SCALE_MAX, Math.max(SCALE_MIN, scale * scaleDiff));

		const newHourWidth = scale * (chartWidth / 24);
		const maxStartingMinutes = 24 * 60 * (1 - 1 / scale);
		startingMinutes = Math.min(
			maxStartingMinutes,
			Math.max(0, pinchMinutes - (pinchX / newHourWidth) * 60)
		);
		viewportReactivityTrigger++;
	}

	function panHandler(event: PanCustomEvent) {
		if (lastPanX === null) lastPanX = event.detail.x;
		const deltaX = lastPanX! - event.detail.x;
		lastPanX = event.detail.x;
		const deltaMinutes = (deltaX / hourWidth) * 60;

		const maxStartingMinutes = 24 * 60 * (1 - 1 / scale);
		startingMinutes = Math.min(maxStartingMinutes, Math.max(0, startingMinutes + deltaMinutes));
		viewportReactivityTrigger++;
	}

	function wheelHandler(event: WheelEvent) {
		if (!chartElement) return;

		if (!event.ctrlKey && !event.shiftKey) return;
		event.preventDefault();

		if (event.ctrlKey) {
			// Zoom
			const wheelX = event.clientX - chartElement.getBoundingClientRect().left;
			const wheelMinutes = ((leftPx + wheelX) / hourWidth) * 60;

			const scaleDiff = event.deltaY < 0 ? 1.075 : 0.925;
			scale = Math.min(SCALE_MAX, Math.max(SCALE_MIN, scale * scaleDiff));

			const newHourWidth = scale * (chartWidth / 24);
			const maxStartingMinutes = 24 * 60 * (1 - 1 / scale);
			startingMinutes = Math.min(
				maxStartingMinutes,
				Math.max(0, wheelMinutes - (wheelX / newHourWidth) * 60)
			);
		} else if (event.shiftKey) {
			// Pan
			const deltaX = event.deltaY;
			const deltaMinutes = (deltaX / hourWidth) * 60;

			const maxStartingMinutes = 24 * 60 * (1 - 1 / scale);
			startingMinutes = Math.min(maxStartingMinutes, Math.max(0, startingMinutes + deltaMinutes));
		}
		viewportReactivityTrigger++;
	}

	onMount(() => {
		setInterval(() => {
			// prevents the number from getting too big
			viewportReactivityTrigger = 0;
		}, 60000);
	});

	const nowDay = $derived.by(() => {
		const now = eventState.now;
		return days.findIndex(
			(day) =>
				day.getFullYear() === now.getFullYear() &&
				day.getMonth() === now.getMonth() &&
				day.getDate() === now.getDate()
		);
	});
	const nowMinutes = $derived.by(() => {
		const now = eventState.now;
		return now.getHours() * 60 + now.getMinutes();
	});

	const tzBufferMinutes = 90; // 1.5 hours buffer around timezone change
	const tzChangePoint = $derived.by(() => {
		let beg = new SvelteDate(days[0]),
			end = new SvelteDate(days[days.length - 1]);
		end.setHours(23, 59, 59, 999);
		if (beg.getTimezoneOffset() === end.getTimezoneOffset()) {
			return null;
		}

		// binary search for timezone change point
		while (end.getTime() - beg.getTime() > 1000) {
			const mid = new SvelteDate((beg.getTime() + end.getTime()) / 2);
			if (beg.getTimezoneOffset() !== mid.getTimezoneOffset()) {
				end = mid;
			} else {
				beg = mid;
			}
		}
		return end;
	});
	const tzChangeDayIndex = $derived.by(() => {
		if (tzChangePoint === null) return null;
		return Math.floor((tzChangePoint.getTime() - days[0].getTime()) / (1000 * 60 * 60 * 24));
	});
	const tzStartMinutes = $derived.by(() => {
		if (tzChangePoint === null) return 0;
		return tzChangePoint.getHours() * 60 + tzChangePoint.getMinutes();
	});
</script>

<div class="fixed bottom-0 left-1/2 -translate-x-1/2">
	T: {(startingMinutes / 60).toFixed(2)} - {(startingMinutes / 60 + 24 / scale).toFixed(2)}
	| S: {scale.toFixed(2)} | Sm: {startingMinutes.toFixed(0)} | L: {leftPx.toFixed(0)}
	| W: {chartWidth.toFixed(0)} | HW: {hourWidth.toFixed(0)}
</div>

<svelte:window
	onresize={async () => {
		viewportReactivityTrigger++;
		for (let i = 0; i < 10; i++) {
			await tick();
			viewportReactivityTrigger++;
		}
	}}
/>

<div
	class="flex grow"
	style="touch-action: manipulation;"
	{...usePinch(pinchHandler, undefined, {
		onpinchup: () => {
			lastPinchScale = null;
		}
	})}
	{...usePan(
		panHandler,
		() => {
			return {
				delay: 0
			};
		},
		{
			onpanup: () => {
				lastPanX = null;
			}
		}
	)}
	onwheel={wheelHandler}
>
	<div class="z-10 flex flex-col bg-white shadow-md">
		<div class="relative border-b p-2" style="height: {timeRowHeight + 1}px;">
			<span class="absolute bottom-0">Date</span>
			<span
				style="writing-mode: sideways-lr;"
				class="absolute top-1/2 right-0 -translate-y-1/2 font-mono">Time</span
			>
		</div>
		{#each days as day, index ([day, index])}
			<div
				class="border-secondary/50 flex grow flex-col items-center border-b p-2"
				bind:clientHeight={dayRowHeight[index]}
			>
				<div class="relative my-2 grow font-medium" bind:clientHeight={dayTextHeight[index]}>
					<div
						class="absolute left-1/2 -translate-x-1/2"
						style="font-size: {dayTextHeight[index]}px; line-height: 1;"
					>
						{index}.
					</div>
					<span class="invisible text-xl">{index}.</span>
				</div>
				<div class="text-sm whitespace-nowrap">{formatDayDate(day)}</div>
			</div>
		{/each}
	</div>
	<div class="relative grow" bind:clientWidth={chartWidth} bind:this={chartElement}>
		<div class="absolute" style="left: {-leftPx}px; top: 0;">
			<div class="flex border-b" bind:clientHeight={timeRowHeight}>
				<!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
				{#each Array(24) as _, hour (hour)}
					<div
						class="border-secondary/50 relative border-l px-2 py-0.5 text-center font-mono"
						style="width: {hourWidth}px; writing-mode: sideways-lr;"
					>
						{hour.toString().padStart(2, '0')}:00
					</div>
				{/each}
			</div>
			{#each days as day, dayIndex (day)}
				<div
					class="border-secondary/50 relative flex border-b"
					style="height: {dayRowHeight[dayIndex] + 1}px;"
				>
					<!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
					{#each Array(24) as _, hour (hour)}
						<div class="border-secondary/50 border-l" style="width: {hourWidth}px;"></div>
					{/each}
					{#if dayIndex === nowDay}
						<div
							class="absolute top-0 w-0.5 bg-red-500"
							id="now-time-line"
							title="Aktuálny čas"
							style="
								left: {(nowMinutes / 60) * hourWidth}px;
								height: {dayRowHeight[dayIndex] + 1}px;
							"
						></div>
					{/if}
					{#if tzChangeDayIndex !== null && Math.abs(tzChangeDayIndex - dayIndex) <= 1}
						{@const dayMinDiff = (tzChangeDayIndex - dayIndex) * 24 * 60}
						{@const blockStartMinutes = tzStartMinutes + dayMinDiff - tzBufferMinutes}
						<div
							class="tz-change-block absolute top-0"
							title="Do tohto bloku neodporúčame dávať aktivity, kvôli zmene času."
							style="
								left: {(blockStartMinutes / 60) * hourWidth}px;
								width: {((tzBufferMinutes * 2) / 60) * hourWidth}px;
								height: {dayRowHeight[dayIndex] + 1}px;
							"
						></div>
						<div
							class="absolute top-0 left-0 -translate-x-1/2 bg-red-500"
							title="Zmena času"
							style="
								left: {((blockStartMinutes + tzBufferMinutes) / 60) * hourWidth}px;
								width: {Math.max(hourWidth / 90, 4)}px;
								height: {dayRowHeight[dayIndex] + 1}px;
							"
						></div>
					{/if}
					{#each perDayActivities[dayIndex] as activity (activity.id)}
						<ActivityBlock
							{activity}
							{hourWidth}
							{...globalBlockProps}
							{viewportReactivityTrigger}
						/>
					{/each}
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.tz-change-block {
		background: repeating-linear-gradient(
			120deg,
			var(--color-red-500),
			var(--color-red-500) 5px,
			black 5px,
			black 10px
		);
		opacity: 0.5;
	}

	#now-time-line::before,
	#now-time-line::after {
		content: '';
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
		width: 8px;
		height: 8px;
		background-color: var(--color-red-500);
	}

	#now-time-line::before {
		top: 0;
		clip-path: polygon(50% 100%, 0% 0%, 100% 0%);
	}

	#now-time-line::after {
		bottom: 0;
		clip-path: polygon(0% 100%, 100% 100%, 50% 0%);
	}
</style>

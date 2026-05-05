<script lang="ts">
	import Icon from '@iconify/svelte';
	import type { PageProps } from './$types';
	import { pluralize } from '$lib/utils';
	import { Flag, hasFlag } from '$lib/flags';

	let { data }: PageProps = $props();
</script>

<h1 class="my-4 text-3xl font-bold">Miesta aktivít</h1>

<div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
	{#each Object.values(data.locations) as location (location.id)}
		<div
			class="border-light-content bg-base-200 shadow-light-content/10 min-w-64 rounded-lg border p-4 shadow-md"
		>
			<div class="flex gap-2">
				<h2 class="text-xl font-semibold">{location.name}</h2>
				<div class="ml-auto">
					{#if hasFlag(location, Flag.STATIC)}
						<span class="inline-block" title="Miesto je statické a nedá sa upravovať">
							<Icon icon="mdi:lock" class="text-muted-content" />
						</span>
					{:else}
						{#if hasFlag(location, Flag.FROM_GLOBAL)}
							<span
								class="inline-block"
								title="Miesto je získané z globálneho serveru a nedá sa upravovať"
							>
								<Icon icon="mdi:earth" class="text-muted-content" />
							</span>
						{:else}
							<button
								onclick={() => /* TODO: open edit dialog */ null}
								class="hover:text-light-content cursor-pointer transition-colors"
								title="Upraviť miesto"
							>
								<Icon icon="mdi:pencil" />
							</button>
						{/if}
						<button
							onclick={() => /* TODO: open delete confirmation */ null}
							class="disabled:text-muted-content ml-1 cursor-pointer transition-colors enabled:hover:text-red-500 disabled:cursor-not-allowed"
							disabled={location.activityCount > 0}
							title={location.activityCount > 0
								? 'Miesto sa nedá odstrániť, keďže je priradené k nejakej aktivite'
								: 'Odstrániť miesto'}
						>
							<Icon icon="mdi:trash-can" />
						</button>
					{/if}
				</div>
			</div>
			<div class="flex gap-2">
				<p class="text-light-content">{location.content}</p>
				<p class="text-muted-content ml-auto">
					{location.eventCount} akci{pluralize(location.eventCount, 'a', 'e', 'í')} ({location.activityCount}
					aktiv{pluralize(location.activityCount, 'ita', 'ity', 'ít')})
				</p>
			</div>
		</div>
	{/each}
</div>

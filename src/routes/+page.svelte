<script lang="ts">
	import Icon from '@iconify/svelte';

	const { data } = $props();
</script>

<div class="flex min-h-screen flex-col items-center justify-center">
	<h1 class="text-4xl font-bold">Dostupné akcie</h1>

	<ul class="mt-8 divide-y rounded border">
		{#each data.events as event}
			<li class="flex gap-10 p-4 first:rounded-t last:rounded-b">
				<div class="flex flex-col justify-between">
					<h4 class="text-xl font-medium">{event.name}</h4>
					<p class="text-sm text-gray-600">
						{event.startDate.getDate()}.
						{event.startDate.getMonth() + 1}.
						{#if event.startDate.getFullYear() !== event.endDate.getFullYear()}{event.startDate.getFullYear()}{/if}
						-
						{event.endDate.getDate()}. {event.endDate.getMonth() + 1}. {event.endDate.getFullYear()}
						{#if event.location}
							/ {event.location}{/if}
					</p>
				</div>
				<div class="ml-auto flex flex-col gap-2">
					<a
						href="/{event.id}/admin"
						class="flex items-center gap-2 rounded-full bg-gray-200 px-2 py-0.5 hover:bg-gray-300"
					>
						<span>Admin</span>
						<Icon icon="mdi:cog-outline" class="text-xl" />
					</a>
					<a
						href="/{event.id}/visual"
						class="flex items-center gap-2 rounded-full bg-gray-200 px-2 py-0.5 hover:bg-gray-300"
					>
						<span>Visual</span>
						<Icon icon="mdi:monitor-eye" class="text-xl" />
					</a>
				</div>
			</li>
		{/each}
		<li>
			<a href="/create" class="flex items-center justify-center gap-2 p-4 hover:bg-gray-100">
				<Icon icon="mdi:plus-circle-outline" class="text-2xl" />
				<span class="text-lg font-medium">Vytvoriť novú akciu</span>
			</a>
		</li>
	</ul>
</div>

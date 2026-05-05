<script lang="ts">
	import Icon from '@iconify/svelte';
	import type { PageProps } from './$types';
	import { pluralize } from '$lib/utils';
	import { getConfigurableSoundRoot } from '$lib/sounds/configurable';
	import { Flag, hasFlag } from '$lib/flags';
	import { ConfigurableSounds } from '$lib/types/enums';

	const confSoundsRoot = getConfigurableSoundRoot();

	let { data }: PageProps = $props();

	const groupedSounds = $derived.by(() => {
		const groups = data.sounds.reduce(
			(acc, sound) => {
				if (!acc[sound.key]) acc[sound.key] = [];
				const isDefault = hasFlag(sound, Flag.DEFAULT);
				if (isDefault) acc[sound.key].unshift(sound);
				else acc[sound.key].push(sound);
				return acc;
			},
			{} as Record<ConfigurableSounds, typeof data.sounds>
		);
		for (const key in ConfigurableSounds) {
			const realKey = ConfigurableSounds[key as keyof typeof ConfigurableSounds];
			if (!groups[realKey]) groups[realKey] = [];
		}
		return Object.entries(groups) as [ConfigurableSounds, typeof data.sounds][];
	});
</script>

<h1 class="my-4 text-3xl font-bold">Nastaviteľné zvuky</h1>

{#each groupedSounds as [key, sounds] (sounds)}
	<h2 class="my-2 text-2xl font-semibold">{key}</h2>
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
		{#each sounds as sound (sound.id)}
			<div
				class={[
					' min-w-64 rounded-lg border p-4 shadow-md',
					hasFlag(sound, Flag.DEFAULT) ? 'bg-info-bg border-info/50' : 'border-base-300 bg-base-200'
				]}
				data-sound-id={sound.id}
			>
				<div class="flex gap-2">
					<h3 class="text-xl font-semibold">{sound.description}</h3>
					<div class="ml-auto flex items-center gap-2 text-lg">
						{#if !hasFlag(sound, Flag.DEFAULT)}
							<button
								onclick={() => /* TODO: set as default confirmation */ null}
								class="hover:text-light-content cursor-pointer transition-colors"
								title="Nastaviť ako predvolený zvuk pre nové akcie"
							>
								<Icon icon="mdi:star-outline" />
							</button>
						{/if}
						{#if hasFlag(sound, Flag.FROM_GLOBAL)}
							<span title="Zvuk je získaný z globálneho serveru a nedá sa upravovať">
								<Icon icon="mdi:pencil-off" class="text-muted-content" />
							</span>
						{:else}
							<button
								onclick={() => /* TODO: open edit dialog */ null}
								class="hover:text-light-content cursor-pointer transition-colors"
								title="Upraviť zvuk"
							>
								<Icon icon="mdi:pencil" />
							</button>
						{/if}
						<button
							onclick={() => /* TODO: open delete confirmation */ null}
							class="group disabled:text-muted-content cursor-pointer transition-colors enabled:hover:text-red-500 disabled:cursor-not-allowed"
							disabled={hasFlag(sound, Flag.DEFAULT) || sound.eventCount > 0}
							title={hasFlag(sound, Flag.DEFAULT)
								? 'Tento zvuk je aktuálne predvolený, proto se nedá odstrániť'
								: sound.eventCount > 0
									? 'Zvuk sa nedá odstrániť, keďže je priradený k nejakej akcii'
									: 'Odstrániť zvuk'}
						>
							<Icon icon="mdi:delete" class="group-disabled:hidden" />
							<Icon icon="mdi:delete-off" class="hidden group-disabled:inline" />
						</button>
					</div>
				</div>
				<div class="flex gap-2">
					<span
						class="text-base-content/70 *:hover:text-base-content inline-flex items-center gap-1"
					>
						{#if hasFlag(sound, Flag.DEFAULT)}
							<span title="Tento zvuk je predvolený pre nové akcie">
								<Icon icon="mdi:star" />
							</span>
						{/if}
						{#if hasFlag(sound, Flag.FROM_GLOBAL)}
							<span title="Zvuk je získaný z globálneho serveru">
								<Icon icon="mdi:earth" />
							</span>
						{/if}
						{#if hasFlag(sound, Flag.LOCAL_ONLY)}
							<span title="Zvuk nebude nikdy nahraný na globálny server">
								<Icon icon="mdi:cloud-off" />
							</span>
						{/if}
						{#if hasFlag(sound, Flag.UPLOADED)}
							<span title="Zvuk bol nahraný na globálny server">
								<Icon icon="mdi:cloud-check" />
							</span>
						{/if}
					</span>
					<span class="text-muted-content ml-auto">
						{sound.eventCount} akci{pluralize(sound.eventCount, 'a', 'e', 'í')}
					</span>
				</div>
				<audio src="{confSoundsRoot}/{sound.path}" controls class="mt-2 w-full"></audio>
			</div>
		{/each}
	</div>
{/each}

<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { fade } from 'svelte/transition';

	let {
		children,
		onClickOutside
	}: {
		children: Snippet;
		onClickOutside?: () => void;
	} = $props();

	onMount(() => {
		// Prevent background scrolling when overlay is active
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = '';
		};
	});
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	class="fixed inset-0 z-30 flex justify-center overflow-scroll bg-black/50"
	transition:fade={{ duration: 200 }}
	onclick={(event) => event.target === event.currentTarget && onClickOutside?.()}
>
	<div class="bg-base-100 m-4 h-min w-11/12 max-w-2xl rounded p-6 shadow-lg">
		{@render children()}
	</div>
</div>

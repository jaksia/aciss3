<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { styleData } from '$lib/themes';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	const systemSection = $derived.by(() => {
		return page.url.pathname.includes('/system') ? page.url.pathname.split('/system')[1] : null;
	});

	const styles = styleData['default'];
</script>

<div class="text-base-content flex min-h-screen flex-col">
	<nav
		class="sticky top-0 z-10 flex h-24 text-white"
		style="background-color: {styles.primaryColor};"
	>
		<div class="mr-4 flex grow items-center justify-end space-x-4">
			<a
				href={resolve('/system/sounds')}
				class={['navbar-btn text-lg', systemSection === '/sounds' && 'active']}>Zvuky</a
			>
			<a
				href={resolve('/system/locations')}
				class={['navbar-btn text-lg', systemSection === '/locations' && 'active']}>Miesta aktivít</a
			>
			<a href={resolve('/system')} class={['navbar-btn text-lg', systemSection === '' && 'active']}
				>Prehľad systému</a
			>
		</div>
	</nav>

	<div class="flex grow flex-col p-4">
		{@render children()}
	</div>
</div>

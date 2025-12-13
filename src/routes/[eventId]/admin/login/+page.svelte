<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let pending = $state(false);
</script>

<div class="flex flex-col items-center justify-center p-8">
	<h2 class="mb-3 text-2xl font-bold">Zadajte heslo</h2>
	<p class="mb-8 text-center text-gray-600">
		Táto akcia vyžaduje heslo na prístup do administrátorského rozhrania.
	</p>
	<form
		action="?/login"
		method="POST"
		class="flex flex-col items-center gap-3"
		use:enhance={() => {
			pending = true;

			return async ({ update }) => {
				pending = false;
				await update();
			};
		}}
	>
		<input type="password" name="eventPassword" placeholder="Heslo" class="rounded" />
		<div class=" flex items-center gap-2">
			<input type="checkbox" id="rememberMe" name="rememberMe" class="rounded" />
			<label for="rememberMe" class="text-gray-700">Zapamätať si ma na týždeň</label>
		</div>
		<button type="submit" class="btn btn-secondary" disabled={pending}>Prihlásiť sa</button>
	</form>
	<strong class="my-2 text-red-500">{form?.message ?? ''}</strong>
</div>

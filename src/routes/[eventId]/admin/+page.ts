import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	redirect(302, resolve('/[eventId]/admin/schedule', params));
};

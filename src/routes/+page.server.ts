import { getEvents } from '$lib/server/db/utils';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {
		events: await getEvents()
	};
};

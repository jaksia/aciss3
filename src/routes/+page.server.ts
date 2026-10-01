import { getEvents } from '#lib/server/db/utils/index.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {
		events: await getEvents()
	};
};

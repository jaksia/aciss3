import { getEvent, getActivities } from '$lib/server/db/utils';
import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ params }) => {
	const eventId = Number.parseInt(params.eventId);
	if (isNaN(eventId)) error(404);
	const event = await getEvent(eventId);
	if (!event) error(404);

	const activities = Object.values(await getActivities(event.id));

	return {
		event,
		activities
	};
};

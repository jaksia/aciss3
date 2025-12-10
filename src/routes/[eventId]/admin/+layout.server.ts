import { getEvent } from '$lib/server/db/utils';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, params, request }) => {
	const eventId = parseInt(params.eventId);
	if (isNaN(eventId)) {
		throw new Error('Invalid event ID');
	}
	const event = await getEvent(eventId);
	if (!event) {
		throw new Error('Event not found');
	}

	if (event.adminPasswordHash === null) {
		// password not required
		return {};
	}

	const session = locals.session;
	if (!session || !session.allowedEvents.some((e) => e.eventId === event.id)) {
		// dont redirect if attempting to access login page
		if (request.url.includes(`/${params.eventId}/admin/login`)) {
			return {};
		}
		redirect(302, `/${params.eventId}/admin/login`);
	}

	return {};
};

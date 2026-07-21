import { verify } from '@node-rs/argon2';
import { fail, redirect } from '@sveltejs/kit';
import * as auth from '$lib/server/session';
import type { Actions, PageServerLoad } from './$types';
import { getEvent } from '$lib/server/db/utils';
import { ARGON2_CONFIG } from '$lib/server/session';
import { markSessionAsUpdated } from '$lib/server/socket';

export const load: PageServerLoad = async ({ params, locals, parent }) => {
	const { event } = await parent();

	if (!event.adminPasswordHash) {
		redirect(302, `/${params.eventId}/admin`);
	}

	if (locals.session && locals.session.allowedEvents.some((e) => e.eventId === event.id)) {
		return redirect(302, `/${params.eventId}/admin`);
	}

	return {};
};

export const actions: Actions = {
	login: async (requestEvent) => {
		const { request, params, locals } = requestEvent;
		const formData = await request.formData();
		const password = formData.get('eventPassword');
		const remember = formData.get('rememberMe') === 'on';

		if (!password || typeof password !== 'string') {
			return fail(400, { message: 'Password is required' });
		}

		const eventId = parseInt(params.eventId);
		if (isNaN(eventId)) {
			throw new Error('Invalid event ID');
		}
		// need to refetch the event to get the password hash
		const event = await getEvent(eventId, { returnPasswordHash: true });
		if (!event) {
			throw new Error('Event not found');
		}

		if (event.adminPasswordHash) {
			const validPassword = await verify(event.adminPasswordHash, password, ARGON2_CONFIG);
			if (!validPassword) {
				return fail(400, { message: 'Incorrect password' });
			}
		}

		if (locals.session) {
			auth.addAllowedEventToSession(locals.session.id, event.id);
			markSessionAsUpdated(locals.session.id);
		} else {
			const sessionToken = auth.generateSessionToken();
			const { session, socketCode } = await auth.createSession(sessionToken);
			auth.setSessionCookies(requestEvent, sessionToken, socketCode, session.expiresAt);
			auth.addAllowedEventToSession(session.id, event.id, remember);
		}

		return redirect(302, `/${event.id}/admin`);
	}
};

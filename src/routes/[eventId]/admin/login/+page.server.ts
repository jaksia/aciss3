import { verify } from '@node-rs/argon2';
import { fail, redirect } from '@sveltejs/kit';
import * as auth from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';
import { getEvent } from '$lib/server/db/utils';
import { ARGON2_CONFIG } from '$lib/server/auth';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (
		locals.session &&
		locals.session.allowedEvents.some((e) => e.eventId === parseInt(params.eventId))
	) {
		return redirect(302, `/${params.eventId}/admin`);
	}

	const eventId = parseInt(params.eventId);
	if (isNaN(eventId)) {
		throw new Error('Invalid event ID');
	}
	const event = await getEvent(eventId);
	if (!event) {
		throw new Error('Event not found');
	}
	if (!event.adminPasswordHash) {
		redirect(302, `/${params.eventId}/admin`);
	}

	return {};
};

export const actions: Actions = {
	login: async (requestEvent) => {
		const { request, params, locals } = requestEvent;
		const formData = await request.formData();
		const password = formData.get('eventPassword');
		const remember = formData.get('rememberMe') === 'on';

		if (!validatePassword(password)) {
			return fail(400, { message: 'Invalid password (min 6, max 255 characters)' });
		}

		const eventId = parseInt(params.eventId);
		if (isNaN(eventId)) {
			throw new Error('Invalid event ID');
		}
		const event = await getEvent(eventId);
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
		} else {
			const sessionToken = auth.generateSessionToken();
			const session = await auth.createSession(sessionToken);
			auth.setSessionTokenCookie(requestEvent, sessionToken, session.expiresAt);
			auth.addAllowedEventToSession(session.id, event.id, remember);
		}

		return redirect(302, `/${event.id}/admin`);
	}
};

function validatePassword(password: unknown): password is string {
	return typeof password === 'string' && password.length >= 6 && password.length <= 255;
}

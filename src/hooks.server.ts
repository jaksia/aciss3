import * as auth from '$lib/server/auth';
import type { ServerInit, Handle } from '@sveltejs/kit';
import { initSocket } from '$lib/server/socket';
import { initDB } from '$lib/server/db';
import { env } from '$env/dynamic/private';

let socketInitialized = false;

export const init: ServerInit = async () => {
	const db_url = env.DATABASE_URL;

	if (!db_url) throw new Error('DATABASE_URL environment variable is not set.');

	initDB(db_url);

	const port = env.SOCKETIO_PORT;

	if (!port) throw new Error('SOCKETIO_PORT environment variable is not set.');

	const portNumber = Number(port);

	if (isNaN(portNumber))
		throw new Error('SOCKETIO_PORT environment variable is not a valid number.');

	if (!socketInitialized) {
		await initSocket(portNumber);
		socketInitialized = true;
	}
};

const handleAuth: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get(auth.sessionCookieName);

	if (!sessionToken) {
		event.locals.session = null;
		return resolve(event);
	}

	const { session } = await auth.validateSessionToken(sessionToken);

	if (session) {
		auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
	} else {
		auth.deleteSessionTokenCookie(event);
	}

	event.locals.session = session;
	return resolve(event);
};

export const handle: Handle = handleAuth;

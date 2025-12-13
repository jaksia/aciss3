import * as auth from '$lib/server/session';
import type { ServerInit, Handle } from '@sveltejs/kit';
import { initSocket } from '$lib/server/socket';
import { initDB } from '$lib/server/db';
import { env } from '$env/dynamic/private';
import { socketCodeCookieName } from '$lib/state.svelte';

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
	const socketCode = event.cookies.get(socketCodeCookieName);

	if (!sessionToken) {
		event.locals.session = null;
		return resolve(event);
	}

	const { session } = await auth.validateSessionToken(sessionToken);

	if (session) {
		auth.setSessionCookies(event, sessionToken, socketCode, session.expiresAt);
	} else {
		auth.deleteSessionCookies(event);
	}

	event.locals.session = session;
	return resolve(event);
};

export const handle: Handle = handleAuth;

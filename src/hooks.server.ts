import { type ServerInit } from '@sveltejs/kit';
import { initSocket } from '$lib/server/socket';
import { initDB } from '$lib/server/db';

let socketInitialized = false;

export const init: ServerInit = async () => {
	const db_url = process.env.DATABASE_URL;
	if (!db_url) {
		throw new Error('DATABASE_URL environment variable is not set.');
	}
	initDB(db_url);

	const port = process.env.SOCKETIO_PORT;
	if (!port) {
		throw new Error('SOCKETIO_PORT environment variable is not set.');
	}
	const portNumber = Number(port);
	if (isNaN(portNumber)) {
		throw new Error('SOCKETIO_PORT environment variable is not a valid number.');
	}

	if (!socketInitialized) {
		await initSocket(portNumber);
		socketInitialized = true;
	}
};

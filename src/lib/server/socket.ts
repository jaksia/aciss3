import type { Activity, Event } from '$lib/types/db';
import type {
	ClientToServerEvents,
	InterServerEvents,
	ServerToClientEvents,
	SocketData
} from '$lib/types/realtime';
import { Server, type Socket } from 'socket.io';
import { getActivities, getActivity, getEvent } from './db/utils';
import { validateSocketCode } from './session';

type SocketIO = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type SocketClient = Socket<
	ClientToServerEvents,
	ServerToClientEvents,
	InterServerEvents,
	SocketData
>;

// --- HMR Global Persistence ---
const SOCKET_IO_KEY = Symbol.for('sveltekit.socketio');

interface GlobalWithSocket {
	[SOCKET_IO_KEY]?: SocketIO;
}

const globalWithSocket = globalThis as unknown as GlobalWithSocket;
// ------------------------------

let io: SocketIO | null = globalWithSocket[SOCKET_IO_KEY] || null;
let initializing: Promise<SocketIO> | null = null;

const updatedSessions = new Set<string>();
const protectedEvents = new Set<Event['id']>();

async function attachSocketListeners(io: SocketIO, socket: SocketClient) {
	socket.on('joinEvent', async (eventId, callback) => {
		const event = await getEvent(eventId);
		if (!event) {
			callback({ success: false, error: 'Event not found' });
			return;
		}

		if (event.adminPasswordHash !== null) {
			protectedEvents.add(event.id);
		} else {
			protectedEvents.delete(event.id);
		}

		if (socket.data.activeEventId) {
			await socket.leave(`event_${socket.data.activeEventId}`);
			console.log(`⬅️ User ${socket.id} left event ${socket.data.activeEventId}`);
		}

		socket.join(`event_${eventId}`);
		socket.data.activeEventId = eventId;
		console.log(`➡️ User ${socket.id} joined event ${eventId}`);

		callback({ success: true, event, activities: await getActivities(eventId) });
	});

	socket.on('leaveEvent', async (eventId) => {
		if (socket.data.activeEventId !== eventId) return;

		await socket.leave(`event_${eventId}`);
		socket.data.activeEventId = null;
		console.log(`⬅️ User ${socket.id} left event ${eventId}`);
	});

	socket.on('checkActiveEvent', () => {
		return socket.data.activeEventId;
	});

	// playerControl events originate from admin clients and need to reach sound-playing clients
	socket.on('playerControl', async (data, callback) => {
		if (!socket.data.activeEventId)
			return callback({ success: false, error: 'Not connected to any event' });

		if (protectedEvents.has(socket.data.activeEventId)) {
			if (!socket.data.session) {
				return callback({ success: false, error: 'No active session' });
			}

			if (updatedSessions.has(socket.data.session.id)) {
				updatedSessions.delete(socket.data.session.id);
				const { session } = await validateSocketCode(socket.data.session.socketCodeHash);
				if (!session) {
					return callback({ success: false, error: 'Session no longer valid' });
				}
				socket.data.session = session;
			}

			if (!socket.data.session.allowedEvents.some((e) => e.eventId === socket.data.activeEventId)) {
				return callback({ success: false, error: 'No permission for this event' });
			}
		}

		io.to(`event_${socket.data.activeEventId}`).emit('playerControl', { ...data });
		callback({ success: true });
	});

	socket.on('disconnect', () => {
		console.log(`❌ User ${socket.id} disconnected`);
	});
}

async function configureServer(io: SocketIO) {
	// Crucial for HMR: remove existing listeners before re-adding and clear existing middleware
	io.removeAllListeners();
	io.sockets.sockets.forEach((socket) => {
		socket.removeAllListeners();
		attachSocketListeners(io, socket);
	});
	(io as any)._middleware = [];

	io.use(async (socket, next) => {
		socket.data.activeEventId = null;
		socket.data.session = null;

		if (socket.handshake.auth && socket.handshake.auth.socketCode) {
			const { session } = await validateSocketCode(socket.handshake.auth.socketCode);
			if (session) {
				console.log(`🔑 Session validated for ${socket.id}`);
				socket.data.session = session;
			}
		}
		next();
	});

	io.on('connection', async (socket) => {
		console.log(`✅ User ${socket.id} connected`);

		await attachSocketListeners(io, socket);
	});
}

export async function initSocket(port: number) {
	// If we already have an instance (from global or local state), reuse it
	if (globalWithSocket[SOCKET_IO_KEY]) {
		console.log('♻️ Reusing existing Socket.IO instance');
		io = globalWithSocket[SOCKET_IO_KEY]!;
		// Re-configure in case event logic changed in the file
		await configureServer(io);
		return io;
	}

	if (initializing) return initializing;

	initializing = (async () => {
		try {
			const server = new Server({
				cors: { origin: '*' }
			});

			await configureServer(server);

			console.log('🚀 Socket.IO initialized');

			// Using a Promise to ensure the port is actually bound before proceeding
			await new Promise<void>((resolve, reject) => {
				server.listen(port);
				server.engine.on('connection_error', (err) => console.error(err));
				// Give it a tiny bit of time to bind or fail
				setTimeout(resolve, 100);
			});

			console.log(`🌐 Socket.IO listening on port ${port}`);

			globalWithSocket[SOCKET_IO_KEY] = server;
			io = server;
			return io;
		} finally {
			initializing = null;
		}
	})();

	return initializing;
}

export function getIO() {
	const currentIo = io || globalWithSocket[SOCKET_IO_KEY];
	if (!currentIo) {
		throw new Error('Socket.IO not initialized. Call initSocket() first.');
	}
	return currentIo;
}

export async function triggerEventUpdate(eventId: Event['id']) {
	const event = await getEvent(eventId);
	if (!event) {
		protectedEvents.delete(eventId);
		return;
	}
	getIO().to(`event_${eventId}`).emit('eventUpdate', { eventId, event });
}

export async function triggerActivitiesUpdate(eventId: Event['id'], activityId?: Activity['id']) {
	const event = await getEvent(eventId);
	if (!event) return;
	const io = getIO();
	if (activityId) {
		const activity = await getActivity(eventId, activityId);
		if (activity)
			io.to(`event_${eventId}`).emit('activityUpdate', { eventId, activityId, activity });
		else io.to(`event_${eventId}`).emit('activityDelete', { eventId, activityId });
	} else {
		io.to(`event_${eventId}`).emit('activityListUpdate', {
			eventId,
			activities: await getActivities(eventId)
		});
	}
}

export function markSessionAsUpdated(sessionId: string) {
	updatedSessions.add(sessionId);
}

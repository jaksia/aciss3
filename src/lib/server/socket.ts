import type { Activity, Event } from '$lib/types/db';
import type {
	ClientToServerEvents,
	InterServerEvents,
	ServerToClientEvents,
	SocketData
} from '$lib/types/realtime';
import { Server } from 'socket.io';
import { getActivities, getActivity, getEvent } from './db/utils';

let io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> | null =
	null;
let initializing: Promise<Server> | null = null;

export async function initSocket(port: number) {
	if (initializing) return initializing;

	let resolve: (value: Server) => void;
	initializing = new Promise((_resolve) => ((resolve = _resolve), (initializing = null)));

	io = new Server({
		cors: {
			origin: '*'
		}
	});

	io.on('connection', (socket) => {
		console.log(`✅ User ${socket.id} connected`);

		socket.on('joinEvent', async (eventId, callback) => {
			const event = await getEvent(eventId);
			if (!event) {
				callback({ success: false, error: 'Event not found' });
				return;
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
		socket.on('playerControl', (data, code, callback) => {
			if (!socket.data.activeEventId)
				return callback({ success: false, error: 'Not connected to any event' });
			if (!code) return callback({ success: false, error: 'No code provided' });

			io!.to(`event_${socket.data.activeEventId}`).emit('playerControl', { ...data });
			callback({ success: true });
		});

		socket.on('disconnect', () => {
			console.log(`❌ User ${socket.id} disconnected`);
		});
	});

	console.log('🚀 Socket.IO initialized');

	io.listen(port);
	console.log(`🌐 Socket.IO listening on port ${port}`);

	resolve!(io);
	return io;
}

export function getIO() {
	if (!io) {
		throw new Error('Socket.IO not initialized. Call initSocket() first.');
	}
	return io;
}

export async function triggerEventUpdate(eventId: Event['id']) {
	const event = await getEvent(eventId);
	if (!event) return;
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

if (import.meta.hot) {
	import.meta.hot.on('vite:beforeUpdate', () => {
		if (io) {
			io.close();
			io = null;
			console.log('🛑 Socket.IO server stopped');
		}
	});
}

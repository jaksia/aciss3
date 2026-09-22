import type { Event, CustomSound, BaseEvent } from '$lib/types';
import { eq, min } from 'drizzle-orm';
import { db } from '..';
import { events, customSounds, eventsToSounds } from '../schema';

export async function getEvent(
	eventId: Event['id'],
	options: { returnPasswordHash?: boolean; includeLocations?: boolean } = {}
) {
	const baseEvent = await db.query.events.findFirst({
		where: {
			id: eventId
		},
		with: {
			sounds: true
		}
	});
	if (!baseEvent) return null;

	return {
		...baseEvent,
		sounds: baseEvent.sounds.reduce(
			(acc, es) => {
				acc[es.key] = es;
				return acc;
			},
			{} as Record<CustomSound['key'], CustomSound>
		),
		adminPasswordHash: options.returnPasswordHash
			? baseEvent.adminPasswordHash
			: baseEvent.adminPasswordHash === null
				? null
				: '*******',
		startDate: new Date(baseEvent.startDate),
		endDate: new Date(baseEvent.endDate)
	} as Event;
}

export async function getEvents() {
	const result: BaseEvent[] = await db.query.events.findMany();
	return result.map((event) => ({
		...event,
		adminPasswordHash: event.adminPasswordHash === null ? null : '*******',
		startDate: new Date(event.startDate),
		endDate: new Date(event.endDate)
	})) as Omit<Event, 'sounds'>[];
}

export async function createEvent(eventData: Omit<BaseEvent, 'id'>): Promise<Event['id']> {
	const defaultSounds = (
		await db
			.select({
				key: customSounds.key,
				id: min(customSounds.id)
			})
			.from(customSounds)
			.groupBy(customSounds.key)
			.where(eq(customSounds.default, true))
	).filter((s) => s.id !== null);

	const event = await db.transaction(async (tx) => {
		const [event] = await tx.insert(events).values(eventData).returning();

		for (const sound of defaultSounds) {
			if (!sound.id) continue;
			await tx.insert(eventsToSounds).values({
				eventId: event.id,
				customSoundId: sound.id,
				soundKey: sound.key
			});
		}

		return event;
	});

	return event.id;
}

export async function eventExists(eventId: Event['id']): Promise<boolean> {
	const event = await db.query.events.findFirst({
		where: {
			id: eventId
		}
	});
	return !!event;
}

export async function updateEvent(eventId: Event['id'], updates: Partial<Omit<BaseEvent, 'id'>>) {
	await db.update(events).set(updates).where(eq(events.id, eventId));
}

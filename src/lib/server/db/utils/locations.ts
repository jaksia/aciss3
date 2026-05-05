import type { Event, ActivityLocation } from '$lib/types/db';
import { eq, and, or, not, isNull } from 'drizzle-orm';
import { db } from '..';
import { eventsToLocations, locations } from '../schema';
import { Flag, hasFlagQ } from '../../../flags';

export async function getEventLocations(eventId: Event['id']) {
	const result = await db
		.select()
		.from(locations)
		.leftJoin(eventsToLocations, eq(locations.id, eventsToLocations.locationId))
		.where(or(eq(eventsToLocations.eventId, eventId), hasFlagQ(locations.flags, Flag.STATIC)));
	return result.reduce(
		(acc, { locations: loc }) => {
			acc[loc.id] = loc;
			return acc;
		},
		{} as Record<ActivityLocation['id'], ActivityLocation>
	);
}

export async function locationExists(locationId: ActivityLocation['id']) {
	const [location] = await db.select().from(locations).where(eq(locations.id, locationId));
	return !!location;
}

export async function getAvailableLocations(
	excludeEventId?: Event['id']
): Promise<ActivityLocation[]> {
	if (excludeEventId) {
		return await db
			.select({
				id: locations.id,
				name: locations.name,
				content: locations.content,
				path: locations.path,
				flags: locations.flags
			})
			.from(locations)
			.leftJoin(
				eventsToLocations,
				and(
					eq(eventsToLocations.eventId, excludeEventId),
					eq(eventsToLocations.locationId, locations.id)
				)
			)
			.where(
				and(isNull(eventsToLocations.locationId), not(hasFlagQ(locations.flags, Flag.STATIC)))
			);
	} else {
		return await db
			.select()
			.from(locations)
			.where(not(hasFlagQ(locations.flags, Flag.STATIC)));
	}
}

export async function assignLocationToEvent(
	eventId: Event['id'],
	locationId: ActivityLocation['id']
) {
	await db
		.insert(eventsToLocations)
		.values({ eventId: eventId, locationId: locationId })
		.onConflictDoNothing();
}

export async function removeLocationFromEvent(
	eventId: Event['id'],
	locationId: ActivityLocation['id']
) {
	await db
		.delete(eventsToLocations)
		.where(
			and(eq(eventsToLocations.eventId, eventId), eq(eventsToLocations.locationId, locationId))
		);
}

export async function removeAllLocationsFromEvent(eventId: Event['id']) {
	await db.delete(eventsToLocations).where(eq(eventsToLocations.eventId, eventId));
}

export async function createLocation(
	data: {
		name: ActivityLocation['name'];
		content: ActivityLocation['content'];
		path: ActivityLocation['path'];
	},
	eventId?: Event['id']
): Promise<ActivityLocation> {
	const [location] = await db
		.insert(locations)
		.values({ ...data })
		.returning();
	if (eventId) {
		await assignLocationToEvent(eventId, location.id);
	}
	return location;
}

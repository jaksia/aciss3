import type { Event, ActivityLocation } from '$lib/types';
import { eq, and, not, isNull } from 'drizzle-orm';
import { db } from '..';
import { eventsToLocations, locations } from '../schema';

export async function getEventLocations(eventId: Event['id']) {
	const result = await db.query.locations.findMany({
		where: {
			OR: [{ eventsViaEventsToLocations: { id: eventId } }, { isStatic: true }]
		}
	});
	return result.reduce(
		(acc, loc) => {
			acc[loc.id] = loc;
			return acc;
		},
		{} as Record<ActivityLocation['id'], ActivityLocation>
	);
}

export async function locationExists(locationId: ActivityLocation['id']) {
	const location = await db.query.locations.findFirst({
		where: {
			id: locationId
		}
	});
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
				isStatic: locations.isStatic
			})
			.from(locations)
			.leftJoin(
				eventsToLocations,
				and(
					eq(eventsToLocations.eventId, excludeEventId),
					eq(eventsToLocations.locationId, locations.id)
				)
			)
			.where(and(isNull(eventsToLocations.locationId), not(locations.isStatic)));
	} else {
		return await db.query.locations.findMany({
			where: {
				isStatic: false
			}
		});
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
		.values({ ...data, isStatic: false })
		.returning();
	if (eventId) {
		await assignLocationToEvent(eventId, location.id);
	}
	return location;
}

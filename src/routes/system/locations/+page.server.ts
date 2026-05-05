import { db } from '$lib/server/db/index.js';
import { activities, eventsToLocations, locations } from '$lib/server/db/schema.js';
import type { ActivityLocation } from '$lib/types/db.js';
import { countDistinct, eq, getTableColumns } from 'drizzle-orm';

export const load = async () => {
	return {
		locations: (await db
			.select({
				...getTableColumns(locations),
				eventCount: countDistinct(eventsToLocations.eventId),
				activityCount: countDistinct(activities.id)
			})
			.from(locations)
			.leftJoin(eventsToLocations, eq(locations.id, eventsToLocations.locationId))
			.leftJoin(activities, eq(locations.id, activities.locationId))
			.groupBy(locations.id)) as (ActivityLocation & {
			eventCount: number;
			activityCount: number;
		})[]
	};
};

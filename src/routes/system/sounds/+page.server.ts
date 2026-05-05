import { db } from '$lib/server/db/index.js';
import { customSounds, eventsToSounds } from '$lib/server/db/schema.js';
import type { CustomSound } from '$lib/types/db.js';
import { countDistinct, eq, getTableColumns } from 'drizzle-orm';

export const load = async () => {
	return {
		sounds: (await db
			.select({
				...getTableColumns(customSounds),
				eventCount: countDistinct(eventsToSounds.eventId)
			})
			.from(customSounds)
			.leftJoin(eventsToSounds, eq(customSounds.id, eventsToSounds.customSoundId))
			.groupBy(customSounds.id)) as (CustomSound & {
			eventCount: number;
		})[]
	};
};

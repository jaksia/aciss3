import type { Event, CustomSound } from '$lib/types/db';
import { eq, and } from 'drizzle-orm';
import { db } from '..';
import { customSounds, eventsToSounds } from '../schema';
import type { ConfigurableSounds } from '$lib/types/enums';

export async function getAvailableSounds(key?: ConfigurableSounds): Promise<CustomSound[]> {
	if (key) {
		return await db.select().from(customSounds).where(eq(customSounds.key, key));
	}
	return await db.select().from(customSounds);
}

export async function soundExists(
	soundId: CustomSound['id'],
	key?: CustomSound['key']
): Promise<boolean> {
	const query = db
		.select()
		.from(customSounds)
		.where(and(eq(customSounds.id, soundId), key ? eq(customSounds.key, key) : undefined));
	const [sound] = await query;
	return !!sound;
}

export async function setEventSound(
	eventId: Event['id'],
	soundId: CustomSound['id'] | null,
	key: ConfigurableSounds
) {
	const [existing] = await db
		.select()
		.from(eventsToSounds)
		.where(and(eq(eventsToSounds.eventId, eventId), eq(eventsToSounds.soundKey, key)));
	if (existing) {
		if (soundId === null) {
			await db
				.delete(eventsToSounds)
				.where(and(eq(eventsToSounds.eventId, eventId), eq(eventsToSounds.soundKey, key)));
		} else {
			await db
				.update(eventsToSounds)
				.set({ customSoundId: soundId })
				.where(and(eq(eventsToSounds.eventId, eventId), eq(eventsToSounds.soundKey, key)));
		}
	} else if (soundId !== null) {
		await db.insert(eventsToSounds).values({
			eventId,
			customSoundId: soundId,
			soundKey: key
		});
	} else {
		// No existing entry and soundId is null, do nothing
	}
}

export async function createCustomSound(
	filePath: string,
	key: ConfigurableSounds,
	description: string,
	createdForEventId: Event['id'] | null = null
) {
	const [customSound] = await db
		.insert(customSounds)
		.values({
			path: filePath,
			key,
			description
		})
		.returning();
	if (createdForEventId) {
		await setEventSound(createdForEventId, customSound.id, key);
	}
	return customSound;
}

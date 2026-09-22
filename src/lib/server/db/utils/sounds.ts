import type { Event, CustomSound, ConfigurableSounds } from '$lib/types';
import { eq, and } from 'drizzle-orm';
import { db } from '..';
import { customSounds, eventsToSounds } from '../schema';

export async function getAvailableSounds(key?: ConfigurableSounds): Promise<CustomSound[]> {
	if (key) {
		return await db.query.customSounds.findMany({
			where: {
				key: key
			}
		});
	}
	return await db.query.customSounds.findMany();
}

export async function soundExists(
	soundId: CustomSound['id'],
	key?: CustomSound['key']
): Promise<boolean> {
	const sound = await db.query.customSounds.findFirst({
		where: {
			id: soundId,
			key: key
		}
	});
	return !!sound;
}

export async function setEventSound(
	eventId: Event['id'],
	soundId: CustomSound['id'] | null,
	key: ConfigurableSounds
) {
	if (soundId === null) {
		await db
			.delete(eventsToSounds)
			.where(and(eq(eventsToSounds.eventId, eventId), eq(eventsToSounds.soundKey, key)));
		return;
	}

	await db
		.insert(eventsToSounds)
		.values({
			eventId,
			customSoundId: soundId,
			soundKey: key
		})
		.onConflictDoUpdate({
			target: [eventsToSounds.eventId, eventsToSounds.soundKey],
			set: {
				customSoundId: soundId
			}
		});
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

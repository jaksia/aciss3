import type {
	BaseActivity,
	Activity,
	Event,
	CustomSound,
	BaseEvent,
	EditableActivityServer,
	EditableEvent
} from '$lib/types/db';
import { eq, and, inArray, min } from 'drizzle-orm';
import { db } from '.';
import {
	activities,
	activityAdditionalInfos,
	activityAlertTimes,
	activityParticipantNeeds,
	events,
	customSounds,
	eventsToSounds
} from './schema';
import type { ConfigurableSounds } from '$lib/types/enums';

export async function getEvent(
	eventId: Event['id'],
	options: { returnPasswordHash: boolean } | null = null
) {
	const [event] = await db.select().from(events).where(eq(events.id, eventId));
	if (!event) return null;
	const sounds = await db
		.select()
		.from(eventsToSounds)
		.where(eq(eventsToSounds.eventId, eventId))
		.innerJoin(customSounds, eq(eventsToSounds.customSoundId, customSounds.id));
	return {
		...event,
		adminPasswordHash: options?.returnPasswordHash
			? event.adminPasswordHash
			: event.adminPasswordHash === null
				? null
				: '*******',
		startDate: new Date(event.startDate),
		endDate: new Date(event.endDate),
		sounds: sounds.reduce(
			(acc, es) => {
				acc[es.custom_sounds.key] = es.custom_sounds;
				return acc;
			},
			{} as Record<CustomSound['key'], CustomSound>
		)
	} as Event;
}

export async function getEvents() {
	const result: BaseEvent[] = await db.select().from(events);
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
	const [event] = await db.select().from(events).where(eq(events.id, eventId));
	return !!event;
}

export async function updateEvent(eventId: Event['id'], updates: Partial<Omit<BaseEvent, 'id'>>) {
	await db.update(events).set(updates).where(eq(events.id, eventId));
}

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

export async function getActivities(eventId: Event['id']) {
	const result: BaseActivity[] = await db
		.select()
		.from(activities)
		.where(eq(activities.eventId, eventId));
	const activityIds = result.map((activity) => activity.id);

	const _activities = result.reduce(
		(acc, ba) => {
			acc[ba.id] = {
				...ba,
				alertTimes: [],
				additionalInfos: [],
				participantNeeds: []
			};
			return acc;
		},
		{} as Record<Activity['id'], Activity>
	);

	const activitiesAlertTimes = await db
		.select()
		.from(activityAlertTimes)
		.where(inArray(activityAlertTimes.activityId, activityIds));
	activitiesAlertTimes.forEach((aat) => _activities[aat.activityId].alertTimes.push(aat));

	const activitiesAdditionalInfos = await db
		.select()
		.from(activityAdditionalInfos)
		.where(inArray(activityAdditionalInfos.activityId, activityIds));
	activitiesAdditionalInfos.forEach((aai) => _activities[aai.activityId].additionalInfos.push(aai));

	const activitiesParticipantNeeds = await db
		.select()
		.from(activityParticipantNeeds)
		.where(inArray(activityParticipantNeeds.activityId, activityIds));
	activitiesParticipantNeeds.forEach((apn) =>
		_activities[apn.activityId].participantNeeds.push(apn)
	);

	return _activities;
}

export async function getActivity(eventId: Event['id'], activityId: Activity['id']) {
	const [activity] = await db
		.select()
		.from(activities)
		.where(and(eq(activities.id, activityId), eq(activities.eventId, eventId)));
	if (!activity) return null;

	const alertTimes = await db
		.select()
		.from(activityAlertTimes)
		.where(eq(activityAlertTimes.activityId, activityId));

	const additionalInfos = await db
		.select()
		.from(activityAdditionalInfos)
		.where(eq(activityAdditionalInfos.activityId, activityId));

	const participantNeeds = await db
		.select()
		.from(activityParticipantNeeds)
		.where(eq(activityParticipantNeeds.activityId, activityId));

	return {
		...activity,
		alertTimes,
		additionalInfos,
		participantNeeds
	} as Activity;
}

export async function activityExists(
	eventId: Event['id'],
	activityId: Activity['id']
): Promise<boolean> {
	const [activity] = await db
		.select()
		.from(activities)
		.where(and(eq(activities.id, activityId), eq(activities.eventId, eventId)));
	return !!activity;
}

export async function deleteActivity(
	eventId: Event['id'],
	activityId: Activity['id']
): Promise<boolean> {
	const deleteResult = await db
		.delete(activities)
		.where(and(eq(activities.id, activityId), eq(activities.eventId, eventId)))
		.returning({ id: activities.id });
	return deleteResult.length > 0;
}

export async function createOrUpdateActivity(
	eventId: Event['id'],
	unprocessedActivity: EditableActivityServer,
	activityId?: Activity['id']
): Promise<Activity> {
	const activityData: Omit<BaseActivity, 'id'> = {
		eventId,
		name: unprocessedActivity.name,
		type: unprocessedActivity.type,
		location: unprocessedActivity.location,
		delay: unprocessedActivity.delay,
		zvolavanie: unprocessedActivity.zvolavanie,
		startTime: new Date(unprocessedActivity.startTime),
		endTime: new Date(unprocessedActivity.endTime)
	};

	let activity: BaseActivity;
	if (activityId) {
		[activity] = await db
			.update(activities)
			.set(activityData)
			.where(eq(activities.id, activityId))
			.returning();

		// It might be better to do a proper diff and only delete what's necessary, but this is simpler, so I don't care
		await db.delete(activityAlertTimes).where(eq(activityAlertTimes.activityId, activityId));
		await db
			.delete(activityAdditionalInfos)
			.where(eq(activityAdditionalInfos.activityId, activityId));
		await db
			.delete(activityParticipantNeeds)
			.where(eq(activityParticipantNeeds.activityId, activityId));
	} else {
		[activity] = await db.insert(activities).values(activityData).returning();
		activityId = activity.id;
	}

	const alertTimes =
		unprocessedActivity.alertTimes.length > 0
			? await db.insert(activityAlertTimes).values(
					unprocessedActivity.alertTimes.map((t) => ({
						activityId,
						minutes: t
					}))
				)
			: [];
	const additionalInfos =
		unprocessedActivity.additionalInfos.length > 0
			? await db.insert(activityAdditionalInfos).values(
					unprocessedActivity.additionalInfos.map((info) => ({
						activityId,
						info
					}))
				)
			: [];
	const participantNeeds =
		unprocessedActivity.participantNeeds.length > 0
			? await db.insert(activityParticipantNeeds).values(
					unprocessedActivity.participantNeeds.map((need) => ({
						activityId,
						need
					}))
				)
			: [];

	return {
		...activity,
		alertTimes,
		additionalInfos,
		participantNeeds
	};
}

export async function setActivityDelay(
	eventId: Event['id'],
	activityId: Activity['id'],
	delay: number | null
): Promise<Activity> {
	const [activity] = await db
		.update(activities)
		.set({ delay })
		.where(and(eq(activities.id, activityId), eq(activities.eventId, eventId)))
		.returning();

	const alertTimes = await db
		.select()
		.from(activityAlertTimes)
		.where(eq(activityAlertTimes.activityId, activityId));

	const additionalInfos = await db
		.select()
		.from(activityAdditionalInfos)
		.where(eq(activityAdditionalInfos.activityId, activityId));

	const participantNeeds = await db
		.select()
		.from(activityParticipantNeeds)
		.where(eq(activityParticipantNeeds.activityId, activityId));

	return {
		...activity,
		alertTimes,
		additionalInfos,
		participantNeeds
	} as Activity;
}

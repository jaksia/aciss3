import type { BaseActivity, Activity, Event, EditableActivityServer } from '$lib/types/db';
import { eq, and, inArray } from 'drizzle-orm';
import { db } from '..';
import {
	activities,
	activityAdditionalInfos,
	activityAlertTimes,
	activityParticipantNeeds,
	eventsToLocations,
	locations
} from '../schema';

export async function getActivities(eventId: Event['id']) {
	const result = await db
		.select()
		.from(activities)
		.innerJoin(locations, eq(activities.locationId, locations.id))
		.where(eq(activities.eventId, eventId));
	const activityIds = result.map((activity) => activity.activities.id);

	const _activities = result.reduce(
		(acc, { activities: ba, locations: location }) => {
			acc[ba.id] = {
				...ba,
				location,
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
	const result = await db
		.select()
		.from(activities)
		.innerJoin(locations, eq(activities.locationId, locations.id))
		.where(and(eq(activities.id, activityId), eq(activities.eventId, eventId)));
	if (result.length === 0) return null;

	const { activities: baseActivity, locations: location } = result[0];

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
		...baseActivity,
		location,
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
		locationId: unprocessedActivity.locationId,
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

	// Associate location with event if not already associated
	// TODO: don't associate static locations
	await db
		.insert(eventsToLocations)
		.values({
			eventId,
			locationId: unprocessedActivity.locationId
		})
		.onConflictDoNothing();

	const alertTimes =
		unprocessedActivity.alertTimes.length > 0
			? await db
					.insert(activityAlertTimes)
					.values(
						unprocessedActivity.alertTimes.map((t) => ({
							activityId,
							minutes: t
						}))
					)
					.returning()
			: [];
	const additionalInfos =
		unprocessedActivity.additionalInfos.length > 0
			? await db
					.insert(activityAdditionalInfos)
					.values(
						unprocessedActivity.additionalInfos.map((info) => ({
							activityId,
							info
						}))
					)
					.returning()
			: [];
	const participantNeeds =
		unprocessedActivity.participantNeeds.length > 0
			? await db
					.insert(activityParticipantNeeds)
					.values(
						unprocessedActivity.participantNeeds.map((need) => ({
							activityId,
							need
						}))
					)
					.returning()
			: [];

	return {
		...activity,
		location: (await db.select().from(locations).where(eq(locations.id, activity.locationId)))[0],
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

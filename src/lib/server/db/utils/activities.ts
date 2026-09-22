import type { BaseActivity, Activity, Event, EditableActivityServer } from '$lib/types';
import { eq, and } from 'drizzle-orm';
import { db } from '..';
import {
	activities,
	activityAdditionalInfos,
	activityAlertTimes,
	activityParticipantNeeds,
	eventsToLocations
} from '../schema';

export async function getActivities(eventId: Event['id']): Promise<Record<number, Activity>> {
	const activities = await db.query.activities.findMany({
		where: {
			eventId: eventId
		},
		with: {
			location: true,
			alertTimes: true,
			additionalInfos: true,
			participantNeeds: true
		}
	});

	return activities.reduce(
		(acc, activity) => {
			acc[activity.id] = activity as Activity;
			return acc;
		},
		{} as Record<number, Activity>
	);
}

export async function getActivity(eventId: Event['id'], activityId: Activity['id']) {
	const activity = await db.query.activities.findFirst({
		where: {
			id: activityId,
			eventId: eventId
		},
		with: {
			location: true,
			alertTimes: true,
			additionalInfos: true,
			participantNeeds: true
		}
	});
	if (!activity) return null;

	return activity as Activity;
}

export async function activityExists(
	eventId: Event['id'],
	activityId: Activity['id']
): Promise<boolean> {
	const activity = await db.query.activities.findFirst({
		where: {
			id: activityId,
			eventId: eventId
		}
	});
	return !!activity;
}

export async function deleteActivity(eventId: Event['id'], activityId: Activity['id']) {
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
		location: (await db.query.locations.findFirst({
			where: {
				id: activity.locationId
			}
		}))!,
		alertTimes,
		additionalInfos,
		participantNeeds
	};
}

export async function setActivityDelay(
	eventId: Event['id'],
	activityId: Activity['id'],
	delay: number | null
) {
	const result = await db
		.update(activities)
		.set({ delay })
		.where(and(eq(activities.id, activityId), eq(activities.eventId, eventId)));
	if (result.length === 0) {
		return null;
	}

	return getActivity(eventId, activityId);
}

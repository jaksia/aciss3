import * as v from 'valibot';
import { command, form, query } from '$app/server';

import * as dbUtils from '$lib/server/db/utils';
import {
	ActivityType,
	AdditionalInfo,
	ConfigurableSounds,
	ParticipantNeeds
} from '$lib/types/enums';
import { configurableSoundsData } from '$lib/sounds/configurable';
import { triggerActivitiesUpdate, triggerLocationsUpdate } from '$lib/server/socket';
import { saveSoundFiles } from '$lib/server/files/sounds';
import { audioFileSchema, createLocationSchema, getCreateEventSchema } from '$lib/schemas';
import { env } from '$env/dynamic/private';
import { verify } from '@node-rs/argon2';
import { ARGON2_CONFIG } from '$lib/server/session';
import { invalid, redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';

const eventIdValidator = v.pipeAsync(
	v.number(),
	v.checkAsync(async (id) => {
		return await dbUtils.eventExists(id);
	}, 'Event not found')
);
const locationIdValidator = v.pipeAsync(
	v.number(),
	v.checkAsync(async (id) => {
		return await dbUtils.locationExists(id);
	}, 'Location not found')
);
const activityIdValidator = v.forwardAsync(
	v.partialCheckAsync(
		[['eventId'], ['activityId']],
		async (data: { eventId: number; activityId: number }) => {
			return await dbUtils.activityExists(data.eventId, data.activityId);
		},
		'Activity not found'
	),
	['activityId']
);
const editableActivityValidator = v.objectAsync({
	type: v.enum(ActivityType),
	name: v.string(),
	startTime: v.date(),
	endTime: v.date(),
	locationId: locationIdValidator,
	delay: v.nullable(v.number()),
	zvolavanie: v.boolean(),
	alertTimes: v.array(v.number()),
	participantNeeds: v.array(v.enum(ParticipantNeeds)),
	additionalInfos: v.array(v.enum(AdditionalInfo))
});

export const setEventSound = command(
	v.pipeAsync(
		v.objectAsync({
			eventId: eventIdValidator,
			soundKey: v.enum(ConfigurableSounds),
			soundId: v.nullable(v.number())
		}),
		v.checkAsync(async (data) => {
			if (configurableSoundsData[data.soundKey].required && data.soundId === null) {
				return false;
			}
			if (data.soundId === null) return true;
			return await dbUtils.soundExists(data.soundId);
		}, 'Sound not found or required sound cannot be null')
	),
	async ({ eventId, soundKey, soundId }) => {
		await dbUtils.setEventSound(eventId, soundId, soundKey);

		return {
			event: await dbUtils.getEvent(eventId)
		};
	}
);

export const getAvailableSounds = query(
	v.undefinedable(v.enum(ConfigurableSounds)),
	async (soundKey) => {
		return await dbUtils.getAvailableSounds(soundKey);
	}
);

export const assignLocation = command(
	v.objectAsync({
		eventId: eventIdValidator,
		locationId: locationIdValidator
	}),
	async ({ eventId, locationId }) => {
		await dbUtils.assignLocationToEvent(eventId, locationId);

		triggerLocationsUpdate(eventId);

		return {
			eventLocations: await dbUtils.getEventLocations(eventId)
		};
	}
);

export const detachLocation = command(
	v.objectAsync({
		eventId: eventIdValidator,
		locationId: locationIdValidator
	}),
	async ({ eventId, locationId }) => {
		await dbUtils.removeLocationFromEvent(eventId, locationId);

		triggerLocationsUpdate(eventId);

		return {
			eventLocations: await dbUtils.getEventLocations(eventId)
		};
	}
);

export const getAvailableLocations = query(
	// checking whether event exists not necessary here, as non-existing event will exclude no locations
	v.undefinedable(v.number()),
	async (excludeEvent) => {
		return await dbUtils.getAvailableLocations(excludeEvent);
	}
);

export const createActivity = command(
	v.objectAsync({
		eventId: eventIdValidator,
		activity: editableActivityValidator
	}),
	async ({ eventId, activity }) => {
		const newActivity = await dbUtils.createOrUpdateActivity(eventId, activity);
		if (newActivity) triggerActivitiesUpdate(eventId, newActivity.id);
		return newActivity;
	}
);

export const editActivity = command(
	v.pipeAsync(
		v.objectAsync({
			eventId: eventIdValidator,
			activityId: v.number(),
			activity: editableActivityValidator
		}),
		v.forwardAsync(
			v.partialCheckAsync(
				[['eventId'], ['activityId']],
				async (data: { eventId: number; activityId: number }) => {
					return await dbUtils.activityExists(data.eventId, data.activityId);
				},
				'Activity not found'
			),
			['activityId']
		)
	),
	async ({ eventId, activityId, activity }) => {
		const updatedActivity = await dbUtils.createOrUpdateActivity(eventId, activity, activityId);
		if (updatedActivity) triggerActivitiesUpdate(eventId, activityId);
		return updatedActivity;
	}
);

export const deleteActivity = command(
	v.pipeAsync(
		v.objectAsync({
			eventId: eventIdValidator,
			activityId: v.number()
		}),
		v.forwardAsync(
			v.partialCheckAsync(
				[['eventId'], ['activityId']],
				async (data: { eventId: number; activityId: number }) => {
					return await dbUtils.activityExists(data.eventId, data.activityId);
				},
				'Activity not found'
			),
			['activityId']
		)
	),
	async ({ eventId, activityId }) => {
		await dbUtils.deleteActivity(eventId, activityId);
		triggerActivitiesUpdate(eventId, activityId);
	}
);

export const setActivityDelay = command(
	v.pipeAsync(
		v.objectAsync({
			eventId: eventIdValidator,
			activityId: v.number(),
			delay: v.nullable(v.pipe(v.number(), v.minValue(0)))
		}),
		v.forwardAsync(
			v.partialCheckAsync(
				[['eventId'], ['activityId']],
				async (data: { eventId: number; activityId: number }) => {
					return await dbUtils.activityExists(data.eventId, data.activityId);
				},
				'Activity not found'
			),
			['activityId']
		)
	),
	async ({ eventId, activityId, delay }) => {
		const activity = await dbUtils.setActivityDelay(eventId, activityId, delay);
		if (activity) triggerActivitiesUpdate(eventId, activityId);
		return activity;
	}
);

// TODO: finish
export const createSound = form(
	v.objectAsync({
		eventId: eventIdValidator,
		soundKey: v.enum(ConfigurableSounds),

		description: v.string(),
		file: audioFileSchema
	}),
	async (data) => {
		const { upload } = await saveSoundFiles({ upload: data.file });
		if (!upload.success) {
			throw new Error('Failed to save sound file', { cause: upload.error });
		}
		const sound = await dbUtils.createCustomSound(
			upload.path,
			data.soundKey,
			data.description,
			data.eventId
		);
		return {
			sound,
			event: await dbUtils.getEvent(data.eventId)
		};
	}
);

export const createEvent = form(
	v.pipe(getCreateEventSchema(!!env.ROOT_ADMIN_PASSWORD_HASH)),
	async (data, issue) => {
		if (env.ROOT_ADMIN_PASSWORD_HASH) {
			if (!(await verify(env.ROOT_ADMIN_PASSWORD_HASH, data._rootPassword || '', ARGON2_CONFIG))) {
				await new Promise((r) => setTimeout(r, 500));
				invalid(issue._rootPassword('Incorrect root password'));
			}
		}

		const eventId = await dbUtils.createEvent({
			...data,
			startDate: data.startDate.toDateString(),
			endDate: data.endDate.toDateString(),
			adminPasswordHash: null
		});

		redirect(303, resolve('/[eventId]/admin/event', { eventId: eventId.toString() }));
	}
);

export const createLocation = form(createLocationSchema, async (data, issue) => {
	if (data.assignToEvent) {
		if (!(await dbUtils.eventExists(data.assignToEvent))) {
			invalid(issue.assignToEvent('Event to assign does not exist'));
		}
	}

	const { upload } = await saveSoundFiles({ upload: data.file });
	if (!upload.success) {
		invalid(issue.file('File upload failed: ' + upload.error));
	}

	const location = await dbUtils.createLocation(
		{
			name: data.name,
			content: data.content,
			path: upload.path
		},
		data.assignToEvent
	);

	return {
		location,
		eventLocations: data.assignToEvent
			? await dbUtils.getEventLocations(data.assignToEvent)
			: undefined
	};
});

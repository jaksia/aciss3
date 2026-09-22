import { isNull, lt, or, sql } from 'drizzle-orm';
import { EventStyle } from '$lib/themes';

import {
	ActivityType,
	AdditionalInfo,
	ConfigurableSounds,
	ParticipantNeeds
} from '$lib/types/enums';

import { snakeCase } from 'drizzle-orm/pg-core';
import * as t from 'drizzle-orm/pg-core';

// ------------------------------
//             EVENTS
// ------------------------------
export const configurableSoundsEnum = t.pgEnum('ConfigurableSounds', ConfigurableSounds);
export const eventStylesEnum = t.pgEnum('EventStyles', EventStyle);

export const customSounds = snakeCase.table('custom_sounds', {
	id: t.serial().primaryKey(),
	key: configurableSoundsEnum().notNull(),
	description: t.char({ length: 64 }),
	path: t.text().notNull(),
	default: t.boolean().notNull().default(false)
});

export const events = snakeCase.table('events', {
	id: t.serial().primaryKey(),
	style: eventStylesEnum().notNull().default(EventStyle.DEFAULT),
	name: t.text().notNull(),
	startDate: t.date().notNull(),
	endDate: t.date().notNull(),
	location: t.text(),
	adminPasswordHash: t.text()
});

export const eventsToSounds = snakeCase.table(
	'events_to_sounds',
	{
		eventId: t
			.integer()
			.notNull()
			.references(() => events.id, { onDelete: 'cascade' }),
		customSoundId: t
			.integer()
			.notNull()
			.references(() => customSounds.id, { onDelete: 'cascade' }),
		soundKey: configurableSoundsEnum('sound_key').notNull()
	},
	(table) => [
		t.primaryKey({
			columns: [table.eventId, table.customSoundId]
		}),
		t.unique('one_sound_key_per_event').on(table.eventId, table.soundKey)
	]
);

// ------------------------------
//           LOCATIONS
// ------------------------------
export const locations = snakeCase.table('locations', {
	id: t.serial().primaryKey(),

	name: t.text().notNull(),
	content: t.text().notNull(),
	path: t.text().notNull(),

	isStatic: t.boolean().notNull().default(false)
});

export const eventsToLocations = snakeCase.table(
	'events_to_locations',
	{
		eventId: t
			.integer()
			.notNull()
			.references(() => events.id, { onDelete: 'cascade' }),
		locationId: t
			.integer()
			.notNull()
			.references(() => locations.id, { onDelete: 'cascade' })
	},
	(table) => [
		t.primaryKey({
			columns: [table.eventId, table.locationId]
		})
	]
);

// ------------------------------
//           ACTIVITIES
// ------------------------------
export const activityTypeEnum = t.pgEnum('ActivityType', ActivityType);
export const participantNeedsEnum = t.pgEnum('ParticipantNeeds', ParticipantNeeds);
export const additionalInfoEnum = t.pgEnum('AdditionalInfo', AdditionalInfo);

export const activities = snakeCase.table(
	'activities',
	{
		id: t.serial().primaryKey(),
		eventId: t
			.integer()
			.notNull()
			.references(() => events.id, { onDelete: 'cascade' }),
		name: t.text().notNull(),
		startTime: t.timestamp().notNull(),
		endTime: t.timestamp().notNull(),
		zvolavanie: t.boolean().notNull().default(true),
		delay: t.integer(),
		type: activityTypeEnum().notNull(),
		locationId: t
			.integer()
			.notNull()
			.references(() => locations.id, { onDelete: 'restrict' })
	},
	(schema) => [
		t.check('start_before_end', lt(schema.startTime, schema.endTime)),
		t.check('positive_or_null_delay', or(isNull(schema.delay), sql`${schema.delay} > 0`)!)
	]
);

export const activityAlertTimes = snakeCase.table(
	'activity_alert_times',
	{
		activityId: t
			.integer()
			.notNull()
			.references(() => activities.id, { onDelete: 'cascade' }),
		minutes: t.integer().notNull()
	},
	(table) => [t.primaryKey({ columns: [table.activityId, table.minutes] })]
);

export const activityParticipantNeeds = snakeCase.table(
	'activity_participant_needs',
	{
		activityId: t
			.integer()
			.notNull()
			.references(() => activities.id, { onDelete: 'cascade' }),
		need: participantNeedsEnum('need').notNull()
	},
	(table) => [t.primaryKey({ columns: [table.activityId, table.need] })]
);

export const activityAdditionalInfos = snakeCase.table(
	'activity_additional_infos',
	{
		activityId: t
			.integer()
			.notNull()
			.references(() => activities.id, { onDelete: 'cascade' }),
		info: additionalInfoEnum('info').notNull()
	},
	(table) => [t.primaryKey({ columns: [table.activityId, table.info] })]
);

export const session = snakeCase.table('session', {
	id: t.varchar({ length: 64 }).primaryKey(),
	expiresAt: t.timestamp({ mode: 'date' }).notNull(),
	socketCodeHash: t.varchar({ length: 64 }).notNull()
});

export const sessionAllowedEvents = snakeCase.table(
	'session_allowed_events',
	{
		sessionId: t
			.text()
			.notNull()
			.references(() => session.id, { onDelete: 'cascade' }),
		eventId: t
			.integer()
			.notNull()
			.references(() => events.id, { onDelete: 'cascade' })
	},
	(table) => [t.primaryKey({ columns: [table.sessionId, table.eventId] })]
);

import { isNull, lt, or, relations, sql } from 'drizzle-orm';
import { EventStyle } from '../../themes';

import {
	ActivityType,
	AdditionalInfo,
	APIKeyActionType,
	ConfigurableSounds,
	ParticipantNeeds
} from '../../types/enums';

import { pgTable } from 'drizzle-orm/pg-core';
import * as t from 'drizzle-orm/pg-core';

// ------------------------------
//             EVENTS
// ------------------------------
export const configurableSoundsEnum = t.pgEnum('ConfigurableSounds', ConfigurableSounds);
export const eventStylesEnum = t.pgEnum('EventStyles', EventStyle);

export const customSounds = pgTable('custom_sounds', {
	id: t.uuid('id').primaryKey().notNull().defaultRandom(),
	key: configurableSoundsEnum('key').notNull(),
	description: t.char('description', { length: 64 }),
	path: t.text('path').notNull(),

	flags: t.integer('flags').notNull().default(0)
});

export const events = pgTable('events', {
	id: t.serial('id').primaryKey(),
	style: eventStylesEnum('style').notNull().default(EventStyle.DEFAULT),
	name: t.text('name').notNull(),
	startDate: t.date('start_date').notNull(),
	endDate: t.date('end_date').notNull(),
	location: t.text('location'),
	adminPasswordHash: t.text('admin_password_hash')
});

export const eventsRelations = relations(events, ({ many }) => ({
	eventsToSounds: many(eventsToSounds)
}));

export const eventsToSounds = pgTable(
	'events_to_sounds',
	{
		eventId: t
			.integer('event_id')
			.notNull()
			.references(() => events.id, { onDelete: 'cascade' }),
		customSoundId: t
			.uuid('custom_sound_id')
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

export const eventsToSoundsRelations = relations(eventsToSounds, ({ one }) => ({
	event: one(events, {
		fields: [eventsToSounds.eventId],
		references: [events.id]
	}),
	customSound: one(customSounds, {
		fields: [eventsToSounds.customSoundId],
		references: [customSounds.id]
	})
}));

// ------------------------------
//           LOCATIONS
// ------------------------------

export const locations = pgTable('locations', {
	id: t.uuid('id').primaryKey().notNull().defaultRandom(),

	name: t.text('name').notNull(),
	content: t.text('content').notNull(),
	path: t.text('path').notNull(),

	flags: t.integer('flags').notNull().default(0)
});

export const locationsRelations = relations(locations, ({ many }) => ({
	eventsToLocations: many(eventsToLocations)
}));

export const eventsToLocations = pgTable(
	'events_to_locations',
	{
		eventId: t
			.integer('event_id')
			.notNull()
			.references(() => events.id, { onDelete: 'cascade' }),
		locationId: t
			.uuid('location_id')
			.notNull()
			.references(() => locations.id, { onDelete: 'cascade' })
	},
	(table) => [
		t.primaryKey({
			columns: [table.eventId, table.locationId]
		})
	]
);

export const eventsToLocationsRelations = relations(eventsToLocations, ({ one }) => ({
	event: one(events, {
		fields: [eventsToLocations.eventId],
		references: [events.id]
	}),
	location: one(locations, {
		fields: [eventsToLocations.locationId],
		references: [locations.id]
	})
}));

// ------------------------------
//           ACTIVITIES
// ------------------------------
export const activityTypeEnum = t.pgEnum('ActivityType', ActivityType);
export const participantNeedsEnum = t.pgEnum('ParticipantNeeds', ParticipantNeeds);
export const additionalInfoEnum = t.pgEnum('AdditionalInfo', AdditionalInfo);

export const activities = pgTable(
	'activities',
	{
		id: t.serial('id').primaryKey(),
		eventId: t
			.integer('event_id')
			.notNull()
			.references(() => events.id, { onDelete: 'cascade' }),
		name: t.text('name').notNull(),
		startTime: t.timestamp('start_time').notNull(),
		endTime: t.timestamp('end_time').notNull(),
		zvolavanie: t.boolean('zvolavanie').notNull().default(true),
		delay: t.integer('delay'),
		type: activityTypeEnum('type').notNull(),
		locationId: t
			.uuid('location_id')
			.notNull()
			.references(() => locations.id, { onDelete: 'restrict' })
	},
	(schema) => [
		t.check('start_before_end', lt(schema.startTime, schema.endTime)),
		t.check('positive_or_null_delay', or(isNull(schema.delay), sql`${schema.delay} > 0`)!)
	]
);

export const activitiesRelations = relations(activities, ({ many, one }) => ({
	event: one(events, {
		fields: [activities.eventId],
		references: [events.id]
	}),
	location: one(locations, {
		fields: [activities.locationId],
		references: [locations.id]
	}),
	alertTimes: many(activityAlertTimes),
	participantNeeds: many(activityParticipantNeeds),
	additionalInfos: many(activityAdditionalInfos)
}));

export const activityAlertTimes = pgTable(
	'activity_alert_times',
	{
		activityId: t
			.integer('activity_id')
			.notNull()
			.references(() => activities.id, { onDelete: 'cascade' }),
		minutes: t.integer('minutes').notNull()
	},
	(table) => [t.primaryKey({ columns: [table.activityId, table.minutes] })]
);

export const activityParticipantNeeds = pgTable(
	'activity_participant_needs',
	{
		activityId: t
			.integer('activity_id')
			.notNull()
			.references(() => activities.id, { onDelete: 'cascade' }),
		need: participantNeedsEnum('need').notNull()
	},
	(table) => [t.primaryKey({ columns: [table.activityId, table.need] })]
);

export const activityAdditionalInfos = pgTable(
	'activity_additional_infos',
	{
		activityId: t
			.integer('activity_id')
			.notNull()
			.references(() => activities.id, { onDelete: 'cascade' }),
		info: additionalInfoEnum('info').notNull()
	},
	(table) => [t.primaryKey({ columns: [table.activityId, table.info] })]
);

export const session = pgTable('session', {
	id: t.varchar('id', { length: 64 }).primaryKey(),
	expiresAt: t.timestamp('expires_at', { mode: 'date' }).notNull(),
	socketCodeHash: t.varchar('socket_code_hash', { length: 64 }).notNull()
});

export const sessionAllowedEvents = pgTable(
	'session_allowed_events',
	{
		sessionId: t
			.text('session_id')
			.notNull()
			.references(() => session.id, { onDelete: 'cascade' }),
		eventId: t
			.integer('event_id')
			.notNull()
			.references(() => events.id, { onDelete: 'cascade' }),
		expiresAt: t.timestamp('expires_at', { mode: 'date' }).notNull()
	},
	(table) => [t.primaryKey({ columns: [table.sessionId, table.eventId] })]
);

// ------------------------------
//    API FOR GLOBAL SERVER
// ------------------------------

export const apiKeys = pgTable('api_keys', {
	id: t.uuid('id').primaryKey().notNull().defaultRandom(),
	key: t.varchar('key', { length: 64 }).notNull(),
	description: t.text('description'),
	createdAt: t.timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),

	readAccess: t.boolean('read_access').notNull().default(false),
	writeAccess: t.boolean('write_access').notNull().default(false),

	revoked: t.boolean('revoked').notNull().default(false)
});

export const apiKeyActionTypesEnum = t.pgEnum('ApiKeyActionTypes', APIKeyActionType);

export const apiKeyActions = pgTable(
	'api_key_actions',
	{
		id: t.serial('id').primaryKey(),
		apiKeyId: t
			.uuid('api_key_id')
			.notNull()
			.references(() => apiKeys.id, { onDelete: 'cascade' }),

		type: apiKeyActionTypesEnum('type').notNull(),
		ipAddress: t.inet('ip_address').notNull(),

		soundId: t.uuid('sound_id').references(() => customSounds.id, { onDelete: 'set null' }),
		locationId: t.uuid('location_id').references(() => locations.id, { onDelete: 'set null' }),

		timestamp: t.timestamp('timestamp', { mode: 'date' }).notNull().defaultNow()
	},
	(table) => [
		t.check(
			'exactly_one_object',
			sql`
        (CASE WHEN ${table.soundId} IS NULL THEN 0 ELSE 1 END +
         CASE WHEN ${table.locationId} IS NULL THEN 0 ELSE 1 END) = 1
    `
		)
	]
);

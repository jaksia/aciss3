import { relations } from 'drizzle-orm';
import { EventStyle } from '../../themes';

import {
	ActivityLocation,
	ActivityType,
	AdditionalInfo,
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
	id: t.serial('id').primaryKey(),
	key: configurableSoundsEnum('key').notNull(),
	description: t.char('description', { length: 64 }),
	path: t.text('path').notNull(),
	default: t.boolean('default').notNull().default(false)
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
			.integer('custom_sound_id')
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
//           ACTIVITIES
// ------------------------------
export const activityTypeEnum = t.pgEnum('ActivityType', ActivityType);
export const activityLocationEnum = t.pgEnum('ActivityLocation', ActivityLocation);
export const participantNeedsEnum = t.pgEnum('ParticipantNeeds', ParticipantNeeds);
export const additionalInfoEnum = t.pgEnum('AdditionalInfo', AdditionalInfo);

export const activities = pgTable('activities', {
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
	location: activityLocationEnum('location').notNull()
});

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
	id: t.text('id').primaryKey(),
	expiresAt: t.timestamp('expires_at', { mode: 'date' }).notNull()
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

import { defineRelations } from 'drizzle-orm';
import * as schema from './schema';

export const relations = defineRelations(schema, (r) => ({
	events: {
		locationsViaActivities: r.many.locations({
			from: r.events.id.through(r.activities.eventId),
			to: r.locations.id.through(r.activities.locationId),
			alias: 'events_id_locations_id_via_activities'
		}),
		locationsViaEventsToLocations: r.many.locations({
			from: r.events.id.through(r.eventsToLocations.eventId),
			to: r.locations.id.through(r.eventsToLocations.locationId),
			alias: 'events_id_locations_id_via_eventsToLocations'
		}),
		sounds: r.many.customSounds(),
		sessions: r.many.session({
			from: r.events.id.through(r.sessionAllowedEvents.eventId),
			to: r.session.id.through(r.sessionAllowedEvents.sessionId)
		})
	},
	locations: {
		eventsViaActivities: r.many.events({
			alias: 'events_id_locations_id_via_activities'
		}),
		eventsViaEventsToLocations: r.many.events({
			alias: 'events_id_locations_id_via_eventsToLocations'
		})
	},
	activityAdditionalInfos: {
		activity: r.one.activities({
			from: r.activityAdditionalInfos.activityId,
			to: r.activities.id
		})
	},
	activities: {
		location: r.one.locations({
			from: r.activities.locationId,
			to: r.locations.id
		}),
		additionalInfos: r.many.activityAdditionalInfos(),
		alertTimes: r.many.activityAlertTimes(),
		participantNeeds: r.many.activityParticipantNeeds()
	},
	activityAlertTimes: {
		activity: r.one.activities({
			from: r.activityAlertTimes.activityId,
			to: r.activities.id
		})
	},
	activityParticipantNeeds: {
		activity: r.one.activities({
			from: r.activityParticipantNeeds.activityId,
			to: r.activities.id
		})
	},
	customSounds: {
		events: r.many.events({
			from: r.customSounds.id.through(r.eventsToSounds.customSoundId),
			to: r.events.id.through(r.eventsToSounds.eventId)
		})
	},
	session: {
		allowedEvents: r.many.events()
	}
}));

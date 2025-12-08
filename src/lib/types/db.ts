import type * as schema from '$lib/server/db/schema';

export type BaseEvent = typeof schema.events.$inferSelect;
export type Event = Omit<BaseEvent, 'startDate' | 'endDate'> & {
	startDate: Date;
	endDate: Date;
	sounds: Record<CustomSound['key'], CustomSound>;
};
export type CustomSound = typeof schema.customSounds.$inferSelect;

export type BaseActivity = typeof schema.activities.$inferSelect;
export type Activity = BaseActivity & {
	alertTimes: ActivityAlertTime[];
	participantNeeds: ActivityParticipantNeed[];
	additionalInfos: ActivityAdditionalInfo[];
};
export type ActivityAlertTime = typeof schema.activityAlertTimes.$inferSelect;
export type ActivityParticipantNeed = typeof schema.activityParticipantNeeds.$inferSelect;
export type ActivityAdditionalInfo = typeof schema.activityAdditionalInfos.$inferSelect;

export type EditableEvent = Omit<BaseEvent, 'id' | 'startDate' | 'endDate'> & {
	startDate: number;
	endDate: number;
};

export type EditableActivity = Omit<
	BaseActivity,
	'id' | 'eventId' | 'alertTimes' | 'participantNeeds' | 'additionalInfos'
> & {
	day: number;

	alertTimes: ActivityAlertTime['minutes'][];
	participantNeeds: ActivityParticipantNeed['need'][];
	additionalInfos: ActivityAdditionalInfo['info'][];
};

export type EditableActivityServer = Omit<
	EditableActivity,
	'day' | 'startTimeMinutes' | 'endTimeMinutes'
> & {
	startTime: number;
	endTime: number;
};

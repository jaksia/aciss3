import type { Activity, Event } from './db';
import type { AllSoundTypes } from './sounds';

export type EventUpdateNotification = {
	eventId: number;
	event: Event;
};

export type ActivityUpdateNotification = {
	eventId: number;
	activityId: number;
	activity: Activity;
};

export type ActivityDeleteNotification = {
	eventId: number;
	activityId: number;
};

export type ActivityListUpdateNotification = {
	eventId: number;
	activities: Record<Activity['id'], Activity>;
};

export type StopPlaying = {
	type: 'stopPlaying';
};

export type DelayAnnouncement = {
	type: 'delayAnnouncement';
	delayMinutes: number;
};

export type CustomSound = {
	type: 'customSound';
	sounds: AllSoundTypes[];
};

export type PlayerControl = StopPlaying | DelayAnnouncement | CustomSound;

export interface ServerToClientEvents {
	eventUpdate: (data: EventUpdateNotification) => void;
	activityUpdate: (data: ActivityUpdateNotification) => void;
	activityDelete: (data: ActivityDeleteNotification) => void;
	activityListUpdate: (data: ActivityListUpdateNotification) => void;

	playerControl: (data: PlayerControl) => void;
}

export type JoinEventResponse =
	| {
			success: false;
			error: string;
	  }
	| {
			success: true;
			event: Event;
			activities: Record<Activity['id'], Activity>;
	  };

export interface ClientToServerEvents {
	checkActiveEvent: (callback: (activeEventId: Event['id']) => void) => void;
	joinEvent: (eventId: Event['id'], callback: (response: JoinEventResponse) => void) => void;
	leaveEvent: (eventId: Event['id'], callback: () => void) => void;

	playerControl: (
		data: PlayerControl,
		code: string,
		callback: (result: { success: boolean; error?: string }) => void
	) => void;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface InterServerEvents {}

export interface SocketData {
	activeEventId: Event['id'] | null;
}

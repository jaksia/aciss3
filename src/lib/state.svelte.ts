import { browser } from '$app/environment';
import { io, type Socket } from 'socket.io-client';
import type { Activity, ActivityLocation, Event } from '$lib/types/db';
import type {
	ClientToServerEvents,
	PlayerControl,
	ServerToClientEvents
} from '$lib/types/realtime';
import type { SoundProcessor } from '$lib/sounds/processor.svelte';
import { builder } from '$lib/sounds/builder';
import { ConfigurableSounds } from '$lib/types/enums';
import { SvelteDate, SvelteMap } from 'svelte/reactivity';
import { env } from '$env/dynamic/public';
import type { AddAlert } from './types/other';
import { logFunctions } from './utils';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeHexLowerCase } from '@oslojs/encoding';

export const socketCodeCookieName = 'socket-code';

const socketIOHost = env.PUBLIC_SOCKETIO_HOST;

const log = logFunctions('EventState');

export class EventState {
	public now = $state(new SvelteDate());

	public event: Event;
	public activities = new SvelteMap<Activity['id'], Activity>();
	public locations = new SvelteMap<ActivityLocation['id'], ActivityLocation>();
	public activityList: Activity[] = $derived(Array.from(this.activities.values()));
	public socketActive: boolean;

	private soundProcessor: SoundProcessor | null = null;
	private addAlert: AddAlert | null = null;

	private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
	private initializing: Promise<void> | null = null;
	private socketConnected = $state(false);

	private listeningEventId: Event['id'] | null = $state(null);

	constructor(
		event: Event,
		activities: Record<Activity['id'], Activity>,
		locations: Record<ActivityLocation['id'], ActivityLocation>
	) {
		this.event = $state(this.parseJSONEvent(event));
		Object.values(activities).forEach((a) => {
			const activity = this.parseJSONActivity(a);
			this.activities.set(activity.id, activity);
		});
		Object.values(locations).forEach((loc) => {
			this.locations.set(loc.id, loc);
		});

		if (browser) {
			this.connectSocketIO();
		}

		$effect(() => {
			if (!browser || !this.socket) return;
			if (this.listeningEventId !== this.event.id) {
				log.debug('Event ID changed, connecting to event:', this.event.id);
				this.connectToEvent(this.event.id);
			}
		});

		$effect(() => {
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			this.activityList;
			if (!this.soundProcessor) return;

			log.debug('Activities changed, updating sound processor schedule');

			this.soundProcessor!.clearSchedule();
			this.activityList.forEach((a) => this.soundProcessor!.compileAndScheduleActivity(a));
		});

		this.socketActive = $derived(this.socketConnected && this.listeningEventId === this.event.id);

		setInterval(() => {
			this.now = new SvelteDate();
		}, 20);

		if (import.meta.hot) {
			import.meta.hot.on('vite:beforeUpdate', () => {
				log.info('HMR update detected, disconnecting Socket.IO, detaching sound processor');
				this.socket?.disconnect();
				this.socket = null;
				this.soundProcessor = null;
				this.listeningEventId = null;
				this.socketConnected = false;
			});
		}
	}

	private async connectSocketIO() {
		if (!browser) throw new Error('Socket.IO can only be initialized in the browser');
		if (this.socket) return;
		if (this.initializing) return this.initializing;

		let resolve;
		this.initializing = new Promise((res) => (resolve = res));

		const cookieLine = document.cookie
			.split('; ')
			.find((row) => row.startsWith(`${socketCodeCookieName}=`));
		const rawSocketCode = cookieLine ? cookieLine.split('=')[1] : null;

		this.socket = io(socketIOHost, {
			auth: {
				socketCode: rawSocketCode
					? encodeHexLowerCase(sha256(new TextEncoder().encode(rawSocketCode)))
					: null
			}
		});

		this.socket.on('connect', () => {
			log.debug('Socket.IO connected:', this.socket?.id);
			this.connectToEvent(this.event.id);
			this.socketConnected = true;
		});

		this.socket.onAny((event, ...args) => {
			log.debug(`Socket.IO event: ${event}`, ...args);
		});

		this.socket.on('disconnect', () => {
			log.debug('Socket.IO disconnected');
			this.socketConnected = false;
		});

		this.socket.on('eventUpdate', (update) => {
			if (update.eventId !== this.event.id) {
				this.connectToEvent(this.event.id);
				return;
			}
			this.event = this.parseJSONEvent(update.event);
		});

		this.socket.on('activityUpdate', (update) => {
			if (update.eventId !== this.event.id) {
				this.connectToEvent(this.event.id);
				return;
			}
			const newActivity = this.parseJSONActivity(update.activity);
			this.activities.set(newActivity.id, newActivity);
		});

		this.socket.on('activityDelete', (update) => {
			if (update.eventId !== this.event.id) {
				this.connectToEvent(this.event.id);
				return;
			}
			this.activities.delete(update.activityId);
		});

		this.socket.on('activityListUpdate', (update) => {
			if (update.eventId !== this.event.id) {
				this.connectToEvent(this.event.id);
				return;
			}
			this.activities.clear();
			Object.values(update.activities).forEach((a) => {
				const activity = this.parseJSONActivity(a);
				this.activities.set(activity.id, activity);
			});
		});

		if (this.soundProcessor) {
			this.attachSoundEvents();
		}

		resolve!();
		this.initializing = null;
	}

	private async connectToEvent(eventId: Event['id']) {
		if (!this.socket) return;
		if (this.listeningEventId === eventId) return;

		// even if the event didnt change, we can assume we got disconnected
		// we are probably still listening to the same event, but this makes sure
		// that our data is up to date

		const response = await this.socket.emitWithAck('joinEvent', eventId);
		if (!response.success) {
			log.error('Failed to join event:', response.error);
			return;
		}
		this.event = this.parseJSONEvent(response.event);
		this.activities.clear();
		Object.values(response.activities).forEach((a) => {
			const activity = this.parseJSONActivity(a);
			this.activities.set(activity.id, activity);
		});
		log.debug('Connected to event:', eventId);
		this.listeningEventId = eventId;
	}

	private parseJSONEvent(data: Event): Event {
		return {
			...data,
			startDate: new SvelteDate(data.startDate),
			endDate: new SvelteDate(data.endDate)
		};
	}

	private parseJSONActivity(data: Activity): Activity {
		return {
			...data,
			startTime: new SvelteDate(data.startTime),
			endTime: new SvelteDate(data.endTime)
		};
	}

	public attachSoundProcessor(processor: SoundProcessor) {
		this.soundProcessor = processor;

		this.attachSoundEvents();
	}

	private attachSoundEvents() {
		if (!this.socket || !this.soundProcessor) {
			log.debug('Cannot attach sound events: Socket.IO or SoundProcessor not initialized');
			return;
		}

		log.debug('Attaching sound events to socket');

		this.socket.on('playerControl', (data) => {
			switch (data.type) {
				case 'stopPlaying':
					this.soundProcessor?.stopAndClear();
					break;
				case 'delayAnnouncement':
					this.soundProcessor?.playSounds(
						'',
						builder()
							.sound(ConfigurableSounds.DELAY_START)
							.time(data.delayMinutes)
							.sound(ConfigurableSounds.DELAY_END)
					);
					break;
				case 'customSound':
					this.soundProcessor?.playSounds('', builder().sound(...data.sounds));
					break;
			}
		});

		this.activities.forEach((a) => this.soundProcessor!.compileAndScheduleActivity(a));
	}

	public async playerControl(data: PlayerControl) {
		if (!this.socket) {
			this.addAlert?.({
				type: 'error',
				content: 'Nie je možné použiť okamžité hlásenie.<br>Nie je pripojený Socket.IO.'
			});
			return { success: false, error: 'Socket.IO not connected' };
		}

		const result = await this.socket.emitWithAck('playerControl', data);
		if (!result.success) {
			this.addAlert?.({
				type: 'error',
				content: `Nepodarilo sa odoslať okamžité hlásenie.<br>${result.error}`
			});
		}
		// success message is handled by the caller
		return result;
	}

	public setAddAlert(addAlert: AddAlert) {
		this.addAlert = addAlert;
	}

	public setEvent(eventData: Event) {
		this.event = this.parseJSONEvent(eventData);
	}

	public setActivity(id: number, activityData: Activity | null) {
		if (activityData == null) {
			this.activities.delete(id);
		} else {
			const activity = this.parseJSONActivity(activityData);
			this.activities.set(activity.id, activity);
		}
	}
}

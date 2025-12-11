import { browser } from '$app/environment';
import { io, type Socket } from 'socket.io-client';
import type { Activity, Event } from '$lib/types/db';
import type {
	ClientToServerEvents,
	PlayerControl,
	ServerToClientEvents
} from '$lib/types/realtime';
import type { SoundProcessor } from '$lib/sounds/processor.svelte';
import { builder } from '$lib/sounds/builder';
import { ConfigurableSounds } from '$lib/types/enums';
import { SvelteDate } from 'svelte/reactivity';
import { env } from '$env/dynamic/public';
import type { AddAlert } from './types/other';

const socketIOHost = env.PUBLIC_SOCKETIO_HOST;

export class EventState {
	public now = $state(new SvelteDate());

	public event: Event;
	public activities: Activity[];
	public socketActive: boolean;

	private soundProcessor: SoundProcessor | null = null;
	private addAlert: AddAlert | null = null;

	constructor(event: Event, activities: Activity[]) {
		this.event = $state(this.parseJSONEvent(event));
		this.activities = $state(activities.map(this.parseJSONActivity));

		if (browser) {
			this.connectSocketIO();
		}

		$effect(() => {
			if (!browser || !this.socket) return;
			if (this.listeningEventId !== this.event.id) {
				this.connectToEvent(this.event.id);
			}
		});

		$effect(() => {
			if (!this.socket || !this.soundProcessor) return;

			this.soundProcessor.clearSchedule();
			this.activities.forEach((a) => this.soundProcessor!.compileAndScheduleActivity(a));
		});

		this.socketActive = $derived(this.socketConnected && this.listeningEventId === this.event.id);
	}

	private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
	private socketConnected = $state(false);

	private firstConnect = true;
	private playerControlCode: string | null = null;

	private listeningEventId: Event['id'] | null = $state(null);
	private initializing: Promise<void> | null = null;

	private async connectSocketIO() {
		if (!browser) throw new Error('Socket.IO can only be initialized in the browser');
		if (this.socket) return;
		if (this.initializing) return this.initializing;

		let resolve;
		this.initializing = new Promise((res) => (resolve = res));

		this.socket = io(socketIOHost);

		this.socket.on('connect', () => {
			console.log('Socket.IO connected:', this.socket?.id);
			this.connectToEvent(this.event.id, this.firstConnect);
			this.firstConnect = false;
			this.socketConnected = true;
		});

		this.socket.onAny((event, ...args) => {
			console.debug(`Socket.IO event: ${event}`, ...args);
		});

		this.socket.on('disconnect', () => {
			console.log('Socket.IO disconnected');
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
			const index = this.activities.findIndex((a) => a.id === update.activityId);
			if (index !== -1) {
				this.activities[index] = newActivity;
			} else {
				this.activities.push(newActivity);
			}
		});

		this.socket.on('activityDelete', (update) => {
			if (update.eventId !== this.event.id) {
				this.connectToEvent(this.event.id);
				return;
			}
			this.activities = this.activities.filter((a) => a.id !== update.activityId);
		});

		this.socket.on('activityListUpdate', (update) => {
			if (update.eventId !== this.event.id) {
				this.connectToEvent(this.event.id);
				return;
			}
			this.activities = update.activities.map(this.parseJSONActivity);
		});

		if (this.soundProcessor) {
			this.attachSoundEvents();
		}

		resolve!();
		this.initializing = null;
	}

	private async connectToEvent(eventId: Event['id'], skipCheck = false) {
		if (!this.socket) return;
		if (this.listeningEventId === eventId) return;

		if (!skipCheck) {
			const activeEventId = await this.socket.emitWithAck('checkActiveEvent');
			if (activeEventId === eventId) {
				console.log('Already connected to event:', eventId);
				this.listeningEventId = eventId;
				return;
			}
		}

		const response = await this.socket.emitWithAck('joinEvent', eventId);
		if (!response.success) {
			console.error('Failed to join event:', response.error);
			return;
		}
		this.event = this.parseJSONEvent(response.event);
		this.activities = response.activities.map(this.parseJSONActivity);
		console.log('Connected to event:', eventId);
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
		console.log('Attaching sound processor events');
		if (!this.socket || !this.soundProcessor) return;

		console.log('Attaching sound events to socket');

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
		// TODO: implement at some point
		// if (!this.playerControlCode) {
		// 	this.addAlert?.({
		// 		type: 'error',
		// 		content: 'Nie je možné použiť okamžité hlásenie.<br>Server neumožnil ovládanie prehrávača.'
		// 	});
		// 	return { success: false, error: 'Player control not allowed' };
		// }

		const result = await this.socket.emitWithAck(
			'playerControl',
			data,
			this.playerControlCode ?? 'not-implemented'
		);
		if (!result.success) {
			this.addAlert?.({
				type: 'error',
				content: `Nepodarilo sa odoslať okamžité hlásenie.<br>${result.error}`
			});
		}
		// success message is handled by the caller
		return result;
	}

	public setPlayerControlCode(code: string | null) {
		this.playerControlCode = code;
	}

	public setAddAlert(addAlert: AddAlert) {
		this.addAlert = addAlert;
	}

	public setEvent(eventData: Event) {
		this.event = this.parseJSONEvent(eventData);
	}

	public setActivity(id: number, activityData: Activity | null) {
		if (activityData == null) {
			this.activities = this.activities.filter((a) => a.id !== id);
		} else {
			const activity = this.parseJSONActivity(activityData);
			const index = this.activities.findIndex((a) => a.id === id);
			if (index !== -1) {
				this.activities[index] = activity;
			} else {
				this.activities.push(activity);
			}
		}
	}
}

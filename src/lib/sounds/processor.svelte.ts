import type { Activity, Event } from '$lib/types/db';
import { ActivityType, ConfigurableSounds } from '$lib/types/enums';
import {
	type Sound,
	type CompiledAlert,
	type CompiledSound,
	OtherSounds,
	type TimedAlerts
} from '$lib/types/sounds';
import { SvelteMap } from 'svelte/reactivity';
import { fixedSounds } from './fixed';
import { configurableSoundsData, getConfigurableSoundRoot } from './configurable';
import { builder as builder, SoundBuilder } from './builder';
import { logFunctions } from '$lib/utils';

const log = logFunctions('SoundProcessor');

const requiredConfigurableSounds: ConfigurableSounds[] = [
	ConfigurableSounds.ALERT_START,
	ConfigurableSounds.VECERNICEK,
	ConfigurableSounds.ZVOLAVACKA
];
const configurableSoundsRoot = getConfigurableSoundRoot();

export class SoundProcessor {
	private eventSounds: Map<ConfigurableSounds, Sound> = new SvelteMap();
	private validConfiguration = $state(true);
	private audioContext: AudioContext | null = null;

	// cached by sound path
	private soundCache: Map<string, AudioBuffer> = new SvelteMap();
	private loadingSounds: Map<string, Promise<AudioBuffer | null>> = new SvelteMap();

	private isPlaying: boolean = $state(false);
	private alertQueue: CompiledAlert[] = $state([]);
	private currentAlert: CompiledAlert | null = $state(null);
	private currentSound: CompiledSound | null = $state(null);
	private scheduledAlerts: Map<number, CompiledAlert[]> = new SvelteMap();

	private alertSchedulerTimeout: number | null = null;

	public _validConfiguration = $derived(this.validConfiguration);
	public _isPlaying = $derived(this.isPlaying);
	public _alertQueue = $derived(this.alertQueue);
	public _currentAlert = $derived(this.currentAlert);
	public _currentSound = $derived(this.currentSound);
	public _scheduledAlerts = $derived(this.scheduledAlerts);

	constructor(event: Event) {
		// Load configurable sounds from event
		Object.values(event.sounds).forEach((soundConfig) => {
			this.eventSounds.set(soundConfig.key, {
				content: configurableSoundsData[soundConfig.key].announcerLabel,
				path: soundConfig.path
			});
		});
		// Ensure all required configurable sounds are present
		requiredConfigurableSounds.forEach((soundType) => {
			if (!this.eventSounds.has(soundType)) {
				this.validConfiguration = false;
			}
		});

		$effect(() => {
			if (this.alertSchedulerTimeout) {
				clearTimeout(this.alertSchedulerTimeout);
				this.alertSchedulerTimeout = null;
			}
			if (this.scheduledAlerts.size === 0) return;

			const nextAlertTime = Math.min(...Array.from(this.scheduledAlerts.keys()));
			const delay = Math.max(0, nextAlertTime - Date.now());

			log.debug('Scheduling next alert check in', delay, 'ms');
			this.alertSchedulerTimeout = window.setTimeout(() => {
				this.checkScheduledAlerts();
			}, delay);
		});

		if (import.meta.hot) {
			import.meta.hot.on('vite:beforeUpdate', () => {
				log.info('HMR update detected, stopping playback and clearing queue');
				this.stopAndClear();
				this.audioContext?.close();
				this.audioContext = null;
				if (this.alertSchedulerTimeout) {
					clearTimeout(this.alertSchedulerTimeout);
					this.alertSchedulerTimeout = null;
				}
			});
		}
	}

	public setAudioContext(audioContext: AudioContext) {
		log.debug('Audio context set');
		this.audioContext = audioContext;
	}

	private async fetchAndDecodeSound(path: string, isConfigurable: boolean) {
		const response = await fetch(isConfigurable ? configurableSoundsRoot + path : path);
		if (!response.ok) {
			log.error('Failed to fetch sound for path ' + path);
			return null;
		}
		const arrayBuffer = await response.arrayBuffer();
		const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
		this.soundCache.set(path, audioBuffer);
		return audioBuffer;
	}

	private loadSound(path: string, isConfigurable: boolean) {
		if (this.soundCache.has(path)) {
			return Promise.resolve(this.soundCache.get(path)!);
		}
		if (this.loadingSounds.has(path)) {
			return this.loadingSounds.get(path)!;
		}

		const loadPromise = this.fetchAndDecodeSound(path, isConfigurable);
		this.loadingSounds.set(path, loadPromise);
		loadPromise.finally(() => {
			this.loadingSounds.delete(path);
		});
		return loadPromise;
	}

	public preloadSounds() {
		if (!this.audioContext) throw new Error('Audio context must be set before preloading sounds');
		(Object.values(fixedSounds) as Sound[]).forEach((sound) => this.loadSound(sound.path, false));
		this.eventSounds.forEach((sound) => this.loadSound(sound.path, true));
	}

	public playSounds(name: string, sounds: SoundBuilder) {
		const alert: CompiledAlert = {
			activityId: null,
			id: `${name}-${Math.random().toString(36).substring(2, 5)}`,
			sounds: sounds.build(this.eventSounds, this.loadSound.bind(this)),
			active: false
		};
		this.addAlert(alert);
		this.startPlaying();
	}

	private async playAlert(alert: CompiledAlert) {
		if (!this.audioContext) return;
		alert.active = true;
		for (let i = 0; i < alert.sounds.length; i++) {
			if (!this.isPlaying) break;
			const sound = alert.sounds[i];

			sound.source = this.audioContext.createBufferSource();
			const audioBuffer = await sound.audioPromise;
			if (!audioBuffer) {
				log.error('Audio buffer is null for sound', sound.key);
				sound.done = 'error';
				continue;
			}
			sound.source.buffer = audioBuffer;

			sound.active = true;
			this.currentSound = sound;
			sound.source.connect(this.audioContext.destination);
			sound.source.start(0);

			await new Promise((resolve) => {
				sound.source!.onended = () => {
					sound.source!.disconnect();
					sound.source = undefined;
					sound.active = false;
					sound.done = true;
					this.currentSound = null;
					resolve(null);
				};
			});
		}
		this.currentSound = null;
		alert.active = false;
	}

	public async startPlaying() {
		if (!this.audioContext) return;
		if (this.isPlaying) return;
		if (this.alertQueue.length === 0) return;
		this.isPlaying = true;

		while (this.isPlaying) {
			if (this.alertQueue.length === 0) {
				await new Promise((resolve) => setTimeout(resolve, 100));
				continue;
			}

			const alert = this.alertQueue[0];
			this.currentAlert = alert;
			await this.playAlert(alert);
			// Don't remove the alert if it was stopped mid-way
			if (this.isPlaying) this.alertQueue.shift();
		}

		this.currentAlert = null;
		this.currentSound = null;
		this.isPlaying = false;
	}

	private clearQueue() {
		this.alertQueue = [];
	}

	public clearSchedule() {
		this.scheduledAlerts.clear();
	}

	private stopPlaying() {
		this.isPlaying = false;
		if (this.currentSound && this.currentSound.source) {
			this.currentSound.source.stop();
			this.currentSound.source.disconnect();
			this.currentSound.source = undefined;
			this.currentSound.active = false;
			this.currentSound = null;
		}
		if (this.currentAlert) {
			this.currentAlert.active = false;
			this.currentAlert = null;
		}
	}

	public stopAndClear() {
		this.stopPlaying();
		this.clearQueue();
	}

	public addAlert(alert: CompiledAlert) {
		this.alertQueue.push(alert);
	}

	public removeAlert(alertId: CompiledAlert['id']) {
		const alert = this.alertQueue.find((a) => a.id === alertId);
		if (!alert) return;

		let shouldRestart = false;
		// If the alert is currently playing, stop it
		if (alert.active) {
			shouldRestart = true;
			this.stopPlaying();
		}
		this.alertQueue = this.alertQueue.filter((a) => a.id !== alertId);

		// If we were playing, restart playback
		if (shouldRestart) {
			this.startPlaying();
		}
	}

	public async compileActivity(activity: Activity) {
		if (!this.validConfiguration) {
			throw new Error('Invalid sound configuration. Cannot compile activity alerts.');
		}
		const compiledAlerts: TimedAlerts = {};

		const startSounds = builder(true).sound(OtherSounds.NEXT_ACTIVITY);
		for (const time of activity.alertTimes) {
			let sounds = startSounds
				.sound(activity.type, OtherSounds.ACTIVITY_START)
				.time(time.minutes)
				.location(activity.location);

			if (activity.participantNeeds.length > 0) {
				sounds = sounds.participantNeeds(activity.participantNeeds);
			}
			if (activity.additionalInfos.length > 0) {
				sounds = sounds.additionalInfos(activity.additionalInfos);
			}

			const alertTime =
				activity.startTime.valueOf() - time.minutes * 60 * 1000 + (activity.delay ?? 0) * 60 * 1000;
			compiledAlerts[alertTime] = {
				activityId: activity.id,
				id: `${activity.id}-pre-${time.minutes}`,
				sounds: sounds.build(this.eventSounds, this.loadSound.bind(this)),
				active: false
			};
		}

		if (activity.zvolavanie) {
			let zvolavanieTime = activity.startTime.valueOf() + (activity.delay ?? 0) * 60 * 1000;
			const zvolavanieSound =
				activity.type == ActivityType.VECIERKA
					? ConfigurableSounds.VECERNICEK
					: ConfigurableSounds.ZVOLAVACKA;
			try {
				const zvolavanieBuffer = await this.loadSound(
					this.eventSounds.get(zvolavanieSound)!.path,
					true
				);
				if (!zvolavanieBuffer) throw new Error('Zvolavanie sound could not be loaded');
				zvolavanieTime -= zvolavanieBuffer.duration * 1000;
			} catch (e) {
				log.warn('Failed to load zvolavanie sound for activity', activity.id, e);
			}

			compiledAlerts[zvolavanieTime] = {
				activityId: activity.id,
				id: `${activity.id}-zvolavanie`,
				sounds: builder().sound(zvolavanieSound).build(this.eventSounds, this.loadSound.bind(this)),
				active: false
			};
		}

		return compiledAlerts;
	}

	public scheduleAlerts(timedAlerts: TimedAlerts) {
		const discardTime = Date.now() - 5 * 1000; // 5 seconds grace period
		for (const [time, alert] of Object.entries(timedAlerts)) {
			const alertTime = Number(time);
			if (alertTime < discardTime) continue;
			if (!this.scheduledAlerts.has(alertTime)) {
				this.scheduledAlerts.set(alertTime, []);
			}
			this.scheduledAlerts.get(alertTime)!.push(alert);
		}
	}

	public async compileAndScheduleActivity(activity: Activity) {
		const timedAlerts = await this.compileActivity(activity);
		this.scheduleAlerts(timedAlerts);
		return timedAlerts;
	}

	private checkScheduledAlerts() {
		const now = Date.now().valueOf();
		for (const [time, alerts] of this.scheduledAlerts.entries()) {
			if (time <= now) {
				alerts.forEach((alert) => this.addAlert(alert));
				this.scheduledAlerts.delete(time);
			}
		}
		this.startPlaying();
	}
}

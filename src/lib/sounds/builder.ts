import type { ActivityAdditionalInfo, ActivityParticipantNeed, CustomSound } from '$lib/types/db';
import { ConfigurableSounds, type ParticipantNeeds } from '$lib/types/enums';
import {
	NumberSounds,
	OtherSounds,
	type AllSoundTypes,
	type CompiledSound,
	type FixedSounds,
	type Sound
} from '$lib/types/sounds';
import { fixedSounds } from './fixed';

export class SoundBuilder {
	private readonly soundAlternatives: Partial<Record<ConfigurableSounds, AllSoundTypes>> = {
		[ConfigurableSounds.DELAY_START]: ConfigurableSounds.ALERT_START,
		[ConfigurableSounds.DELAY_END]: ConfigurableSounds.ALERT_END
	};

	private constructor(
		private sounds: AllSoundTypes[],
		private alertEnd: boolean
	) {}

	public static create(startEnd: boolean = false) {
		return new SoundBuilder(startEnd ? [ConfigurableSounds.ALERT_START] : [], startEnd);
	}

	private clone(additionalSounds: AllSoundTypes[] = []) {
		return new SoundBuilder([...this.sounds, ...additionalSounds], this.alertEnd);
	}

	private buildNumber(number: number) {
		if (number > 69 || number <= 0)
			throw new Error('Number out of range for sound building (0-69)');
		const sounds = [];
		if (number >= 20) {
			const tens = Math.floor(number / 10) * 10;
			sounds.push(tens.toString() as NumberSounds);
			number = number % 10;
			if (number === 1) {
				sounds.push(NumberSounds.X_ONE);
				number = 0;
			} else if (number === 2) {
				sounds.push(NumberSounds.X_TWO);
				number = 0;
			}
		}
		if (number > 0) {
			sounds.push(number.toString() as NumberSounds);
		}
		return sounds;
	}

	private buildTime(minutes: number) {
		let sounds: (NumberSounds | OtherSounds)[] = [];
		const hours = Math.floor(minutes / 60);
		minutes = minutes % 60;
		if (hours > 0) {
			sounds = sounds.concat(this.buildNumber(hours));
			sounds.push(
				hours >= 5 ? OtherSounds.HOURS_5 : hours > 1 ? OtherSounds.HOURS_2 : OtherSounds.HOURS_1
			);
		}
		if (minutes > 0) {
			sounds = sounds.concat(this.buildNumber(minutes));
			sounds.push(
				minutes >= 5
					? OtherSounds.MINUTES_5
					: minutes > 1
						? OtherSounds.MINUTES_2
						: OtherSounds.MINUTES_1
			);
		}
		return sounds;
	}

	public sound(...sounds: AllSoundTypes[]) {
		return this.clone(sounds);
	}

	public number(number: number) {
		return this.clone(this.buildNumber(number));
	}

	public time(minutes: number) {
		return this.clone(this.buildTime(minutes));
	}

	public participantNeeds(needs: ActivityParticipantNeed[]) {
		return this.clone([OtherSounds.WILL_NEED, ...needs.map((need) => need.need)]);
	}

	public additionalInfos(infos: ActivityAdditionalInfo[]) {
		return this.clone([ConfigurableSounds.ADDITIONAL_JINGLE, ...infos.map((info) => info.info)]);
	}

	public getSounds() {
		if (this.alertEnd) {
			this.sounds.push(ConfigurableSounds.ALERT_END);
		}
		return this.sounds;
	}

	private resolveSoundKey(
		soundKey: AllSoundTypes,
		eventSounds: Map<ConfigurableSounds, Sound>
	): Sound | null {
		if (Object.values<string>(ConfigurableSounds).includes(soundKey)) {
			const sound = eventSounds.get(soundKey as ConfigurableSounds);
			if (sound) return sound;

			const alternativeKey = this.soundAlternatives[soundKey as ConfigurableSounds];
			return alternativeKey ? this.resolveSoundKey(alternativeKey, eventSounds) : null;
		} else {
			return fixedSounds[soundKey as FixedSounds] || null;
		}
	}

	public build(
		eventSounds: Map<ConfigurableSounds, Sound>,
		loadSound: (path: string, isConfigurable: boolean) => Promise<AudioBuffer>
	): CompiledSound[] {
		if (this.alertEnd) {
			this.sounds.push(ConfigurableSounds.ALERT_END);
		}
		return this.sounds
			.map((soundKey) => {
				const sound = this.resolveSoundKey(soundKey, eventSounds);

				if (!sound) {
					console.warn('Sound not found for key:', soundKey, typeof soundKey);
					return null;
				}

				return {
					content: sound.content,
					path: sound.path,
					key: soundKey,
					audioPromise: loadSound(
						sound.path,
						Object.values<string>(ConfigurableSounds).includes(soundKey)
					),
					source: undefined,
					active: false,
					done: false
				};
			})
			.filter((s) => s !== null);
	}
}

export function builder(startEnd: boolean = false, sounds: AllSoundTypes[] = []) {
	return SoundBuilder.create(startEnd).sound(...sounds);
}

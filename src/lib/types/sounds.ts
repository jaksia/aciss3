import type { Activity, ActivityLocation } from './db';
import { ActivityType, AdditionalInfo, ConfigurableSounds, ParticipantNeeds } from './enums';

export type Sound = {
	path: string;
	content: string;
};

export enum NumberSounds {
	ONE = '1',
	TWO = '2',
	THREE = '3',
	FOUR = '4',
	FIVE = '5',
	SIX = '6',
	SEVEN = '7',
	EIGHT = '8',
	NINE = '9',

	ELEVEN = '11',
	TWELVE = '12',
	THIRTEEN = '13',
	FOURTEEN = '14',
	FIFTEEN = '15',
	SIXTEEN = '16',
	SEVENTEEN = '17',
	EIGHTEEN = '18',
	NINETEEN = '19',

	TEN = '10',
	TWENTY = '20',
	THIRTY = '30',
	FORTY = '40',
	FIFTY = '50',
	SIXTY = '60',

	X_ONE = 'X_ONE',
	X_TWO = 'X_TWO'
}

export enum OtherSounds {
	HOURS_1 = 'HOURS_1',
	HOURS_2 = 'HOURS_2',
	HOURS_5 = 'HOURS_5',

	MINUTES_1 = 'MINUTES_1',
	MINUTES_2 = 'MINUTES_2',
	MINUTES_5 = 'MINUTES_5',

	AND = 'AND',

	NEXT_ACTIVITY = 'NEXT_ACTIVITY',
	ACTIVITY_START = 'ACTIVITY_START',
	WILL_NEED = 'WILL_NEED',
	DELAY_INTRO = 'DELAY_INTRO',
	DELAY_OUTRO = 'DELAY_OUTRO',

	DESIATA = 'SNACK_1',
	OLOVRANT = 'SNACK_2',
	SECOND_DINNER = 'SECOND_DINNER',

	BUDICEK_START = 'BUDICEK_START',
	BUDICEK_END = 'BUDICEK_END'
}

export type FixedSounds =
	| NumberSounds
	| OtherSounds
	| Exclude<ActivityType, ActivityType.BUDICEK>
	| ParticipantNeeds
	| AdditionalInfo;

export type FixedSoundMap = Record<FixedSounds, Sound>;

export type AllSoundTypes =
	| NumberSounds
	| OtherSounds
	| ConfigurableSounds
	| ActivityType
	| ParticipantNeeds
	| AdditionalInfo;

export type CompiledSound = {
	path: string;
	key: AllSoundTypes;
	content: string;
	active: boolean;
	done: boolean | 'error';

	audioPromise: Promise<AudioBuffer | null>;
	source?: AudioBufferSourceNode;
};

export type CompiledAlert = {
	activityId: Activity['id'] | null;
	id: string;
	active: boolean;
	sounds: CompiledSound[];
};

export type TimedAlerts = {
	[timestamp: number]: CompiledAlert;
};

export type SoundBuilderSound =
	| AllSoundTypes
	| `loc;${ActivityLocation['name']};${ActivityLocation['content']};${ActivityLocation['path']};${ActivityLocation['isStatic']}`;

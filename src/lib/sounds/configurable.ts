import { env } from '$env/dynamic/public';
import { ConfigurableSounds } from '$lib/types/enums';

type ConfigurableSoundData = {
	adminLabel: string;
	adminDescription?: string;
	announcerLabel: string;
	required: boolean;
};

export const configurableSoundsData: Record<ConfigurableSounds, ConfigurableSoundData> = {
	[ConfigurableSounds.ALERT_START]: {
		adminLabel: 'Začiatok hlásenia',
		announcerLabel: 'Znelka - začiatok hlásenia',
		required: true
	},
	[ConfigurableSounds.ALERT_END]: {
		adminLabel: 'Koniec hlásenia',
		announcerLabel: 'Znelka - koniec hlásenia',
		required: false
	},
	[ConfigurableSounds.ADDITIONAL_JINGLE]: {
		adminLabel: 'Zvuk pred ďalšími informáciami',
		announcerLabel: 'Znelka - ďalšie informácie',
		required: false
	},
	[ConfigurableSounds.DELAY_START]: {
		adminLabel: 'Začiatok meškania',
		adminDescription: 'Ak nie je nastavené, použije sa "Začiatok hlásenia"',
		announcerLabel: 'Znelka - začiatok meškania',
		required: false
	},
	[ConfigurableSounds.DELAY_END]: {
		adminLabel: 'Koniec meškania',
		adminDescription: 'Ak nie je nastavené, použije sa "Koniec hlásenia"',
		announcerLabel: 'Znelka - koniec meškania',
		required: false
	},
	[ConfigurableSounds.ZVOLAVACKA]: {
		adminLabel: 'Zvolávačka',
		announcerLabel: 'Zvolávačka',
		required: true
	},
	[ConfigurableSounds.VECERNICEK]: {
		adminLabel: 'Večerníček',
		announcerLabel: 'Večerníček',
		required: true
	}
};

export function getConfigurableSoundRoot(): string {
	if (env.PUBLIC_SOUND_FILES_PATH) {
		return env.PUBLIC_SOUND_FILES_PATH;
	} else {
		return '/sounds/custom/';
	}
}

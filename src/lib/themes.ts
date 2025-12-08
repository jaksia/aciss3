export enum EventStyle {
	DEFAULT = 'default',
	PIKOMAT = 'Pikomat',
	PIKOFYZ = 'Pikofyz',
	KOCKAC = 'Kockatý víkend'
}

type StyleData = {
	logoPath?: string;
	primaryColor: string;
	fontFamily?: string;
};

export const styleData: Record<EventStyle, StyleData> = {
	[EventStyle.DEFAULT]: {
		logoPath: '/themes/default/logo.png',
		primaryColor: 'var(--color-secondary)',
		fontFamily: 'Montserrat, sans-serif'
	},
	[EventStyle.PIKOMAT]: {
		logoPath: '/themes/pikomat/logo.png',
		primaryColor: 'var(--color-pikomat)',
		fontFamily: 'Montserrat, sans-serif'
	},
	[EventStyle.PIKOFYZ]: {
		logoPath: '/themes/pikofyz/logo.png',
		primaryColor: 'var(--color-pikofyz)',
		fontFamily: 'Montserrat, sans-serif'
	},
	[EventStyle.KOCKAC]: {
		logoPath: '/themes/kockac/logo.png',
		primaryColor: 'var(--color-kockac)',
		fontFamily: 'Montserrat, sans-serif'
	}
};

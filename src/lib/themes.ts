export enum EventStyle {
	DEFAULT = 'default',
	PIKOMAT = 'Pikomat',
	PIKOFYZ = 'Pikofyz',
	KOCKAC = 'Kockatý víkend',
	
	RIESKY = 'Riešky',

	KSP = 'KSP',
	FKS = 'FKS',
	KMS = 'KMS'
}

type StyleData = {
	logoPath?: string;
	primaryColor: string;
	fontFamily?: string;
};

export const styleData: Record<EventStyle, StyleData> = {
	[EventStyle.DEFAULT]: {
		logoPath: '/themes/default/logo.svg',
		primaryColor: 'var(--color-secondary)',
		fontFamily: 'Montserrat, sans-serif'
	},
	[EventStyle.PIKOMAT]: {
		logoPath: '/themes/pikomat/logo.svg',
		primaryColor: 'var(--color-pikomat)',
		fontFamily: 'Montserrat, sans-serif'
	},
	[EventStyle.PIKOFYZ]: {
		logoPath: '/themes/pikofyz/logo.svg',
		primaryColor: 'var(--color-pikofyz)',
		fontFamily: 'Montserrat, sans-serif'
	},
	[EventStyle.KOCKAC]: {
		logoPath: '/themes/kockac/logo.svg',
		primaryColor: 'var(--color-kockac)',
		fontFamily: 'Montserrat, sans-serif'
	},
	[EventStyle.RIESKY]: {
		logoPath: '/themes/riesky/logo.svg',
		primaryColor: 'var(--color-riesky)',
		fontFamily: 'Montserrat, sans-serif'
	},
	[EventStyle.KSP]: {
		logoPath: '/themes/ksp/logo.svg',
		primaryColor: 'var(--color-ksp)',
		fontFamily: 'Montserrat, sans-serif'
	},
	[EventStyle.FKS]: {
		logoPath: '/themes/fks/logo.svg',
		primaryColor: 'var(--color-fks)',
		fontFamily: 'Montserrat, sans-serif'
	},
	[EventStyle.KMS]: {
		logoPath: '/themes/kms/logo.svg',
		primaryColor: 'var(--color-kms)',
		fontFamily: 'Montserrat, sans-serif'
	}
};

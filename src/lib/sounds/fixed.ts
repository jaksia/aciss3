import { ActivityType, ActivityLocation, ParticipantNeeds, AdditionalInfo } from '$lib/types/enums';
import { type FixedSoundMap, NumberSounds, OtherSounds } from '$lib/types/sounds';

export const fixedSounds: FixedSoundMap = {
	[NumberSounds.ONE]: { path: '/sounds/numbers/1.mp3', content: '1' },
	[NumberSounds.TWO]: { path: '/sounds/numbers/2.mp3', content: '2' },
	[NumberSounds.THREE]: { path: '/sounds/numbers/3.mp3', content: '3' },
	[NumberSounds.FOUR]: { path: '/sounds/numbers/4.mp3', content: '4' },
	[NumberSounds.FIVE]: { path: '/sounds/numbers/5.mp3', content: '5' },
	[NumberSounds.SIX]: { path: '/sounds/numbers/6.mp3', content: '6' },
	[NumberSounds.SEVEN]: { path: '/sounds/numbers/7.mp3', content: '7' },
	[NumberSounds.EIGHT]: { path: '/sounds/numbers/8.mp3', content: '8' },
	[NumberSounds.NINE]: { path: '/sounds/numbers/9.mp3', content: '9' },
	[NumberSounds.TEN]: { path: '/sounds/numbers/10.mp3', content: '10' },
	[NumberSounds.ELEVEN]: { path: '/sounds/numbers/11.mp3', content: '11' },
	[NumberSounds.TWELVE]: { path: '/sounds/numbers/12.mp3', content: '12' },
	[NumberSounds.THIRTEEN]: { path: '/sounds/numbers/13.mp3', content: '13' },
	[NumberSounds.FOURTEEN]: { path: '/sounds/numbers/14.mp3', content: '14' },
	[NumberSounds.FIFTEEN]: { path: '/sounds/numbers/15.mp3', content: '15' },
	[NumberSounds.SIXTEEN]: { path: '/sounds/numbers/16.mp3', content: '16' },
	[NumberSounds.SEVENTEEN]: { path: '/sounds/numbers/17.mp3', content: '17' },
	[NumberSounds.EIGHTEEN]: { path: '/sounds/numbers/18.mp3', content: '18' },
	[NumberSounds.NINETEEN]: { path: '/sounds/numbers/19.mp3', content: '19' },
	[NumberSounds.TWENTY]: { path: '/sounds/numbers/20.mp3', content: '20' },
	[NumberSounds.THIRTY]: { path: '/sounds/numbers/30.mp3', content: '30' },
	[NumberSounds.FORTY]: { path: '/sounds/numbers/40.mp3', content: '40' },
	[NumberSounds.FIFTY]: { path: '/sounds/numbers/50.mp3', content: '50' },
	[NumberSounds.SIXTY]: { path: '/sounds/numbers/60.mp3', content: '60' },
	[NumberSounds.X_ONE]: { path: '/sounds/numbers/X_1.mp3', content: 'x1' },
	[NumberSounds.X_TWO]: { path: '/sounds/numbers/X_2.mp3', content: 'x2' },

	[OtherSounds.HOURS_1]: { path: '/sounds/other/hours_1.mp3', content: 'hodina' },
	[OtherSounds.HOURS_2]: { path: '/sounds/other/hours_2_4.mp3', content: 'hodiny' },
	[OtherSounds.HOURS_5]: { path: '/sounds/other/hours_5_plus.mp3', content: 'hodín' },
	[OtherSounds.MINUTES_1]: { path: '/sounds/other/minutes_1.mp3', content: 'minúta' },
	[OtherSounds.MINUTES_2]: { path: '/sounds/other/minutes_2_4.mp3', content: 'minúty' },
	[OtherSounds.MINUTES_5]: { path: '/sounds/other/minutes_5_plus.mp3', content: 'minút' },
	[OtherSounds.NEXT_ACTIVITY]: {
		path: '/sounds/other/next_activity.mp3',
		content: 'Najbližší program'
	},
	[OtherSounds.ACTIVITY_START]: {
		path: '/sounds/other/starts_in.mp3',
		content: 'sa začína o'
	},
	[OtherSounds.WILL_NEED]: {
		path: '/sounds/other/will_need.mp3',
		content: 'Na programe budete potrebovať'
	},
	[OtherSounds.DELAY_INTRO]: {
		path: '/sounds/other/delay_intro.mp3',
		content: 'bude meškať so svojím začiatkom'
	},
	[OtherSounds.DELAY_OUTRO]: {
		path: '/sounds/other/delay_outro.mp3',
		content: 'Ohlásená doba meškania sa môže zmeniť. Za vzniknuté meškanie sa ospravedlňujeme.'
	},
	[OtherSounds.DESIATA]: {
		path: '/sounds/other/desiata.mp3',
		content: 'Desiata je pre vás pripravená'
	},
	[OtherSounds.OLOVRANT]: {
		path: '/sounds/other/olovrant.mp3',
		content: 'Olovrant je pre vás pripravený'
	},
	[OtherSounds.SECOND_DINNER]: {
		path: '/sounds/other/second_dinner.mp3',
		content: 'Druhá večera je pre vás pripravená'
	},
	[OtherSounds.BUDICEK_START]: { path: '/sounds/other/budicek_start.mp3', content: 'Bolo' },
	[OtherSounds.BUDICEK_END]: {
		path: '/sounds/other/budicek_end.mp3',
		content: ', nasleduje budíček.'
	},

	[ActivityType.ROZCVICKA]: {
		path: '/sounds/activities/types/rozcvicka.mp3',
		content: 'Rozcvička'
	},
	[ActivityType.VECIERKA]: {
		path: '/sounds/activities/types/vecierka.mp3',
		content: 'Večierka'
	},
	[ActivityType.BREAKFAST]: {
		path: '/sounds/activities/types/breakfast.mp3',
		content: 'Raňajky'
	},
	[ActivityType.LUNCH]: { path: '/sounds/activities/types/lunch.mp3', content: 'Obed' },
	[ActivityType.DINNER]: { path: '/sounds/activities/types/dinner.mp3', content: 'Večera' },
	[ActivityType.GAME_INSIDE]: {
		path: '/sounds/activities/types/game_inside.mp3',
		content: 'Hra na dnu'
	},
	[ActivityType.GAME_OUTSIDE]: {
		path: '/sounds/activities/types/game_outside.mp3',
		content: 'Hra vonku'
	},
	[ActivityType.SPORT]: { path: '/sounds/activities/types/sport.mp3', content: 'Športy' },
	[ActivityType.LECTURE]: {
		path: '/sounds/activities/types/lecture.mp3',
		content: 'Prednášky'
	},
	[ActivityType.SEMINAR]: { path: '/sounds/activities/types/seminar.mp3', content: 'Semináre' },
	[ActivityType.VYHODNOTENIE]: {
		path: '/sounds/activities/types/vyhodnotenie.mp3',
		content: 'Vyhodnotenie'
	},

	[ActivityLocation.CANTEEN]: {
		path: '/sounds/activities/locations/canteen.mp3',
		content: 'v jedáleni'
	},
	[ActivityLocation.MAIN_ENTRANCE]: {
		path: '/sounds/activities/locations/main_entrance.mp3',
		content: 'pred hl. vchodom'
	},
	[ActivityLocation.GYM]: {
		path: '/sounds/activities/locations/gym.mp3',
		content: 'v telocvični'
	},
	[ActivityLocation.BOTTOM_FLOOR]: {
		path: '/sounds/activities/locations/bottom_floor.mp3',
		content: 'na spodnom poschodí'
	},
	[ActivityLocation.SPOLOCENSKA]: {
		path: '/sounds/activities/locations/spolocenska.mp3',
		content: 'v spoločenskej miestnosti'
	},
	[ActivityLocation.OUTSIDE]: {
		path: '/sounds/activities/locations/outside.mp3',
		content: 'vonku'
	},

	[ParticipantNeeds.PEN_PER_PERSON]: {
		path: '/sounds/participant_needs/pen_per_person.mp3',
		content: 'Pero na osobu'
	},
	[ParticipantNeeds.PAPER_PER_PERSON]: {
		path: '/sounds/participant_needs/paper_per_person.mp3',
		content: 'Papier na osobu'
	},
	[ParticipantNeeds.SCARF_PER_PERSON]: {
		path: '/sounds/participant_needs/scarf_per_person.mp3',
		content: 'Šatka na osobu'
	},
	[ParticipantNeeds.PEN_PER_GROUP]: {
		path: '/sounds/participant_needs/pen_per_group.mp3',
		content: 'Pero na družinku'
	},
	[ParticipantNeeds.PAPER_PER_GROUP]: {
		path: '/sounds/participant_needs/paper_per_group.mp3',
		content: 'Papier na družinku'
	},
	[ParticipantNeeds.SCARF_PER_GROUP]: {
		path: '/sounds/participant_needs/scarf_per_group.mp3',
		content: 'Šatka na družinku'
	},
	[ParticipantNeeds.PHYSICAL_FORCE]: {
		path: '/sounds/participant_needs/physical_force.mp3',
		content: 'Fyzická sila'
	},
	[ParticipantNeeds.MENTAL_FORCE]: {
		path: '/sounds/participant_needs/mental_force.mp3',
		content: 'Mentálna sila'
	},
	[ParticipantNeeds.WARM_CLOTHES]: {
		path: '/sounds/participant_needs/warm_clothes.mp3',
		content: 'Teplé oblečenie'
	},
	[ParticipantNeeds.WATER_PROOF_CLOTHES]: {
		path: '/sounds/participant_needs/water_proof_clothes.mp3',
		content: 'Nepremokavé oblečenie'
	},
	[ParticipantNeeds.SPORT_CLOTHES]: {
		path: '/sounds/participant_needs/sport_clothes.mp3',
		content: 'Športové oblečenie'
	},
	[ParticipantNeeds.DESTROY_CLOTHES]: {
		path: '/sounds/participant_needs/destroy_clothes.mp3',
		content: 'Oblečenie na zničenie'
	},

	[AdditionalInfo.CHANGING_SHOES]: {
		path: '/sounds/additional_info/changing_shoes.mp3',
		content: 'Prezúvanie'
	},
	[AdditionalInfo.SWITCH_DUTIES]: {
		path: '/sounds/additional_info/switch_duties.mp3',
		content: 'Striedanie kroniky/služ. dňa'
	},
	[AdditionalInfo.CLEAN_UP]: {
		path: '/sounds/additional_info/clean_up.mp3',
		content: 'Upracte po sebe'
	},
	[AdditionalInfo.CHILL_MODE]: {
		path: '/sounds/additional_info/chill_mode.mp3',
		content: 'Kľudový režim'
	}
};

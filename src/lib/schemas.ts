import * as v from 'valibot';
import { EventStyle } from '$lib/themes';
import { ActivityType, AdditionalInfo, ParticipantNeeds } from './types/enums';

export const audioFileSchema = v.pipe(
	v.file(),
	v.mimeType(
		['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/aac', 'audio/flac'],
		'Invalid audio file type'
	),
	v.maxSize(10 * 1024 * 1024, 'File must be smaller than 10MB')
);

export function getCreateEventSchema(rootPasswordRequired: boolean) {
	return v.pipe(
		v.object({
			name: v.pipe(v.string(), v.nonEmpty('Event name cannot be empty')),
			location: v.pipe(v.string(), v.nonEmpty('Location cannot be empty')),
			style: v.enum(EventStyle, 'Invalid event style'),
			startDate: v.pipe(
				v.number(),
				v.transform((n) => new Date(n)),
				v.date()
			),
			endDate: v.pipe(
				v.number(),
				v.transform((n) => new Date(n)),
				v.date()
			),
			_rootPassword: v.pipe(
				v.optional(v.string()),
				v.check((pwd) => {
					return !rootPasswordRequired || (pwd !== undefined && pwd.length > 0);
				}, 'Root password is required')
			)
		}),
		v.forward(
			v.partialCheck(
				[['startDate'], ['endDate']],
				(data: { startDate: Date; endDate: Date }) => {
					return data.endDate >= data.startDate;
				},
				'End date must be after start date'
			),
			['endDate']
		)
	);
}

export const createLocationSchema = v.object({
	name: v.pipe(v.string(), v.nonEmpty('Location name cannot be empty')),
	content: v.pipe(v.string(), v.nonEmpty('Location content cannot be empty')),
	file: audioFileSchema,
	assignToEvent: v.optional(v.number())
});

export const activityDataValidator = v.pipe(
	v.object({
		name: v.pipe(v.string(), v.nonEmpty('Activity name cannot be empty')),
		type: v.enum(ActivityType, 'Invalid activity type'),
		locationId: v.number(),

		startTime: v.pipe(
			v.number(),
			v.transform((t) => new Date(t))
		),
		endTime: v.pipe(
			v.number(),
			v.transform((t) => new Date(t))
		),
		zvolavanie: v.optional(v.boolean(), false),
		delay: v.optional(v.pipe(v.number(), v.minValue(1, 'Delay must be positive or empty'))),

		alertTimes: v.pipe(
			// the v.number() schema should be wrapped in v.optional, but sveltekit types would error,
			// so instead we filter out undefined later, since there is no reason to fail validation for them
			v.optional(
				v.pipe(
					v.array(v.number()),
					v.transform((times) => times.filter((t) => t !== undefined)),
					v.check((times) => times.every((t) => t! > 0), 'Alert times must be positive'),
					v.check((times) => new Set(times).size === times.length, 'Alert times must be unique')
				),
				[]
			)
		),
		additionalInfos: v.optional(v.array(v.enum(AdditionalInfo, 'Invalid additional info')), []),
		participantNeeds: v.optional(v.array(v.enum(ParticipantNeeds, 'Invalid participant need')), [])
	}),
	v.forward(
		v.partialCheck(
			[['startTime'], ['endTime']],
			({ startTime, endTime }) => startTime < endTime,
			'Start time must be before end time'
		),
		['endTime']
	)
);

export const activityFormValidator = v.pipe(
	v.object({
		eventId: v.number(),
		activityId: v.optional(v.number()),
		activityData: activityDataValidator
	})
);

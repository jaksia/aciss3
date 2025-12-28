import * as v from 'valibot';
import { EventStyle } from '$lib/themes';

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

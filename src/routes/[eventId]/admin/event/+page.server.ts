import { eventExists, getEvent, updateEvent } from '$lib/server/db/utils.js';
import { triggerEventUpdate } from '$lib/server/socket';
import { EventStyle } from '$lib/themes.js';
import type { BaseEvent, EditableEvent } from '$lib/types/db.js';
import { error, fail } from '@sveltejs/kit';

export const actions = {
	default: async ({ request, params }) => {
		const formData = await request.formData();

		const eventId = parseInt(params.eventId);
		if (isNaN(eventId)) {
			error(404, 'Invalid event ID or event not found');
		}
		if (!(await eventExists(eventId))) {
			error(404, 'Invalid event ID or event not found');
		}

		const data = {
			startDate: formData.get('startDate'),
			endDate: formData.get('endDate'),
			name: formData.get('name'),
			location: formData.get('location'),
			style: formData.get('style')
		} as unknown as Partial<Omit<BaseEvent, 'id'>>;

		if (Object.values(data).some((v) => v === null || v === undefined)) {
			return fail(400, { ...data, error: 'Missing form data' });
		}

		if (!(typeof data.name === 'string' && data.name.length > 0)) {
			data.name = '';
			return fail(400, { ...data, invalid: 'name' });
		}
		if (!(typeof data.location === 'string' && data.location.length > 0)) {
			data.location = '';
			return fail(400, { ...data, invalid: 'location' });
		}
		if (!Object.values(EventStyle).includes(data.style as EventStyle)) {
			data.style = EventStyle.DEFAULT;
			return fail(400, { ...data, invalid: 'style' });
		}
		const startDate = new Date(data.startDate!);
		const endDate = new Date(data.endDate!);
		if (isNaN(startDate.valueOf())) {
			delete data.startDate;
			return fail(400, { ...data, invalid: 'startDate' });
		}
		if (isNaN(endDate.valueOf())) {
			delete data.endDate;
			return fail(400, { ...data, invalid: 'endDate' });
		}
		if (endDate.valueOf() <= startDate.valueOf()) {
			delete data.endDate;
			return fail(400, { ...data, invalid: 'endDate' });
		}

		try {
			await updateEvent(
				eventId,
				data as {
					name: string;
					location: string;
					style: EventStyle;
					startDate: string;
					endDate: string;
				}
			);
			triggerEventUpdate(eventId);
			return { success: true, ...data, newEvent: await getEvent(eventId) };
		} catch (e) {
			return fail(500, { ...data, error: 'Could not update event' });
		}
	}
};

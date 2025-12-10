import { ARGON2_CONFIG } from '$lib/server/auth.js';
import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { eventExists, getEvent, updateEvent } from '$lib/server/db/utils.js';
import { triggerEventUpdate } from '$lib/server/socket';
import { EventStyle } from '$lib/themes.js';
import type { BaseEvent } from '$lib/types/db.js';
import { hash, verify } from '@node-rs/argon2';
import { error, fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export const actions = {
	edit: async ({ request, params }) => {
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
			style: formData.get('style'),
			action: 'edit'
		} as unknown as Partial<Omit<BaseEvent, 'id'>>;

		if (Object.values(data).some((v) => v === null || v === undefined)) {
			return fail(400, { data, error: 'Missing form data' });
		}

		if (!(typeof data.name === 'string' && data.name.length > 0)) {
			data.name = '';
			return fail(400, { data, invalid: 'name' });
		}
		if (!(typeof data.location === 'string' && data.location.length > 0)) {
			data.location = '';
			return fail(400, { data, invalid: 'location' });
		}
		if (!Object.values(EventStyle).includes(data.style as EventStyle)) {
			data.style = EventStyle.DEFAULT;
			return fail(400, { data, invalid: 'style' });
		}
		const startDate = new Date(data.startDate!);
		const endDate = new Date(data.endDate!);
		if (isNaN(startDate.valueOf())) {
			delete data.startDate;
			return fail(400, { data, invalid: 'startDate' });
		}
		if (isNaN(endDate.valueOf())) {
			delete data.endDate;
			return fail(400, { data, invalid: 'endDate' });
		}
		if (endDate.valueOf() <= startDate.valueOf()) {
			delete data.endDate;
			return fail(400, { data, invalid: 'endDate' });
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
			return { success: true, event: await getEvent(eventId) };
		} catch (e) {
			console.error(e);
			return fail(500, { data, error: 'Could not update event' });
		}
	},
	password: async ({ request, params }) => {
		const formData = await request.formData();

		const eventId = parseInt(params.eventId);
		if (isNaN(eventId)) {
			error(404, 'Invalid event ID or event not found');
		}
		const event = await getEvent(eventId);
		if (!event) {
			error(404, 'Invalid event ID or event not found');
		}

		const currentAdminPassword = formData.get('currentAdminPassword');
		if (
			event.adminPasswordHash &&
			(typeof currentAdminPassword !== 'string' || currentAdminPassword.length === 0)
		) {
			return fail(400, { action: 'password', error: 'Missing current admin password' });
		}

		if (event.adminPasswordHash) {
			const isPasswordValid = await verify(
				event.adminPasswordHash,
				currentAdminPassword as string,
				ARGON2_CONFIG
			);
			if (!isPasswordValid) {
				return fail(403, { action: 'password', error: 'Current admin password is incorrect' });
			}
		}

		const adminPassword = formData.get('adminPassword');
		const adminPasswordConfirm = formData.get('adminPasswordConfirm');
		if (typeof adminPassword !== 'string' || adminPassword.length === 0) {
			return fail(400, { action: 'password', error: 'Missing new admin password' });
		}
		if (adminPassword !== adminPasswordConfirm) {
			return fail(400, { action: 'password', error: 'New admin passwords do not match' });
		}

		let adminPasswordHash: string | null;

		if (adminPassword.length === 0) {
			adminPasswordHash = null;
		} else {
			adminPasswordHash = await hash(adminPassword, ARGON2_CONFIG);
		}

		try {
			await updateEvent(eventId, { adminPasswordHash });
			await db
				.delete(schema.sessionAllowedEvents)
				.where(eq(schema.sessionAllowedEvents.eventId, eventId));
			triggerEventUpdate(eventId);
			return { success: true, action: 'password', event: await getEvent(eventId) };
		} catch (e) {
			console.error(e);
			return fail(500, { action: 'password', error: 'Could not update admin password' });
		}
	}
};

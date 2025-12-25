import { createEvent } from '$lib/server/db/utils';
import { EventStyle } from '$lib/themes';
import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { resolve } from '$app/paths';
import { env } from '$env/dynamic/private';
import { verify } from '@node-rs/argon2';
import { ARGON2_CONFIG } from '$lib/server/session';

const hasRootPassword = env.ROOT_ADMIN_PASSWORD_HASH ? true : false;
const validRootPassword = hasRootPassword
	? await verify(env.ROOT_ADMIN_PASSWORD_HASH!, 'test', ARGON2_CONFIG)
			.then(() => true)
			.catch(() => false)
	: true;

export const load: PageServerLoad = async () => {
	return {
		hasRootPassword,
		validRootPassword
	};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();

		const errors = [];
		let errorCode = 400;

		if (hasRootPassword) {
			if (!validRootPassword) {
				console.error('Configured root password hash is invalid.');
				return {
					status: 500,
					data: {},
					errors: ['Server configuration error. Please contact the administrator.']
				};
			}

			const rootPassword = data.get('rootPassword');
			if (typeof rootPassword !== 'string' || rootPassword.length === 0) {
				errors.push('Root password is required.');
				errorCode = 400;
			} else {
				try {
					const valid = await verify(
						env.ROOT_ADMIN_PASSWORD_HASH!,
						rootPassword as string,
						ARGON2_CONFIG
					);
					if (!valid) {
						errors.push('Incorrect root password.');
						errorCode = 403;
					}
				} catch (e) {
					console.error('Error verifying root password:', e);
					errors.push('Error verifying root password.');
					errorCode = 500;
				}
			}
		}

		const name = data.get('name');
		if (typeof name !== 'string' || name.length === 0) {
			errors.push('Name is required.');
		}
		const location = data.get('location');
		if (typeof location !== 'string' || location.length === 0) {
			errors.push('Location is required.');
		}
		const style = data.get('style');
		if (typeof style !== 'string' || !Object.values<string>(EventStyle).includes(style)) {
			errors.push('Invalid style selected.');
		}
		const startDate = data.get('startDate');
		let startDateValid = true;
		const endDate = data.get('endDate');
		let endDateValid = true;
		if (typeof startDate !== 'string' || isNaN(Date.parse(startDate))) {
			errors.push('Invalid start date.');
			startDateValid = false;
		}
		if (typeof endDate !== 'string' || isNaN(Date.parse(endDate))) {
			errors.push('Invalid end date.');
			endDateValid = false;
		}
		if (startDateValid && endDateValid) {
			const start = new Date(startDate as string);
			const end = new Date(endDate as string);
			if (start >= end) {
				errors.push('End date must be after start date.');
			}
		}

		if (errors.length > 0) {
			return {
				status: errorCode,
				data: {
					name,
					location,
					style,
					startDate,
					endDate
				},
				errors
			};
		} else {
			let eventId: number;
			try {
				eventId = await createEvent({
					name: name as string,
					location: location as string,
					style: style as EventStyle,
					startDate: startDate as string,
					endDate: endDate as string,
					adminPasswordHash: null
				});
			} catch (e) {
				console.error('Error creating event:', e);
				return {
					status: 500,
					errors: ['Failed to create event. Please try again later.']
				};
			}
			redirect(303, resolve('/[eventId]/admin', { eventId: eventId.toString() }));
		}
	}
};

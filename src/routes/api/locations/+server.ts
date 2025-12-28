import { createLocation, eventExists, getEventLocations } from '$lib/server/db/utils';
import { saveSoundFiles } from '$lib/server/files/sounds';
import { triggerLocationsUpdate } from '$lib/server/socket';
import { jsonError, jsonResponse } from '$lib/server/utils';

export const POST = async ({ request }) => {
	try {
		const formData = await request.formData();
		const name = formData.get('name') as string;
		const content = formData.get('content') as string;
		const file = formData.get('file') as File;

		if (!name || !file || !content) {
			return jsonError('Name, content, and file are required', 400);
		}

		let eventId: number | undefined = undefined;
		if (formData.get('assignToEvent')) {
			const assignToEvent = Number.parseInt(formData.get('assignToEvent') as string);
			if (isNaN(assignToEvent)) return jsonError('Invalid event ID for assignment', 400);
			if (!(await eventExists(assignToEvent))) {
				return jsonError('Event to assign does not exist', 404);
			}
			eventId = assignToEvent;
		}

		const { upload } = await saveSoundFiles({ upload: file });
		if (!upload.success) {
			return jsonError('File upload failed: ' + upload.error, upload.internal ? 500 : 400);
		}

		// Assuming createLocation is a function that saves the location to the database
		const location = await createLocation(
			{
				name,
				content,
				path: upload.path
			},
			eventId
		);

		if (eventId) {
			triggerLocationsUpdate(eventId);

			return jsonResponse({
				location,
				eventLocations: await getEventLocations(eventId)
			});
		} else return jsonResponse({ location });
	} catch (error) {
		console.error('Error creating location:', error);
		return jsonError('Failed to create location', 500);
	}
};

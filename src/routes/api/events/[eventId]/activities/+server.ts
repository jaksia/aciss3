import { createOrUpdateActivity, eventExists } from '$lib/server/db/utils';
import { triggerActivitiesUpdate } from '$lib/server/socket';
import type { EditableActivity, EditableActivityServer } from '$lib/types/db';
import { checkValidActivityData, jsonError, jsonResponse } from '$lib/utils';

export const POST = async ({ params, request }) => {
	const eventId = parseInt(params.eventId);
	if (isNaN(eventId)) return jsonError('Invalid event ID or event not found', 404);
	if (!(await eventExists(eventId))) return jsonError('Invalid event ID or event not found', 404);

	const data = await request.json();
	if (!checkValidActivityData(data)) {
		return jsonResponse({ error: 'Invalid activity data' }, 400);
	}

	const editableActivity: EditableActivityServer = data.activity;

	const result = await createOrUpdateActivity(eventId, editableActivity);
	triggerActivitiesUpdate(eventId, result.id);

	return jsonResponse({ activity: result });
};

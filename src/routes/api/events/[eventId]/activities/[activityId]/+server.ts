import {
	activityExists,
	createOrUpdateActivity,
	deleteActivity,
	eventExists,
	setActivityDelay
} from '$lib/server/db/utils';
import { triggerActivitiesUpdate } from '$lib/server/socket';
import type { EditableActivityServer } from '$lib/types/db';
import { activityDataErrors, jsonError, jsonResponse } from '$lib/utils';

export const DELETE = async ({ params }) => {
	const eventId = parseInt(params.eventId);
	const activityId = parseInt(params.activityId);

	if (isNaN(eventId)) return jsonError('Invalid event ID or event not found', 404);
	if (!(await eventExists(eventId))) return jsonError('Invalid event ID or event not found', 404);

	if (isNaN(activityId)) {
		return jsonError('Invalid activity ID', 400);
	}

	const success = await deleteActivity(eventId, activityId);
	if (!success) {
		return jsonError('Activity not found or could not be deleted', 400);
	}

	triggerActivitiesUpdate(eventId, activityId);

	return jsonResponse();
};

export const PUT = async ({ params, request }) => {
	const eventId = parseInt(params.eventId);
	if (isNaN(eventId)) return jsonError('Invalid event ID or event not found', 404);
	if (!(await eventExists(eventId))) return jsonError('Invalid event ID or event not found', 404);

	const activityId = parseInt(params.activityId);
	if (isNaN(activityId)) {
		return jsonResponse({ error: 'Invalid activity ID' }, 400);
	}
	if (!(await activityExists(eventId, activityId))) {
		return jsonResponse({ error: 'Activity not found' }, 400);
	}

	const data = await request.json();
	const errors = activityDataErrors(data);
	if (errors.length > 0) {
		return jsonResponse({ error: 'Invalid activity data', details: errors }, 400);
	}

	const editableActivity: EditableActivityServer = data.activity;

	const result = await createOrUpdateActivity(eventId, editableActivity, activityId);
	triggerActivitiesUpdate(eventId, activityId);

	return jsonResponse({ activity: result });
};

export const PATCH = async ({ params, request }) => {
	const eventId = parseInt(params.eventId);
	if (isNaN(eventId)) return jsonError('Invalid event ID or event not found', 404);
	if (!(await eventExists(eventId))) return jsonError('Invalid event ID or event not found', 404);

	const activityId = parseInt(params.activityId);
	if (isNaN(activityId)) {
		return jsonResponse({ error: 'Invalid activity ID' }, 400);
	}
	if (!(await activityExists(eventId, activityId))) {
		return jsonResponse({ error: 'Activity not found' }, 400);
	}

	const data = await request.json();
	switch (data.action) {
		case 'setDelay': {
			const delay = data.delay;
			if ((typeof delay !== 'number' || delay < 0) && delay !== null) {
				return jsonResponse({ error: 'Invalid delay value' }, 400);
			}

			const result = await setActivityDelay(eventId, activityId, delay);
			triggerActivitiesUpdate(eventId, activityId);
			return jsonResponse({ activity: result });
		}
		default:
			return jsonResponse({ error: 'Invalid action' }, 400);
	}
};

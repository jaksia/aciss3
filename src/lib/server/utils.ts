import type { EditableActivityServer } from '$lib/types/db';
import { ActivityType, AdditionalInfo, ParticipantNeeds } from '$lib/types/enums';
import { locationExists } from './db/utils';

export async function checkValidActivityData(data: any) {
	const errors = await activityDataErrors(data);
	return errors.length === 0;
}

export async function activityDataErrors(data: any) {
	const errors: string[] = [];
	const editableActivity: EditableActivityServer = data.activity;
	if (!editableActivity || typeof editableActivity !== 'object') {
		errors.push('Activity data is missing or invalid');
		return errors;
	}
	if (typeof editableActivity.name !== 'string' || editableActivity.name.trim() === '') {
		errors.push('Activity name is required and must be a non-empty string');
	}
	if (!Object.values(ActivityType).includes(editableActivity.type)) {
		errors.push('Invalid activity type');
	}
	if (!(await locationExists(editableActivity.locationId))) {
		errors.push("Location doesn't exist");
	}
	if (
		typeof editableActivity.startTime !== 'number' ||
		typeof editableActivity.endTime !== 'number'
	) {
		errors.push('Invalid start or end time');
	}
	if (
		!Array.isArray(editableActivity.participantNeeds) ||
		!editableActivity.participantNeeds.every((n) => Object.values(ParticipantNeeds).includes(n))
	) {
		errors.push('Invalid participant needs');
	}
	if (
		!Array.isArray(editableActivity.additionalInfos) ||
		!editableActivity.additionalInfos.every((i) => Object.values(AdditionalInfo).includes(i))
	) {
		errors.push('Invalid additional infos');
	}
	if (
		!Array.isArray(editableActivity.alertTimes) ||
		!editableActivity.alertTimes.every((t) => typeof t === 'number' && t >= 1)
	) {
		errors.push('Invalid alert times');
	}
	if (typeof editableActivity.zvolavanie !== 'boolean') {
		errors.push('Invalid zvolavanie value');
	}
	return errors;
}

export function jsonResponse(data: any = {}, status = 200) {
	return new Response(
		JSON.stringify({
			...data,
			success: status >= 200 && status < 300
		}),
		{
			status,
			headers: { 'Content-Type': 'application/json' }
		}
	);
}

export function jsonError(message: string, status: number) {
	if (status < 400 || status >= 600) {
		throw new Error('jsonError called with invalid status code: ' + status);
	}
	return jsonResponse({ error: message }, status);
}

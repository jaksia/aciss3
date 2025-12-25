/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Action } from 'svelte/action';
import type { EditableActivityServer } from './types/db';
import { ActivityLocation, ActivityType, AdditionalInfo, ParticipantNeeds } from './types/enums';

export const clickOutside: Action<HTMLElement, { callback: (e: MouseEvent) => void }> = function (
	node,
	param = {
		callback: () => {}
	}
) {
	window.addEventListener('click', handleClick);

	function handleClick(e: MouseEvent) {
		if (!node.contains(e.target as Node)) {
			param.callback(e);
		}
	}

	return {
		destroy() {
			// the node has been removed from the DOM
			window.removeEventListener('click', handleClick);
		}
	};
};

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

export function checkValidActivityData(data: any): boolean {
	const errors = activityDataErrors(data);
	return errors.length === 0;
}

export function activityDataErrors(data: any): string[] {
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
	if (!Object.values(ActivityLocation).includes(editableActivity.location)) {
		errors.push('Invalid activity location');
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

export function logFunctions(prefix: string) {
	return {
		debug: (...args: any[]) => console.debug(`[${prefix}]`, ...args),
		info: (...args: any[]) => console.info(`[${prefix}]`, ...args),
		warn: (...args: any[]) => console.warn(`[${prefix}]`, ...args),
		error: (...args: any[]) => console.error(`[${prefix}]`, ...args),
		time: (label: string) => console.time(`[${prefix}] ${label}`),
		timeEnd: (label: string) => console.timeEnd(`[${prefix}] ${label}`),
		trace: (...args: any[]) => console.trace(`[${prefix}]`, ...args)
	};
}

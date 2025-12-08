import { createCustomSound, getEvent, setEventSound, soundExists } from '$lib/server/db/utils';
import { saveSoundFiles } from '$lib/server/files/sounds';
import { triggerEventUpdate } from '$lib/server/socket';
import { configurableSoundsData } from '$lib/sounds/configurable';
import { ConfigurableSounds } from '$lib/types/enums';
import { jsonError, jsonResponse } from '$lib/utils';

export const POST = async ({ request, params }) => {
	const eventId = Number.parseInt(params.eventId);
	if (isNaN(eventId)) {
		return jsonError('Invalid event ID or event not found', 404);
	}
	const event = await getEvent(eventId);
	if (!event) {
		return jsonError('Invalid event ID or event not found', 404);
	}

	const key = params.soundKey as ConfigurableSounds;
	if (!Object.values(ConfigurableSounds).includes(key)) {
		return jsonError('Invalid sound key', 404);
	}

	const formData = await request.formData();
	const file = formData.get('file') as File;
	const description = formData.get('description') as string;

	if (!description) {
		return jsonError('Missing sound description', 400);
	}
	if (!file || !(file instanceof File)) {
		return jsonError('Missing or invalid file', 400);
	}

	const { upload } = await saveSoundFiles({ upload: file });
	if (!upload.success) {
		return jsonError('File upload failed: ' + upload.error, upload.internal ? 500 : 400);
	}

	await createCustomSound(upload.path, key as ConfigurableSounds, description, event.id);

	triggerEventUpdate(event.id);
	return jsonResponse({ event: await getEvent(event.id) });
};

export const PUT = async ({ request, params }) => {
	const eventId = Number.parseInt(params.eventId);
	if (isNaN(eventId)) {
		return jsonError('Invalid event ID or event not found', 404);
	}
	const event = await getEvent(eventId);
	if (!event) {
		return jsonError('Invalid event ID or event not found', 404);
	}

	const key = params.soundKey as ConfigurableSounds;
	if (!Object.values(ConfigurableSounds).includes(key)) {
		return jsonError('Invalid sound key', 404);
	}

	const body = await request.json();
	const soundId = body.soundId as number;

	if (soundId !== null && !(await soundExists(soundId, key))) {
		return jsonError('Sound not found for the given key', 400);
	}

	await setEventSound(event.id, soundId, key);

	triggerEventUpdate(event.id);
	return jsonResponse({ event: await getEvent(event.id) });
};

export const DELETE = async ({ request, params }) => {
	const eventId = Number.parseInt(params.eventId);
	if (isNaN(eventId)) {
		return jsonError('Invalid event ID or event not found', 404);
	}
	const event = await getEvent(eventId);
	if (!event) {
		return jsonError('Invalid event ID or event not found', 404);
	}

	const key = params.soundKey as ConfigurableSounds;

	if (!Object.values(ConfigurableSounds).includes(key)) {
		return jsonError('Invalid sound key', 404);
	}
	if (configurableSoundsData[key].required) {
		return jsonError('This sound key requires a sound to be set, removal not allowed', 400);
	}

	await setEventSound(event.id, null, key);

	triggerEventUpdate(event.id);
	return jsonResponse({ event: await getEvent(event.id) });
};

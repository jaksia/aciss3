import { getAvailableSounds } from '$lib/server/db/utils';
import { ConfigurableSounds } from '$lib/types/enums';
import { jsonError, jsonResponse } from '$lib/utils';

export const GET = async ({ request }) => {
	const url = new URL(request.url);
	const key = url.searchParams.get('key');

	if (!key || !Object.values(ConfigurableSounds).includes(key as ConfigurableSounds)) {
		return jsonError('Invalid or missing key parameter', 400);
	}

	try {
		const sounds = await getAvailableSounds(key as ConfigurableSounds);
		return jsonResponse({ sounds });
	} catch (error) {
		console.error('Error fetching sounds:', error);
		return jsonError('Failed to fetch sounds', 500);
	}
};

import { env } from '$env/dynamic/public';
import { getSoundFile } from '$lib/server/files/sounds.js';
import { error } from '@sveltejs/kit';

export const GET = async ({ params }) => {
	if (!env.PUBLIC_SOUND_FILES_PATH) {
		error(404);
	}
	const { path } = params;
	const file = getSoundFile(path);
	if (file === null) {
		error(404);
	}

	return new Response(file.stream(), {
		headers: {
			'Content-Type': file.type,
			'Content-Length': file.size.toString(),
			'Cache-Control': 'public, max-age=31536000, immutable'
		}
	});
};

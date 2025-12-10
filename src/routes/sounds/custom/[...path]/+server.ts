import { env } from '$env/dynamic/public';
import { getSoundFile } from '$lib/server/files/sounds.js';
import { error } from '@sveltejs/kit';
import { Readable } from 'stream';

export const GET = async ({ params }) => {
	if (!env.PUBLIC_SOUND_FILES_PATH) {
		error(404);
	}
	const { path } = params;
	const file = getSoundFile(path);
	if (file === null) {
		error(404);
	}

	// TS has some obscure problem with Readable.toWeb typing, but it's actually correct
	return new Response(Readable.toWeb(file.stream) as ReadableStream, {
		headers: {
			'Content-Type': file.type,
			'Content-Length': file.size.toString(),
			'Cache-Control': 'public, max-age=31536000, immutable'
		}
	});
};

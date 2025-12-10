import { env } from '$env/dynamic/private';
import { createReadStream, statSync, writeFileSync } from 'fs';
import { lookup as lookupMime } from 'mime-types';

const rootDir = env.SOUND_FILES_PATH;
const publicRootDir = env.PUBLIC_SOUND_FILES_PATH;

const allowedAudioExtensions = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'];

export async function saveSoundFiles<T extends string>(toSave: Record<T, File>) {
	if (!rootDir) throw new Error('SOUND_FILES_PATH environment variable is not set.');

	const results = {} as Record<
		T,
		{ success: true; path: string } | { success: false; error: string; internal: boolean }
	>;

	for (const [key, file] of Object.entries(toSave) as [T, File][]) {
		// check if file is audio
		if (
			!file.type.startsWith('audio/') ||
			!allowedAudioExtensions.some((ext) => file.name.endsWith(`.${ext}`))
		) {
			results[key] = {
				success: false,
				error: `File ${file.name} [${key}] is not a valid audio file.`,
				internal: false
			};
			continue;
		}

		const uuid = crypto.randomUUID();
		const fileName = `${uuid}-${file.name}`;
		const filePath = `${rootDir}/${fileName}`;
		const buffer = Buffer.from(await file.arrayBuffer());
		try {
			writeFileSync(filePath, buffer);
		} catch (error) {
			console.error('Error saving file:', error);
			results[key] = {
				success: false,
				error: `Failed to save file ${file.name} [${key}].`,
				internal: true
			};
			continue;
		}
		results[key] = {
			success: true,
			path: publicRootDir ? `${publicRootDir}/${fileName}` : fileName
		};
	}
	return results;
}

export function getSoundFile(fileName: string) {
	if (publicRootDir)
		throw new Error('getSoundFile is not supported when PUBLIC_SOUND_FILES_PATH is set.');
	if (!rootDir) throw new Error('SOUND_FILES_PATH environment variable is not set.');

	const filePath = `${rootDir}/${fileName}`;
	try {
		const stat = statSync(filePath);
		if (!stat.isFile()) return null;
		const stream = createReadStream(filePath);

		return {
			stream,
			size: stat.size,
			type: lookupMime(filePath) || 'application/octet-stream'
		};
	} catch (error) {
		console.error('Error reading sound file:', error);
		return null;
	}
}

import { defineEnvVars } from '@sveltejs/kit/env';
import * as v from 'valibot';

export const variables = defineEnvVars({
	DATABASE_URL: {},
	SOCKETIO_PORT: {
		schema: v.pipe(v.string(), v.toNumber(), v.minValue(1), v.maxValue(65535))
	},
	ROOT_ADMIN_PASSWORD_HASH: {
		schema: v.optional(v.string())
	},
	SOUND_FILES_PATH: {},
	PUBLIC_SOUND_FILES_PATH: {
		public: true,
		schema: v.optional(v.string())
	},
	PUBLIC_SOCKETIO_HOST: {
		public: true
	}
});

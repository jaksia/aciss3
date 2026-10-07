import { building } from '$app/env';
import { defineEnvVars } from '@sveltejs/kit/env';
import * as v from 'valibot';

export const variables = defineEnvVars({
	DATABASE_URL: {
		schema: building ? v.optional(v.string()) : v.pipe(v.string(), v.url())
	},
	SOCKETIO_PORT: {
		schema: building
			? v.optional(v.string())
			: v.pipe(v.string(), v.toNumber(), v.minValue(1), v.maxValue(65535))
	},
	ROOT_ADMIN_PASSWORD_HASH: {
		schema: v.optional(v.string())
	},
	SOUND_FILES_PATH: {
		schema: building ? v.optional(v.string()) : v.string()
	},
	PUBLIC_SOUND_FILES_PATH: {
		public: true,
		schema: v.optional(v.string())
	},
	PUBLIC_SOCKETIO_HOST: {
		public: true,
		schema: building ? v.optional(v.string()) : v.pipe(v.string(), v.url())
	}
});

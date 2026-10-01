import type { PageServerLoad } from './$types';
import { verify } from '@node-rs/argon2';
import { ARGON2_CONFIG } from '#lib/server/session.js';
import { ROOT_ADMIN_PASSWORD_HASH } from '$app/env/private';

const hasRootPassword = ROOT_ADMIN_PASSWORD_HASH ? true : false;
const validRootPassword = hasRootPassword
	? await verify(ROOT_ADMIN_PASSWORD_HASH!, 'test', ARGON2_CONFIG)
			.then(() => true)
			.catch(() => false)
	: true;

export const load: PageServerLoad = async () => {
	return {
		hasRootPassword,
		validRootPassword
	};
};

import type { PageServerLoad } from './$types';
import { verify } from '@node-rs/argon2';
import { ARGON2_CONFIG } from '$lib/server/session';
import { env } from '$env/dynamic/private';

const hasRootPassword = env.ROOT_ADMIN_PASSWORD_HASH ? true : false;
const validRootPassword = hasRootPassword
	? await verify(env.ROOT_ADMIN_PASSWORD_HASH!, 'test', ARGON2_CONFIG)
			.then(() => true)
			.catch(() => false)
	: true;

export const load: PageServerLoad = async () => {
	return {
		hasRootPassword,
		validRootPassword
	};
};

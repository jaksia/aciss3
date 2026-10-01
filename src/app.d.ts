// See https://svelte.dev/docs/kit/types#app.d.ts

import type { SessionValidationResult } from '#lib/server/session.ts';

// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			session: SessionValidationResult['session'];
		}
	} // interface Error {}
	// interface Locals {}
} // interface PageData {}
// interface PageState {}

// interface Platform {}
export {};

import { resolve } from '$app/paths';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	redirect(302, resolve('/[eventId]/admin', { eventId: params.eventId }));
};

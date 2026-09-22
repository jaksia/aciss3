import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, params, parent }) => {
	const { event } = await parent();

	if (event.adminPasswordHash) {
		const session = locals.session;
		if (!session || !session.allowedEvents.some((e) => e === event.id)) {
			redirect(302, `/${params.eventId}/login`);
		}
	}

	return {};
};

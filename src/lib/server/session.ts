import type { RequestEvent } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase64url, encodeHexLowerCase } from '@oslojs/encoding';
import { db } from '$lib/server/db';
import * as schema from '$lib/server/db/schema';
import type { BaseSession, Event, Session } from '$lib/types';
import { socketCodeCookieName } from '$lib/state.svelte';

const DAY_IN_MS = 1000 * 60 * 60 * 24;
const SESSION_EXPIRATION_MS = DAY_IN_MS * 7;

export const ARGON2_CONFIG = {
	memoryCost: 19456,
	timeCost: 2,
	outputLen: 32,
	parallelism: 1
};

export const sessionCookieName = 'auth-session';

export function generateSessionToken() {
	const bytes = crypto.getRandomValues(new Uint8Array(24));
	const token = encodeBase64url(bytes);
	return token;
}

export async function createSession(token: string) {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const socketCode = encodeBase64url(crypto.getRandomValues(new Uint8Array(18)));

	const session: BaseSession = {
		id: sessionId,
		expiresAt: new Date(Date.now() + SESSION_EXPIRATION_MS),
		socketCodeHash: encodeHexLowerCase(sha256(new TextEncoder().encode(socketCode)))
	};
	await db.insert(schema.session).values(session);
	return { session, socketCode };
}

export async function validateSessionToken(token: string): Promise<{ session: Session | null }> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const session = await db.query.session.findFirst({
		where: {
			id: sessionId
		},
		with: {
			allowedEvents: {
				columns: {
					id: true
				}
			}
		}
	});

	if (!session) {
		return { session: null };
	}

	const sessionExpired = Date.now() >= session.expiresAt.getTime();
	if (sessionExpired) {
		await db.delete(schema.session).where(eq(schema.session.id, session.id));
		return { session: null };
	}

	const renewSession = Date.now() >= session.expiresAt.getTime() - SESSION_EXPIRATION_MS / 3;
	if (renewSession) {
		session.expiresAt = new Date(Date.now() + SESSION_EXPIRATION_MS);
		await db
			.update(schema.session)
			.set({ expiresAt: session.expiresAt })
			.where(eq(schema.session.id, session.id));
	}

	return {
		session: {
			...session,
			allowedEvents: session.allowedEvents.map((e) => e.id)
		}
	};
}

export async function validateSocketCode(
	socketCodeHash: string
): Promise<{ session: Session | null }> {
	const session = await db.query.session.findFirst({
		where: {
			socketCodeHash: socketCodeHash
		},
		with: {
			allowedEvents: true
		}
	});

	if (!session) {
		return { session: null };
	}

	const sessionExpired = Date.now() >= session.expiresAt.getTime();
	if (sessionExpired) {
		await db.delete(schema.session).where(eq(schema.session.id, session.id));
		return { session: null };
	}

	return {
		session: {
			...session,
			allowedEvents: session.allowedEvents.map((e) => e.id)
		}
	};
}

export type SessionValidationResult = Awaited<ReturnType<typeof validateSessionToken>>;

export async function addAllowedEventToSession(sessionId: Session['id'], eventId: Event['id']) {
	await db.insert(schema.sessionAllowedEvents).values({
		sessionId,
		eventId
	});
}

export async function removeAllowedEventFromSession(
	sessionId: Session['id'],
	eventId: Event['id']
) {
	await db
		.delete(schema.sessionAllowedEvents)
		.where(
			and(
				eq(schema.sessionAllowedEvents.sessionId, sessionId),
				eq(schema.sessionAllowedEvents.eventId, eventId)
			)
		);
}

export async function invalidateSession(sessionId: string) {
	await db.delete(schema.session).where(eq(schema.session.id, sessionId));
}

export function setSessionCookies(
	event: RequestEvent,
	token: string,
	socketCode: string | undefined,
	expiresAt: Date
) {
	event.cookies.set(sessionCookieName, token, {
		expires: expiresAt,
		path: '/'
	});
	if (socketCode) {
		event.cookies.set(socketCodeCookieName, socketCode, {
			expires: expiresAt,
			httpOnly: false,
			path: '/'
		});
	}
}

export function deleteSessionCookies(event: RequestEvent) {
	event.cookies.delete(sessionCookieName, {
		path: '/'
	});
	event.cookies.delete(socketCodeCookieName, {
		path: '/'
	});
}

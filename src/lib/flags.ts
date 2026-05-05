import { sql } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';

export enum Flag {
	/** Location defined in code, not editable in any way */
	STATIC = 1 << 0,
	/** Sound is default for new events */
	DEFAULT = 1 << 1,

	// ------------------------------
	//     ONLY GLOBAL SERVER
	// ------------------------------

	/** Is this sound/location shareable to other servers? */
	SHARED = 1 << 10,

	// ------------------------------
	//     ONLY LOCAL SERVERS
	// ------------------------------

	/** Is this item only visible on the local server (not shared to global server)? */
	LOCAL_ONLY = 1 << 20,
	/** Is this item imported from the global server? */
	FROM_GLOBAL = 1 << 21,
	/** Was this item uploaded to the global server? */
	UPLOADED = 1 << 22
}

export function hasFlagQ(column: PgColumn, flag: Flag) {
	return sql`${column} & ${flag} != 0`;
}

export function hasAllFlagsQ(column: PgColumn, ...flags: Flag[]) {
	const combinedFlags = flags.reduce((acc, flag) => acc | flag, 0);
	return sql`${column} & ${combinedFlags} = ${combinedFlags}`;
}

export function hasAnyFlagQ(column: PgColumn, ...flags: Flag[]) {
	const combinedFlags = flags.reduce((acc, flag) => acc | flag, 0);
	return sql`${column} & ${combinedFlags} != 0`;
}

type Flaggable = { flags: number };

export function hasFlag(item: Flaggable, flag: Flag) {
	return (item.flags & flag) !== 0;
}

export function hasAllFlags(item: Flaggable, ...flags: Flag[]) {
	const combinedFlags = flags.reduce((acc, flag) => acc | flag, 0);
	return (item.flags & combinedFlags) === combinedFlags;
}

export function hasAnyFlag(item: Flaggable, ...flags: Flag[]) {
	const combinedFlags = flags.reduce((acc, flag) => acc | flag, 0);
	return (item.flags & combinedFlags) !== 0;
}

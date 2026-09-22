import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { relations } from './relations';

export let db: PostgresJsDatabase<typeof relations> & {
	$client: postgres.Sql;
} = null as never;

export function initDB(db_url: string) {
	db = drizzle(db_url, { relations });
}

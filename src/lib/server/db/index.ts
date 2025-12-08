import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export let db: PostgresJsDatabase<typeof schema> & {
	$client: postgres.Sql<{}>;
} = null as any;

export function initDB(db_url: string) {
	const client = postgres(db_url);

	db = drizzle(client, { schema });
}

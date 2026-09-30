import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_p2P5zGTYAkqv@ep-morning-firefly-a1u1rq3i-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

// Disable prefetch for Neon serverless pooler compatibility
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
export { schema };

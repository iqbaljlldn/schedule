import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './server/database/schema.ts',
  out: './server/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_p2P5zGTYAkqv@ep-morning-firefly-a1u1rq3i-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
  }
});

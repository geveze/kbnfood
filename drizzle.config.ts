import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

// Production safety: prevent accidental destructive migrations
const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: connectionString,
  },
  // Strict mode to warn on dangerous operations
  strict: true,
  verbose: true,
  // Migration settings
  migrations: {
    prefix: "drizzle",
    table: "__drizzle_migrations__",
    schema: "public",
  },
});

// Production protection: warn about destructive operations
if (isProduction) {
  console.warn('[Drizzle] ⚠️  Production environment detected. Review all migrations carefully!');
  console.warn('[Drizzle] ⚠️  Destructive operations (DROP, ALTER) require explicit approval.');
}

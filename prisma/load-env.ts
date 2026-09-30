/**
 * Loads the project's .env for standalone scripts (e.g. `tsx prisma/seed.ts`).
 *
 * `next dev` and the Prisma CLI read .env automatically, but a plain `tsx`
 * process does not — which is why `npm run db:seed` failed with
 * "Environment variable not found: DATABASE_URL".
 *
 * Safety: scripts importing this refuse to run against any non-local database
 * unless ALLOW_REMOTE_DB=true is set explicitly for that one command, so a
 * local seed can never silently write to production Supabase.
 *
 * Import this FIRST, before @prisma/client.
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";

// npm scripts always run from the project root.
const envPath = resolve(process.cwd(), ".env");
// Existing shell variables win over .env (Node's default), so an exported
// DATABASE_URL would still be caught by the host check below.
if (existsSync(envPath)) process.loadEnvFile(envPath);

const raw = process.env.DATABASE_URL;
if (!raw) {
  console.error(`DATABASE_URL is not set (looked in ${envPath}).`);
  process.exit(1);
}

let url: URL;
try {
  url = new URL(raw);
} catch {
  console.error("DATABASE_URL is not a valid connection URL.");
  process.exit(1);
}

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
export const dbTarget = {
  host: url.hostname,
  port: url.port || "5432",
  database: url.pathname.replace(/^\//, ""),
  user: decodeURIComponent(url.username),
  isLocal: LOCAL_HOSTS.has(url.hostname),
};

// Printed without password or query secrets.
console.log(
  `Database target: host=${dbTarget.host} port=${dbTarget.port} db=${dbTarget.database} user=${dbTarget.user} (${dbTarget.isLocal ? "local" : "REMOTE"})`
);

if (!dbTarget.isLocal && process.env.ALLOW_REMOTE_DB !== "true") {
  console.error(
    "Refusing to run: DATABASE_URL points at a remote database. " +
      "If you really intend this (e.g. seeding production once), rerun with ALLOW_REMOTE_DB=true."
  );
  process.exit(1);
}

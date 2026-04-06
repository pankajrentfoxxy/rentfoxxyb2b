/**
 * Runs Prisma CLI with env vars from a chosen file (Prisma only auto-loads `.env`, not `.env.local`).
 *
 * Usage: node scripts/prisma-env.cjs <envFile> <prisma-args...>
 * Example: node scripts/prisma-env.cjs .env.local migrate status
 */
const path = require("path");
const { spawnSync } = require("child_process");
const dotenv = require("dotenv");

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error("Usage: node scripts/prisma-env.cjs <envFile> <prisma subcommand> [args...]");
  console.error("Example: node scripts/prisma-env.cjs .env.local migrate status");
  process.exit(1);
}

const envFile = args[0];
const prismaArgs = args.slice(1);

// Force this file to define DATABASE_URL / DIRECT_URL (root `.env` alone is not used by Next.js for Prisma scripts).
const loaded = dotenv.config({
  path: path.resolve(process.cwd(), envFile),
  override: true,
});
if (loaded.error) {
  console.error(`Could not load ${envFile}:`, loaded.error.message);
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error(`${envFile} must define DATABASE_URL for Prisma.`);
  process.exit(1);
}

const cmd = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(cmd, ["prisma", ...prismaArgs], {
  stdio: "inherit",
  env: process.env,
  shell: true,
});

process.exit(result.status === null ? 1 : result.status);

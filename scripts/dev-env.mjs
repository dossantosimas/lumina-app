import { randomBytes } from "node:crypto";
import { mkdir, writeFile, access } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const secret = () => randomBytes(32).toString("hex");
const port = process.env.LUMINA_DB_PORT ?? "55432";
if (!/^\d{4,5}$/.test(port) || Number(port) > 65535) throw new Error("Invalid local DB port");
const paths = [".env", ".runtime/docker.env", ".runtime/postgres-password", ".runtime/operator.env", ".runtime/migrator.env", ".runtime/test.env", ".runtime/test-operator.env", ".runtime/test-migrator.env"];
const existing = await Promise.all(paths.map(async (path) => {
  try { await access(resolve(root, path)); return true; } catch { return false; }
}));
if (existing.some(Boolean)) {
  if (existing.every(Boolean)) { console.log("Local environments already exist; credentials preserved."); process.exit(0); }
  throw new Error("Incomplete environment; preserve existing credentials and repair missing files manually.");
}
await mkdir(resolve(root, ".runtime"), { recursive: true });
const url = (role, password, database) => `postgresql://${role}:${password}@127.0.0.1:${port}/${database}`;
const authSecret = secret();
const testAuthSecret = secret();
const environment = (database, suffix = "") => {
  const appUrl = url(`${database}_app`, secret(), database);
  const operatorUrl = url(`${database}_operator`, secret(), database);
  const migratorUrl = url(`${database}_migrator`, secret(), database);
  const auth = suffix ? testAuthSecret : authSecret;
  return { appUrl, operatorUrl, migratorUrl, auth };
};
const dev = environment("lumina");
const test = environment("lumina_test", "test");
const runtime = (env, base) => `DATABASE_URL=${env.appUrl}\nBETTER_AUTH_SECRET=${env.auth}\nBETTER_AUTH_URL=${base}\nAPP_URL=${base}\n`;
const operator = (env, base) => `DATABASE_URL=${env.operatorUrl}\nDIRECT_URL=${env.operatorUrl}\nBETTER_AUTH_SECRET=${env.auth}\nBETTER_AUTH_URL=${base}\nAPP_URL=${base}\n`;
const files = {
  ".env": runtime(dev, "http://localhost:3000"),
  ".runtime/docker.env": `LUMINA_DB_PORT=${port}\n`,
  ".runtime/postgres-password": `${secret()}\n`,
  ".runtime/operator.env": operator(dev, "http://localhost:3000"),
  ".runtime/migrator.env": `DATABASE_URL=${dev.migratorUrl}\nDIRECT_URL=${dev.migratorUrl}\nAPP_DB_ROLE=lumina_app\nOPERATOR_DB_ROLE=lumina_operator\n`,
  ".runtime/test.env": `${runtime(test, "http://localhost:3001")}LUMINA_TEST_DATABASE_URL=${test.appUrl}\n`,
  ".runtime/test-operator.env": operator(test, "http://localhost:3001"),
  ".runtime/test-migrator.env": `DATABASE_URL=${test.migratorUrl}\nDIRECT_URL=${test.migratorUrl}\nAPP_DB_ROLE=lumina_test_app\nOPERATOR_DB_ROLE=lumina_test_operator\n`,
};
for (const [path, content] of Object.entries(files)) {
  await writeFile(resolve(root, path), content, { flag: "wx", mode: 0o600 });
}
console.log("Created ignored local runtime/operator/migrator/test environments. No credentials displayed.");

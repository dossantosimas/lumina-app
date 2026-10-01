import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { parse } from "dotenv";
import pg from "pg";

const root = fileURLToPath(new URL("../", import.meta.url));
const load = async (path) => parse(await readFile(resolve(root, path)));
const dockerEnv = await load(".runtime/docker.env");
const rootPassword = (await readFile(resolve(root, ".runtime/postgres-password"), "utf8")).trim();
const admin = new pg.Client({ host: "127.0.0.1", port: Number(dockerEnv.LUMINA_DB_PORT), user: "postgres", database: "postgres", password: rootPassword });
const roles = [];
for (const [path, database, role] of [
  [".env", "lumina", "lumina_app"],
  [".runtime/operator.env", "lumina", "lumina_operator"],
  [".runtime/migrator.env", "lumina", "lumina_migrator"],
  [".runtime/test.env", "lumina_test", "lumina_test_app"],
  [".runtime/test-operator.env", "lumina_test", "lumina_test_operator"],
  [".runtime/test-migrator.env", "lumina_test", "lumina_test_migrator"],
]) {
  const config = await load(path);
  const url = new URL(config.DATABASE_URL);
  if (url.hostname !== "127.0.0.1" || url.port !== dockerEnv.LUMINA_DB_PORT || url.pathname !== `/${database}` || url.username !== role || !/^[a-f0-9]{64}$/.test(url.password)) throw new Error("Expected generated isolated local credentials");
  roles.push({ database, role, password: url.password });
}
try {
  await admin.connect();
  for (const { role, password } of roles) {
    const exists = await admin.query("SELECT 1 FROM pg_roles WHERE rolname=$1", [role]);
    // Identifiers/passwords are restricted to generated, validated characters above.
    if (!exists.rowCount) await admin.query(`CREATE ROLE "${role}" LOGIN PASSWORD '${password}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION`);
  }
  for (const database of ["lumina", "lumina_test"]) {
    const exists = await admin.query("SELECT 1 FROM pg_database WHERE datname=$1", [database]);
    if (!exists.rowCount) await admin.query(`CREATE DATABASE "${database}" OWNER "${database}_migrator"`);
    await admin.query(`REVOKE ALL ON DATABASE "${database}" FROM PUBLIC`);
    await admin.query(`GRANT CONNECT ON DATABASE "${database}" TO "${database}_app", "${database}_operator"`);
    const dbAdmin = new pg.Client({ host: "127.0.0.1", port: Number(dockerEnv.LUMINA_DB_PORT), user: "postgres", database, password: rootPassword });
    try {
      await dbAdmin.connect();
      await dbAdmin.query("REVOKE ALL ON SCHEMA public FROM PUBLIC");
      await dbAdmin.query(`ALTER SCHEMA public OWNER TO "${database}_migrator"`);
      await dbAdmin.query(`GRANT USAGE ON SCHEMA public TO "${database}_app", "${database}_operator"`);
    } finally { await dbAdmin.end(); }
  }
  console.log("Isolated local databases and least-privilege role boundaries ready; table grants follow migrations.");
} catch {
  console.error("Local database bootstrap failed. Check Docker health and ignored environment files; secrets withheld.");
  process.exitCode = 1;
} finally { await admin.end(); }

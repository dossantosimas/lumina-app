import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {parse} from 'dotenv';
import pg from 'pg';
const target='lumina_initial_setup_e2e';
const docker=parse(readFileSync('.runtime/docker.env'));
const adminConfig={host:'127.0.0.1',port:Number(docker.LUMINA_DB_PORT),user:'postgres',password:readFileSync('.runtime/postgres-password','utf8').trim()};
const admin=new pg.Client({...adminConfig,database:'postgres'});
let created=false;let database;
function run(args,env){const result=spawnSync(process.execPath,args,{env:{...process.env,...env},stdio:'inherit'});if(result.status!==0)throw new Error('Initial setup QA child command failed');}
try {
 await admin.connect();
 if((await admin.query('SELECT 1 FROM pg_database WHERE datname=$1',[target])).rowCount)throw new Error('Isolated QA DB exists; refusing overwrite');
 await admin.query(`CREATE DATABASE ${target} OWNER lumina_test_migrator`);created=true;
 database=new pg.Client({...adminConfig,database:target});await database.connect();
 await database.query('ALTER SCHEMA public OWNER TO lumina_test_migrator; REVOKE ALL ON SCHEMA public FROM PUBLIC; SET ROLE lumina_test_migrator');
 for(const name of readdirSync('prisma/migrations').filter(v=>/^\d/.test(v)).sort())await database.query(readFileSync(`prisma/migrations/${name}/migration.sql`,'utf8'));
 await database.query('RESET ROLE');await database.query(`REVOKE ALL ON DATABASE ${target} FROM PUBLIC; GRANT CONNECT ON DATABASE ${target} TO lumina_test_app,lumina_test_operator,lumina_test_migrator`);
 const env=parse(readFileSync('.runtime/test.env'));
 const runtimeURL=new URL(env.DATABASE_URL);if(runtimeURL.pathname!=='/lumina_test'||runtimeURL.hostname!=='127.0.0.1')throw new Error('Isolated local template required');runtimeURL.pathname=`/${target}`;
 const migrator=parse(readFileSync('.runtime/test-migrator.env'));const migrationURL=new URL(migrator.DIRECT_URL);migrationURL.pathname=`/${target}`;
 run(['node_modules/tsx/dist/cli.mjs','scripts/grants.ts'],{DIRECT_URL:migrationURL.href,APP_DB_ROLE:'lumina_test_app',OPERATOR_DB_ROLE:'lumina_test_operator'});
 const testEnv={DATABASE_URL:runtimeURL.href,BETTER_AUTH_SECRET:randomBytes(32).toString('hex'),BETTER_AUTH_URL:'http://localhost:3002',APP_URL:'http://localhost:3002',QA_SETUP_PASSWORD:randomBytes(24).toString('hex')};
 writeFileSync('.runtime/initial-setup-e2e.env',Object.entries(testEnv).map(([k,v])=>`${k}=${v}`).join('\n')+'\n');
 run(['node_modules/@playwright/test/cli.js','test','--config=playwright.initial-setup.config.ts'],testEnv);
 console.log('Initial setup browser QA PASS; isolated database only.');
} finally {
 await database?.end();if(created)await admin.query(`DROP DATABASE IF EXISTS ${target} WITH (FORCE)`);await admin.end();
}

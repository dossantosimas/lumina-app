import {beforeAll,afterAll,describe,it,expect,vi} from 'vitest';
import {readFileSync,readdirSync} from 'node:fs';
import {parse} from 'dotenv';
import pg from 'pg';
import {hashPassword} from 'better-auth/crypto';
import {createDatabase} from '@/server/db';
import {initialSetupAvailable,provisionInitialOwner,localSetupOrigin} from '@/server/initial-setup-service';
import type {PrismaClient} from '@/generated/prisma/client';
const request=vi.hoisted(()=>({value:new Headers({origin:'http://localhost:3001',host:'localhost:3001'})}));
vi.mock('next/headers',()=>({headers:async()=>request.value}));
import {createInitialOwner} from '@/server/initial-setup';
import {getAuth} from '@/server/auth';
const target='lumina_initial_setup_test';
const config=parse(readFileSync('.runtime/docker.env'));
const adminConfig={host:'127.0.0.1',port:Number(config['LUMINA_DB_PORT']),user:'postgres',password:readFileSync('.runtime/postgres-password','utf8').trim()};
const admin=new pg.Client({...adminConfig,database:'postgres'});
let runtime:PrismaClient;let privileged:pg.Client;let createdDatabase=false;
const payload={name:'Dueño inicial sintético',email:'initial-owner@example.test',password:'SyntheticInitialPass2026!',passwordConfirmation:'SyntheticInitialPass2026!'};
beforeAll(async()=>{
 await admin.connect();
 if((await admin.query('SELECT 1 FROM pg_database WHERE datname=$1',[target])).rowCount)throw new Error('Isolated setup test database already exists; refusing to overwrite');
 await admin.query(`CREATE DATABASE ${target} OWNER lumina_test_migrator`);
 createdDatabase=true;
 privileged=new pg.Client({...adminConfig,database:target});await privileged.connect();
 await privileged.query('ALTER SCHEMA public OWNER TO lumina_test_migrator; REVOKE ALL ON SCHEMA public FROM PUBLIC; SET ROLE lumina_test_migrator');
 for(const name of readdirSync('prisma/migrations').filter(v=>/^\d/.test(v)).sort())await privileged.query(readFileSync(`prisma/migrations/${name}/migration.sql`,'utf8'));
 await privileged.query('RESET ROLE');
 await privileged.query(`REVOKE ALL ON DATABASE ${target} FROM PUBLIC; GRANT CONNECT ON DATABASE ${target} TO lumina_test_app; GRANT USAGE ON SCHEMA public TO lumina_test_app; GRANT SELECT ON public."user",public.account TO lumina_test_app; GRANT SELECT,INSERT,UPDATE,DELETE ON public."session",public.verification,public."rateLimit" TO lumina_test_app; GRANT EXECUTE ON FUNCTION public.initial_owner_available(),public.reserve_initial_owner_attempt(),public.create_initial_owner(text,text,text,text) TO lumina_test_app`);
 const url=new URL(process.env['DATABASE_URL']!);url.pathname=`/${target}`;runtime=createDatabase(url.toString());
});
afterAll(async()=>{
 await runtime?.$disconnect();await privileged?.end();
 if(createdDatabase)await admin.query(`DROP DATABASE IF EXISTS ${target} WITH (FORCE)`);await admin.end();
});
describe('first owner, isolated real PostgreSQL',()=>{
 it('Server Action refuses absent/external host and discrepant proxy headers before touching identities',async()=>{
  const invalidHeaders:Record<string,string>[]=[{origin:'http://localhost:3001'},{origin:'http://localhost:3001',host:'evil.example'},{origin:'http://localhost:3001',host:'localhost:3001','x-forwarded-host':'evil.example'},{origin:'http://localhost:3001',host:'localhost:3001','x-forwarded-proto':'https'}];
  for(const fields of invalidHeaders){
   request.value=new Headers(fields);expect((await createInitialOwner(payload)).code).toBe('UNAVAILABLE');
  }
  request.value=new Headers({origin:'http://localhost:3001',host:'localhost:3001'});
  expect(await runtime.user.count()).toBe(0);
 });
 it('rejects public environments, missing/foreign origins, unknown admission fields and mismatch without identities',async()=>{
  expect(localSetupOrigin('https://lumina.example')).toBeNull();expect(localSetupOrigin('http://localhost:3001')).toBe('http://localhost:3001');
  expect((await provisionInitialOwner(payload,null,'http://localhost:3001',runtime)).code).toBe('UNAVAILABLE');
  expect((await provisionInitialOwner(payload,'https://evil.example','http://localhost:3001',runtime)).code).toBe('UNAVAILABLE');
  expect((await provisionInitialOwner(payload,'https://lumina.example','https://lumina.example',runtime)).code).toBe('UNAVAILABLE');
  expect((await provisionInitialOwner({...payload,activeAccess:true},'http://localhost:3001','http://localhost:3001',runtime)).code).toBe('INVALID');
  expect((await provisionInitialOwner({...payload,passwordConfirmation:'DifferentPassword!'},'http://localhost:3001','http://localhost:3001',runtime)).code).toBe('INVALID');
  expect(await runtime.user.count()).toBe(0);
 });
 it('exactly one simultaneous creator wins atomically with a Better Auth usable password; direct signup remains denied',async()=>{
  expect(await initialSetupAvailable(runtime)).toBe(true);
  const result=await Promise.all([provisionInitialOwner(payload,'http://localhost:3001','http://localhost:3001',runtime),provisionInitialOwner({...payload,email:'second@example.test'},'http://localhost:3001','http://localhost:3001',runtime)]);
  expect(result.filter(v=>v.ok)).toHaveLength(1);expect(await runtime.user.count()).toBe(1);expect(await runtime.account.count()).toBe(1);
  const owner=await runtime.user.findFirstOrThrow();expect(owner.activeAccess).toBe(true);
  // Same library options/adapter as web auth, restricted DB and official login API.
  const {betterAuth}=await import('better-auth');const {prismaAdapter}=await import('better-auth/adapters/prisma');
  const auth=betterAuth({...getAuth().options,database:prismaAdapter(runtime,{provider:'postgresql'}),databaseHooks:{session:{create:{before:async session=>{const u=await runtime.user.findUnique({where:{id:session.userId}});return u?.activeAccess?{data:session}:false;}}}}});
  const login=await auth.api.signInEmail({body:{email:owner.email,password:payload.password}});expect(login.user.id).toBe(owner.id);
  await expect(auth.api.signUpEmail({body:{name:'Denied',email:'denied@example.test',password:payload.password}})).rejects.toThrow();
  expect(await initialSetupAvailable(runtime)).toBe(false);
  expect((await provisionInitialOwner(payload,'http://localhost:3001','http://localhost:3001',runtime)).code).toBe('CLOSED');
  await privileged.query('UPDATE public."user" SET "activeAccess"=false; DELETE FROM public."user"');
  expect(await initialSetupAvailable(runtime)).toBe(false);
 });
 it('any CLI identity, even inactive, closes the latch and deletion never reopens it',async()=>{
  // Isolated fixture reset by DB admin, never available to runtime/operator/web.
  await privileged.query('UPDATE public.initial_owner_setup SET closed=false,attempts=0');
  await privileged.query('INSERT INTO public."user"(id,name,email,"updatedAt") VALUES($1,$2,$3,now())',['cli-inactive','CLI fixture','cli@example.test']);
  expect(await initialSetupAvailable(runtime)).toBe(false);
  await privileged.query('DELETE FROM public."user"');expect(await initialSetupAvailable(runtime)).toBe(false);
 });
 it('runtime cannot change the latch/user/account, PUBLIC cannot execute any setup function and partial insert fails atomically',async()=>{
  for(const statement of ['UPDATE public.initial_owner_setup SET closed=false','UPDATE public."user" SET "activeAccess"=true','INSERT INTO public.account DEFAULT VALUES'])await expect(runtime.$executeRawUnsafe(statement)).rejects.toThrow();
  const acl=await privileged.query(`SELECT count(*)::int AS count FROM pg_proc p CROSS JOIN LATERAL aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a WHERE p.proname IN ('create_initial_owner','initial_owner_available','reserve_initial_owner_attempt','close_initial_owner_setup') AND a.grantee=0 AND a.privilege_type='EXECUTE'`);expect(acl.rows[0].count).toBe(0);
  await privileged.query('UPDATE public.initial_owner_setup SET closed=false,attempts=0');
  await privileged.query(`CREATE FUNCTION public.qa_fail_initial_account() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Synthetic account failure'; END $$; CREATE TRIGGER qa_fail_initial_account BEFORE INSERT ON public.account FOR EACH ROW EXECUTE FUNCTION public.qa_fail_initial_account()`);
  expect((await provisionInitialOwner(payload,'http://localhost:3001','http://localhost:3001',runtime)).code).toBe('UNAVAILABLE');
  expect(await runtime.user.count()).toBe(0);expect(await runtime.account.count()).toBe(0);expect(await initialSetupAvailable(runtime)).toBe(true);
  await privileged.query('DROP TRIGGER qa_fail_initial_account ON public.account; DROP FUNCTION public.qa_fail_initial_account()');
 });
 it('serializes a CLI insert competing with setup and limits expensive attempts',async()=>{
  await privileged.query('UPDATE public.initial_owner_setup SET closed=false,attempts=0,attempt_window=now()');
  for(let i=0;i<5;i++)expect((await runtime.$queryRaw<{reserved:boolean}[]>`SELECT public.reserve_initial_owner_attempt() AS reserved`)[0]?.reserved).toBe(true);
  expect((await runtime.$queryRaw<{reserved:boolean}[]>`SELECT public.reserve_initial_owner_attempt() AS reserved`)[0]?.reserved).toBe(false);
  const hash=await hashPassword(payload.password);
  const race=await Promise.allSettled([runtime.$queryRaw<{created:boolean}[]>`SELECT public.create_initial_owner('bootstrap-race','Web race','web-race@example.test',${hash}) AS created`,privileged.query('INSERT INTO public."user"(id,name,email,"updatedAt") VALUES($1,$2,$3,now())',['cli-race','CLI race','cli-race@example.test'])]);
  expect(race.every(v=>v.status==='fulfilled')).toBe(true);
  const first=race[0];if(first?.status==='fulfilled')expect(await runtime.user.count()).toBe((first.value as {created:boolean}[])[0]?.created?2:1);
  expect(await initialSetupAvailable(runtime)).toBe(false);
 });
});

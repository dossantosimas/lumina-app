import {beforeAll,afterAll,describe,it,expect,vi} from 'vitest';
import {readFileSync,readdirSync} from 'node:fs';
import {parse} from 'dotenv';
import pg from 'pg';
import {registerOwner,registrationOrigin} from '@/server/registration-service';
import {createDatabase} from '@/server/db';
import {initialSetupAvailable} from '@/server/initial-setup-service';
import type {PrismaClient} from '@/generated/prisma/client';
const request=vi.hoisted(()=>({value:new Headers({origin:'http://localhost:3001',host:'localhost:3001'})}));
vi.mock('next/headers',()=>({headers:async()=>request.value}));
import {registerAccount} from '@/server/registration';
import {getAuth} from '@/server/auth';
const target='lumina_registration_test';
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
 await privileged.query(`REVOKE ALL ON DATABASE ${target} FROM PUBLIC; GRANT CONNECT ON DATABASE ${target} TO lumina_test_app; GRANT USAGE ON SCHEMA public TO lumina_test_app; GRANT SELECT ON public."user",public.account TO lumina_test_app; GRANT SELECT,INSERT,UPDATE,DELETE ON public."session",public.verification,public."rateLimit" TO lumina_test_app; GRANT EXECUTE ON FUNCTION public.initial_owner_available(),public.reserve_public_registration_attempt(),public.register_owner_account(text,text,text,text),public.lock_active_owner(text) TO lumina_test_app`);
 const url=new URL(process.env['DATABASE_URL']!);url.pathname=`/${target}`;runtime=createDatabase(url.toString());
});
afterAll(async()=>{
 await runtime?.$disconnect();await privileged?.end();
 if(createdDatabase)await admin.query(`DROP DATABASE IF EXISTS ${target} WITH (FORCE)`);await admin.end();
});

describe('public registration, isolated PostgreSQL',()=>{
 it('validates origin, canonical HTTPS and rejects admission fields, mismatch and foreign host',async()=>{
  expect(registrationOrigin('https://lumina.example')).toBe('https://lumina.example');
  expect(registrationOrigin('http://public.example')).toBeNull();
  expect(registrationOrigin('https://lumina.example/')).toBeNull();
  expect((await registerOwner(payload,null,'https://lumina.example',runtime)).code).toBe('UNAVAILABLE');
  expect((await registerOwner({...payload,activeAccess:true},'https://lumina.example','https://lumina.example',runtime)).code).toBe('INVALID');
  expect((await registerOwner({...payload,passwordConfirmation:'MismatchPassword2026'},'https://lumina.example','https://lumina.example',runtime)).code).toBe('INVALID');
  const badHeaders:Record<string,string>[]=[{host:'evil.example',origin:'http://localhost:3001'},{host:'localhost:3001',origin:'http://localhost:3001','x-forwarded-host':'evil.example'},{host:'localhost:3001',origin:'http://localhost:3001','x-forwarded-proto':'https'}];
  for(const fields of badHeaders){request.value=new Headers(fields);expect((await registerAccount(payload)).code).toBe('UNAVAILABLE');}
  expect(await runtime.user.count()).toBe(0);
 });
 it('creates multiple active owners without invitations, usable Better Auth login and closed bootstrap',async()=>{
  for(const email of ['public-first@example.test','public-second@example.test']){
   expect((await registerOwner({...payload,email},'https://lumina.example','https://lumina.example',runtime)).ok).toBe(true);
   const owner=await runtime.user.findUniqueOrThrow({where:{email}});expect(owner.activeAccess).toBe(true);
   const {betterAuth}=await import('better-auth');const {prismaAdapter}=await import('better-auth/adapters/prisma');
   const auth=betterAuth({...getAuth().options,database:prismaAdapter(runtime,{provider:'postgresql'}),databaseHooks:{session:{create:{before:async session=>{const u=await runtime.user.findUnique({where:{id:session.userId}});return u?.activeAccess?{data:session}:false;}}}}});
   expect((await auth.api.signInEmail({body:{email,password:payload.password}})).user.id).toBe(owner.id);
   await expect(auth.api.signUpEmail({body:{name:'Denied',email:'generic@example.test',password:payload.password}})).rejects.toThrow();
  }
  expect(await runtime.user.count()).toBe(2);expect(await runtime.account.count()).toBe(2);expect(await initialSetupAvailable(runtime)).toBe(false);
 });
 it('concurrent duplicate email has one complete account and one rejection',async()=>{
  await privileged.query('UPDATE public.public_registration_limit SET attempts=0,attempt_window=now()');
  const results=await Promise.all([1,2].map(()=>registerOwner({...payload,email:'same@example.test'},'https://lumina.example','https://lumina.example',runtime)));
  expect(results.filter(r=>r.ok)).toHaveLength(1);expect(await runtime.user.count()).toBe(3);expect(await runtime.account.count()).toBe(3);
 });
 it('rolls back identity on account failure and retains least privilege/Public denial',async()=>{
  await privileged.query(`CREATE FUNCTION public.qa_fail_public_account() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Synthetic account failure'; END $$; CREATE TRIGGER qa_fail_public_account BEFORE INSERT ON public.account FOR EACH ROW EXECUTE FUNCTION public.qa_fail_public_account()`);
  try{expect((await registerOwner({...payload,email:'rollback@example.test'},'https://lumina.example','https://lumina.example',runtime)).ok).toBe(false);expect(await runtime.user.count()).toBe(3);expect(await runtime.account.count()).toBe(3);}
  finally{await privileged.query('DROP TRIGGER qa_fail_public_account ON public.account; DROP FUNCTION public.qa_fail_public_account()');}
  for(const sql of ['UPDATE public.public_registration_limit SET attempts=0','INSERT INTO public."user" DEFAULT VALUES','UPDATE public.account SET password=\'invalid\''])await expect(runtime.$executeRawUnsafe(sql)).rejects.toThrow();
  const acl=await privileged.query(`SELECT count(*)::int count FROM pg_proc p CROSS JOIN LATERAL aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a WHERE p.proname IN ('reserve_public_registration_attempt','register_owner_account') AND a.grantee=0 AND a.privilege_type='EXECUTE'`);expect(acl.rows[0].count).toBe(0);
 });
 it('global persistent bucket admits five attempts and rejects sixth before hashing',async()=>{
  await privileged.query('UPDATE public.public_registration_limit SET attempts=0,attempt_window=now()');
  for(let i=0;i<5;i++)expect((await runtime.$queryRaw<{reserved:boolean}[]>`SELECT public.reserve_public_registration_attempt() AS reserved`)[0]?.reserved).toBe(true);
  expect((await registerOwner({...payload,email:'limited@example.test'},'https://lumina.example','https://lumina.example',runtime)).code).toBe('UNAVAILABLE');
  expect(await runtime.user.count()).toBe(3);
 });
});

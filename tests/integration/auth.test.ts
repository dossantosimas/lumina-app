import {beforeAll,afterAll,it,expect,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import setup from '../support/e2e-setup';
import {migrator,testEnvironment} from '../support/database';
import {createDatabase} from '@/server/db';
import {createOperator} from '../../scripts/auth-operator';
import {randomUUID,randomBytes} from 'node:crypto';
import {getAuth,requireOwner} from '@/server/auth';
import {queryAction,mutationAction} from '@/server/actions';
import {POST,GET} from '@/app/api/auth/[...all]/route';
const state=vi.hoisted(()=>({headers:new Headers()}));
vi.mock('next/headers',()=>({headers:async()=>state.headers}));
let accounts:{id:string;email:string;password:string}[]=[];
beforeAll(async()=>{await setup();accounts=JSON.parse(readFileSync('.runtime/qa-account.json','utf8'));});
afterAll(async()=>{await migrator.session.deleteMany({where:{userId:{in:accounts.map(a=>a.id)}}});await migrator.account.deleteMany({where:{userId:{in:accounts.map(a=>a.id)}}});await migrator.user.deleteMany({where:{id:{in:accounts.map(a=>a.id)}}});await migrator.$disconnect();});
it('real auth rejects anonymous direct actions with zero data AC-013 NFR-002',async()=>{
 state.headers=new Headers();
 expect(await queryAction('clients.list',{})).toMatchObject({ok:false,error:{code:'UNAUTHENTICATED'}});
 expect(await mutationAction('clients.create',{name:'Unauthorized',idempotencyKey:crypto.randomUUID()})).toMatchObject({ok:false,error:{code:'UNAUTHENTICATED'}});
});
it('auth allowlist denies public registration, account changes, recovery, linking and method variants',async()=>{
 for(const path of ['sign-up/email','update-user','request-password-reset','reset-password','change-email','change-password','link-social','delete-user']){
  const r=await POST(new Request(`http://localhost:3001/api/auth/${path}`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}));expect(r.status).toBe(404);
 }
 expect((await GET(new Request('http://localhost:3001/api/auth/sign-in/email'))).status).toBe(404);
});
it('real session admits owner, then revocation blocks session and direct queries',async()=>{
 const account=accounts[0]!;
 const response=await getAuth().handler(new Request('http://localhost:3001/api/auth/sign-in/email',{method:'POST',headers:{'Content-Type':'application/json',origin:'http://localhost:3001'},body:JSON.stringify({email:account.email,password:account.password})}));
 expect(response.status).toBe(200);
 state.headers=new Headers({cookie:response.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ')});
 expect((await requireOwner()).id).toBe(account.id);
 expect(await queryAction('clients.list',{})).toMatchObject({ok:true});
 await migrator.$transaction(async tx=>{await tx.$queryRaw`SELECT id FROM "user" WHERE id=${account.id} FOR UPDATE`;await tx.user.update({where:{id:account.id},data:{activeAccess:false}});await tx.session.deleteMany({where:{userId:account.id}});});
 expect(await queryAction('clients.list',{})).toMatchObject({ok:false,error:{code:'UNAUTHENTICATED'}});
 expect((await getAuth().handler(new Request('http://localhost:3001/api/auth/sign-in/email',{method:'POST',headers:{'Content-Type':'application/json',origin:'http://localhost:3001'},body:JSON.stringify({email:account.email,password:account.password})}))).status).toBeGreaterThanOrEqual(400);
});
it('actual operator provisions, resets password, invalidates old sessions and revokes admission',async()=>{
 const env=testEnvironment('.runtime/test-operator.env');const operatorDB=createDatabase(env['DATABASE_URL']!);const operator=createOperator(operatorDB,env['BETTER_AUTH_SECRET']!,env['BETTER_AUTH_URL']!);
 const email=`operator-${randomUUID()}@example.test`;const password=randomBytes(24).toString('base64url');const replacement=randomBytes(24).toString('base64url');
 try{
  await operator.provision('Dueño operador sintético',email,password);const user=await migrator.user.findUniqueOrThrow({where:{email}});accounts.push({id:user.id,email,password});expect(user.activeAccess).toBe(true);
  const first=await getAuth().api.signInEmail({body:{email,password},asResponse:true});expect(first.status).toBe(200);const oldHeaders=new Headers({cookie:first.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ')});state.headers=oldHeaders;expect((await requireOwner()).id).toBe(user.id);
  await operator.reset(email,replacement);expect(await getAuth().api.getSession({headers:oldHeaders})).toBeNull();expect((await getAuth().api.signInEmail({body:{email,password},asResponse:true})).status).toBeGreaterThanOrEqual(400);
  const second=await getAuth().api.signInEmail({body:{email,password:replacement},asResponse:true});expect(second.status).toBe(200);state.headers=new Headers({cookie:second.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ')});expect((await requireOwner()).id).toBe(user.id);
  await operator.revoke(email);expect(await queryAction('clients.list',{})).toMatchObject({ok:false,error:{code:'UNAUTHENTICATED'}});expect((await migrator.user.findUniqueOrThrow({where:{id:user.id}})).activeAccess).toBe(false);
 }finally{await operatorDB.$disconnect();}
});

import {beforeAll,beforeEach,afterAll,describe,it,expect} from 'vitest';
import {randomUUID} from 'node:crypto';
import {db} from '@/server/db';
import {mutateForActor} from '@/server/domain';
import {queryForActor} from '@/server/queries';
import {migrator,clearDomain,sqlAdmin} from '../support/database';
import type {MutationOperation} from '@/lib/contracts';
const actor=randomUUID();const actor2=randomUUID();
const key=()=>randomUUID();
const mutate=(op:MutationOperation,input:object,owner=actor)=>mutateForActor(owner,op,input);
const client=()=>mutate('clients.create',{name:'Cliente sintético QA',contact:'CONTACT_PRIVATE_MARKER',notes:'NOTES_PRIVATE_MARKER',idempotencyKey:key()});
const order=(customerId:string)=>({customerId,orderDate:'2026-09-30',notes:'NOTES_PRIVATE_MARKER',lines:[{description:'Vainilla',quantity:2,unitPrice:'25000.00'},{description:'Lavanda',quantity:1,unitPrice:'35000.00'}],idempotencyKey:key()});
beforeAll(async()=>{
 for(const id of [actor,actor2])await migrator.user.create({data:{id,name:'Dueño QA sintético',email:`${id}@example.test`,emailVerified:true,activeAccess:true}});
});
beforeEach(clearDomain);
afterAll(async()=>{await clearDomain();await migrator.user.deleteMany({where:{id:{in:[actor,actor2]}}});await db.$disconnect();await migrator.$disconnect();});
describe('PostgreSQL domain integrity REQ-001..008',()=>{
 it('shared owners read historical archived customers and inclusive dashboard totals AC-005/008/009',async()=>{
  const customer=await client();const first=await mutate('orders.create',{...order(customer.id),lines:[{description:'Total',quantity:1,unitPrice:'100000'}]});
  const excluded=await mutate('orders.create',order(customer.id));await mutate('orders.archive',{id:excluded.id,expectedVersion:1,idempotencyKey:key()});
  await mutate('expenses.create',{expenseDate:'2026-09-30',concept:'Materiales',amount:'30000',idempotencyKey:key()});
  await mutate('expenses.create',{expenseDate:'2026-10-01',concept:'Otro mes',amount:'100',idempotencyKey:key()});
  await mutate('clients.archive',{id:customer.id,expectedVersion:1,idempotencyKey:key()});
  expect(await queryForActor(actor2,'clients.get',{id:customer.id})).toMatchObject({id:customer.id,archived:true});
  expect(await queryForActor(actor2,'orders.get',{id:first.id})).toMatchObject({customerNameSnapshot:'Cliente sintético QA',customerArchived:true,total:'100000.00'});
  expect(await queryForActor(actor2,'orders.list',{customerId:customer.id,archived:'all'})).toMatchObject({total:2});
  expect(await queryForActor(actor2,'dashboard.summary',{from:'2026-09-01',to:'2026-09-30'})).toMatchObject({totalOrders:'100000.00',totalExpenses:'30000.00',difference:'70000.00',counts:{orders:1,expenses:1}});
  await expect(queryForActor('unknown-owner','clients.list',{})).rejects.toMatchObject({code:'FORBIDDEN'});
 });
 it('persists a multiline 85000 COP order, dates and one entire invoice with no optional data AC-001/002/003/006/007',async()=>{
  const customer=await client();const receipt=await mutate('orders.create',order(customer.id));
  const persisted=await db.salesOrder.findUniqueOrThrow({where:{id:receipt.id},include:{lines:true}});
  expect(persisted.total.toFixed(2)).toBe('85000.00');expect(persisted.lines).toHaveLength(2);
  expect(persisted.orderDate.toISOString().slice(0,10)).toBe('2026-09-30');
  const expense=await mutate('expenses.create',{expenseDate:'2026-09-30',concept:'Factura materiales',amount:'120000',idempotencyKey:key()},actor2);
  expect(await db.expense.findUnique({where:{id:expense.id}})).toMatchObject({supplier:null,invoiceReference:null});
  expect(expense.total).toBe('120000.00');
 });
 it('one simultaneous intention produces one result, one audit and detects payload mismatch NFR-004',async()=>{
  const payload={name:'Una intención',idempotencyKey:key()};
  const receipts=await Promise.all([mutate('clients.create',payload),mutate('clients.create',payload)]);
  expect(receipts[0]).toEqual(receipts[1]);expect(await db.customer.count()).toBe(1);expect(await db.auditEvent.count()).toBe(1);
  await expect(mutate('clients.create',{...payload,name:'Otro payload'})).rejects.toMatchObject({code:'IDEMPOTENCY_MISMATCH'});
 });
 it('only one editor wins a version; replay returns the original receipt NFR-003',async()=>{
  const customer=await client();const a={id:customer.id,expectedVersion:1,name:'Editor A',idempotencyKey:key()};
  const b={...a,name:'Editor B',idempotencyKey:key()};const results=await Promise.allSettled([mutate('clients.update',a),mutate('clients.update',b)]);
  expect(results.filter(v=>v.status==='fulfilled')).toHaveLength(1);
  expect(results.find(v=>v.status==='rejected')).toMatchObject({reason:{code:'CONFLICT'}});
  const winning=results[0]?.status==='fulfilled'?a:b;const first=await mutate('clients.update',winning);
  expect(first.version).toBe(2);expect(await db.auditEvent.count()).toBe(2);
 });
 it('preserves old name, permits same archived customer edit/restore and rejects a new order AC-008/014/015',async()=>{
  const customer=await client();const input=order(customer.id);const sale=await mutate('orders.create',input);
  await mutate('clients.update',{id:customer.id,expectedVersion:1,name:'Nombre nuevo',idempotencyKey:key()});
  await mutate('clients.archive',{id:customer.id,expectedVersion:2,idempotencyKey:key()});
  await expect(mutate('orders.create',order(customer.id))).rejects.toMatchObject({code:'CONFLICT'});
  const edited=await mutate('orders.update',{...input,id:sale.id,expectedVersion:1,idempotencyKey:key()});
  expect((await db.salesOrder.findUniqueOrThrow({where:{id:sale.id}})).customerNameSnapshot).toBe('Cliente sintético QA');
  const archived=await mutate('orders.archive',{id:sale.id,expectedVersion:edited.version,idempotencyKey:key()});
  await expect(mutate('orders.update',{...input,id:sale.id,expectedVersion:archived.version,idempotencyKey:key()})).rejects.toMatchObject({code:'CONFLICT'});
  const restored=await mutate('orders.restore',{id:sale.id,expectedVersion:archived.version,idempotencyKey:key()});
  expect(restored.archived).toBe(false);expect(await db.auditEvent.count({where:{entityId:sale.id}})).toBe(4);
 });
 it('rejects invalid expenses and money overflow with no business/audit/idempotency partial rows AC-010/011',async()=>{
  const customer=await client();const baseline=await db.idempotencyRecord.count();
  await expect(mutate('orders.create',{...order(customer.id),lines:[{description:'Grande',quantity:10000,unitPrice:'999999999999.99'}]})).rejects.toMatchObject({code:'VALIDATION'});
  await expect(mutate('expenses.create',{expenseDate:'2026-02-29',concept:' ',amount:'0',idempotencyKey:key()})).rejects.toMatchObject({code:'VALIDATION'});
  expect(await db.salesOrder.count()).toBe(0);expect(await db.expense.count()).toBe(0);expect(await db.idempotencyRecord.count()).toBe(baseline);expect(await db.auditEvent.count()).toBe(1);
 });
 it('a DB failure during line creation rolls back header, audit and idempotency INV-A05',async()=>{
  const customer=await client();const baseline=await db.idempotencyRecord.count();
  await sqlAdmin(c=>c.query(`CREATE FUNCTION qa_fail_line() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.description='QA_FORCED_FAILURE' THEN RAISE EXCEPTION 'Synthetic QA failure'; END IF; RETURN NEW; END $$; CREATE TRIGGER qa_line_failure BEFORE INSERT ON sales_order_lines FOR EACH ROW EXECUTE FUNCTION qa_fail_line()`));
  try{
   await expect(mutate('orders.create',{...order(customer.id),lines:[{description:'QA_FORCED_FAILURE',quantity:1,unitPrice:'1'}]})).rejects.toThrow();
   expect(await db.salesOrder.count()).toBe(0);expect(await db.salesOrderLine.count()).toBe(0);expect(await db.auditEvent.count()).toBe(1);expect(await db.idempotencyRecord.count()).toBe(baseline);
  }finally{await sqlAdmin(c=>c.query('DROP TRIGGER IF EXISTS qa_line_failure ON sales_order_lines; DROP FUNCTION IF EXISTS qa_fail_line()'));}
 });
 it('audit and replay do not contain contacts or notes, and app cannot alter audit',async()=>{
  await client();const raw=JSON.stringify({audit:await db.auditEvent.findMany(),replay:await db.idempotencyRecord.findMany()});
  expect(raw).not.toContain('CONTACT_PRIVATE_MARKER');expect(raw).not.toContain('NOTES_PRIVATE_MARKER');
  for(const sql of ['UPDATE audit_events SET action=action','DELETE FROM audit_events','TRUNCATE audit_events'])await expect(db.$executeRawUnsafe(sql)).rejects.toThrow();
  expect(await db.auditEvent.count()).toBe(1);
 });
 it('runtime cannot alter auth admission, create identities, delete headers or expose owner lock to PUBLIC',async()=>{
  const permissions=await db.$queryRaw<{safe:boolean}[]>`SELECT NOT has_table_privilege(current_user,'"user"','UPDATE') AND NOT has_table_privilege(current_user,'account','INSERT') AND NOT has_table_privilege(current_user,'sales_orders','DELETE') AND NOT EXISTS (SELECT 1 FROM pg_proc p CROSS JOIN LATERAL aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a WHERE p.proname='lock_active_owner' AND a.grantee=0 AND a.privilege_type='EXECUTE') AS safe`;
  expect(permissions[0]?.safe).toBe(true);
  for(const sql of ['UPDATE "user" SET "activeAccess"=true','INSERT INTO account DEFAULT VALUES','DELETE FROM sales_orders'])await expect(db.$executeRawUnsafe(sql)).rejects.toMatchObject({meta:{driverAdapterError:{cause:{originalCode:'42501'}}}});
 });
 it('revoked owner cannot mutate or replay even with a previously successful key INV-A01',async()=>{
  const payload={name:'Antes de revocar',idempotencyKey:key()};await mutate('clients.create',payload,actor2);
  await migrator.user.update({where:{id:actor2},data:{activeAccess:false}});
  try{await expect(mutate('clients.create',payload,actor2)).rejects.toMatchObject({code:'FORBIDDEN'});await expect(mutate('clients.create',{name:'Nuevo',idempotencyKey:key()},actor2)).rejects.toMatchObject({code:'FORBIDDEN'});expect(await db.customer.count()).toBe(1);}
  finally{await migrator.user.update({where:{id:actor2},data:{activeAccess:true}});}
 });
 it('revocation holding owner lock prevents a competing write from committing INV-A01',async()=>{
  await sqlAdmin(async c=>{
   await c.query('BEGIN');await c.query('SELECT id FROM "user" WHERE id=$1 FOR UPDATE',[actor2]);
   await c.query('UPDATE "user" SET "activeAccess"=false WHERE id=$1',[actor2]);
   const competing=mutate('clients.create',{name:'Revocation race',idempotencyKey:key()},actor2).then(value=>({value,error:null}),error=>({value:null,error}));
   try{
    let blocked=false;for(let i=0;i<30;i++){const r=await c.query('SELECT count(*)::int n FROM pg_locks WHERE NOT granted');if(r.rows[0].n>0){blocked=true;break;}await new Promise(resolve=>setTimeout(resolve,10));}
    expect(blocked).toBe(true);await c.query('COMMIT');expect(await competing).toMatchObject({value:null,error:{code:'FORBIDDEN'}});expect(await db.customer.count()).toBe(0);
   }finally{await c.query('ROLLBACK');await migrator.user.update({where:{id:actor2},data:{activeAccess:true}});}
  });
 });
 it('customer archive winning a lock blocks a concurrently selected new order',async()=>{
  const customer=await client();await sqlAdmin(async c=>{
   await c.query('BEGIN');await c.query('SELECT id FROM customers WHERE id=$1::uuid FOR UPDATE',[customer.id]);await c.query('UPDATE customers SET "archivedAt"=now(),version=version+1 WHERE id=$1::uuid',[customer.id]);
   const competing=mutate('orders.create',order(customer.id)).then(value=>({value,error:null}),error=>({value:null,error}));
   try{
    let blocked=false;for(let i=0;i<30;i++){const r=await c.query('SELECT count(*)::int n FROM pg_locks WHERE NOT granted');if(r.rows[0].n>0){blocked=true;break;}await new Promise(resolve=>setTimeout(resolve,10));}
    expect(blocked).toBe(true);await c.query('COMMIT');expect(await competing).toMatchObject({value:null,error:{code:'CONFLICT'}});expect(await db.salesOrder.count()).toBe(0);expect(await db.idempotencyRecord.count()).toBe(1);
   }finally{await c.query('ROLLBACK');}
  });
 });
});

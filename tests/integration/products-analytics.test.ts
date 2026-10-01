import {beforeAll,beforeEach,afterAll,describe,it,expect} from 'vitest';
import {randomUUID} from 'node:crypto';
import {db} from '@/server/db';
import {mutateForActor} from '@/server/domain';
import {queryForActor} from '@/server/queries';
import {migrator,clearDomain} from '../support/database';
import type {DashboardDTO,MutationOperation} from '@/lib/contracts';
const actor=randomUUID();const key=()=>randomUUID();
const mutate=(op:MutationOperation,input:object)=>mutateForActor(actor,op,input);
const product=()=>mutate('products.create',{name:'Vela QA catálogo',price:'25000.50',description:'Referencia comercial sintética',idempotencyKey:key()});
const customer=()=>mutate('clients.create',{name:'Cliente sintético catálogo',idempotencyKey:key()});
const inputOrder=(customerId:string,productId:string|null=null,date='2026-10-01',price='25000.50')=>({customerId,orderDate:date,lines:[{productId,description:'Snapshot de vainilla',quantity:2,unitPrice:price}],idempotencyKey:key()});
const dashboard=async(from:string,to:string):Promise<DashboardDTO>=>{const result=await queryForActor(actor,'dashboard.summary',{from,to});if(!('series' in result))throw new Error('Expected dashboard');return result;};
beforeAll(async()=>{await migrator.user.create({data:{id:actor,name:'Dueño catálogo QA',email:`${actor}@example.test`,emailVerified:true,activeAccess:true}});});
beforeEach(clearDomain);
afterAll(async()=>{await clearDomain();await migrator.user.delete({where:{id:actor}});await db.$disconnect();await migrator.$disconnect();});
describe('catalog lifecycle and protected references',()=>{
 it('duplicates names allowed, idempotent create and full audited versioned lifecycle',async()=>{
  const payload={name:'Nombre repetible',price:'0.10',idempotencyKey:key()};
  const [first,replay]=await Promise.all([mutate('products.create',payload),mutate('products.create',payload)]);expect(first).toEqual(replay);
  await expect(mutate('products.create',{...payload,price:'0.20'})).rejects.toMatchObject({code:'IDEMPOTENCY_MISMATCH'});
  await mutate('products.create',{...payload,idempotencyKey:key()});
  const edits=await Promise.allSettled(['A','B'].map(name=>mutate('products.update',{id:first.id,expectedVersion:1,name,price:'1',idempotencyKey:key()})));
  expect(edits.filter(r=>r.status==='fulfilled')).toHaveLength(1);expect(edits.find(r=>r.status==='rejected')).toMatchObject({reason:{code:'CONFLICT'}});
  await mutate('products.archive',{id:first.id,expectedVersion:2,idempotencyKey:key()});
  expect(await queryForActor(actor,'products.get',{id:first.id})).toMatchObject({archived:true,version:3});
  expect(await queryForActor(actor,'products.list',{archived:false})).toMatchObject({total:1});
  await expect(mutate('products.update',{id:first.id,expectedVersion:3,name:'No',price:'1',idempotencyKey:key()})).rejects.toMatchObject({code:'CONFLICT'});
  await mutate('products.restore',{id:first.id,expectedVersion:3,idempotencyKey:key()});
  expect(await db.auditEvent.count({where:{entityType:'PRODUCT',entityId:first.id}})).toBe(4);
  expect(await queryForActor(actor,'audit.forEntity',{entityType:'PRODUCT',entityId:first.id})).toMatchObject({total:4});
  for(const sql of ['DELETE FROM products','TRUNCATE products'])await expect(db.$executeRawUnsafe(sql)).rejects.toThrow();
 });
 it('preserves historical price/description after product edits and archive; rejects new archived pointers',async()=>{
  const c=await customer();const p=await product();const sale=await mutate('orders.create',inputOrder(c.id,p.id));
  await mutate('products.update',{id:p.id,expectedVersion:1,name:'Producto renombrado',price:'90000',description:'Descripción nueva',idempotencyKey:key()});
  await mutate('products.archive',{id:p.id,expectedVersion:2,idempotencyKey:key()});
  const persisted=await queryForActor(actor,'orders.get',{id:sale.id});expect(persisted).toMatchObject({total:'50001.00',lines:[{productId:p.id,description:'Snapshot de vainilla',unitPrice:'25000.50'}]});
  await expect(mutate('orders.create',inputOrder(c.id,p.id))).rejects.toMatchObject({code:'CONFLICT'});
  const free=await mutate('orders.create',inputOrder(c.id));await expect(mutate('orders.update',{...inputOrder(c.id,p.id),id:free.id,expectedVersion:1})).rejects.toMatchObject({code:'CONFLICT'});
  await mutate('orders.update',{...inputOrder(c.id,p.id),id:sale.id,expectedVersion:1});
  const extra=inputOrder(c.id,p.id);await expect(mutate('orders.update',{...extra,id:sale.id,expectedVersion:2,lines:[...extra.lines,{productId:p.id,description:'Nueva referencia archivada',quantity:1,unitPrice:'1'}]})).rejects.toMatchObject({code:'CONFLICT'});
  expect(await db.salesOrderLine.count({where:{orderId:sale.id}})).toBe(1);
  await mutate('orders.archive',{id:sale.id,expectedVersion:2,idempotencyKey:key()});
  await mutate('orders.restore',{id:sale.id,expectedVersion:3,idempotencyKey:key()});
  expect(await queryForActor(actor,'orders.get',{id:sale.id})).toMatchObject({archived:false,lines:[{productId:p.id,unitPrice:'25000.50'}]});
  const audit=await db.auditEvent.findFirstOrThrow({where:{entityId:sale.id,action:'CREATE'}});expect(audit.after).toMatchObject({lines:[{productId:p.id,description:'Snapshot de vainilla'}]});
 });
 it('rejects unknown references atomically and denies unauthorised catalog access',async()=>{
  const c=await customer();const count=await db.idempotencyRecord.count();
  await expect(mutate('orders.create',inputOrder(c.id,randomUUID()))).rejects.toMatchObject({code:'CONFLICT'});
  expect(await db.salesOrder.count()).toBe(0);expect(await db.idempotencyRecord.count()).toBe(count);
  await expect(queryForActor('unknown','products.list',{})).rejects.toMatchObject({code:'FORBIDDEN'});
  await expect(mutateForActor('unknown','products.create',{name:'Denied',price:'1',idempotencyKey:key()})).rejects.toMatchObject({code:'FORBIDDEN'});
 });
 it('a product archive lock winning first blocks a concurrent new reference',async()=>{
  const c=await customer();const p=await product();
  let release!:()=>void;let locked!:()=>void;
  const gate=new Promise<void>(resolve=>{release=resolve;});const ready=new Promise<void>(resolve=>{locked=resolve;});
  const archive=migrator.$transaction(async tx=>{await tx.$queryRaw`SELECT id FROM products WHERE id=${p.id}::uuid FOR UPDATE`;locked();await gate;await tx.product.update({where:{id:p.id},data:{archivedAt:new Date(),version:{increment:1}}});});
  await ready;const newOrder=mutate('orders.create',inputOrder(c.id,p.id));
  release();await archive;await expect(newOrder).rejects.toMatchObject({code:'CONFLICT'});expect(await db.salesOrder.count()).toBe(0);
 });
});
describe('zero-filled exact range analytics',()=>{
 it('uses daily buckets through 31 inclusive days and monthly at 32; includes leap-day zeros',async()=>{
  const daily=await dashboard('2026-01-01','2026-01-31');expect(daily.granularity).toBe('day');expect(daily.series).toHaveLength(31);expect(daily.series[30]).toEqual({period:'2026-01-31',orders:'0.00',expenses:'0.00',difference:'0.00'});
  const monthly=await dashboard('2026-01-01','2026-02-01');expect(monthly.granularity).toBe('month');expect(monthly.series.map(r=>r.period)).toEqual(['2026-01-01','2026-02-01']);
  const leap=await dashboard('2024-02-01','2024-02-29');expect(leap.series).toHaveLength(29);expect(leap.series[28]?.period).toBe('2024-02-29');
 });
 it('filters partial months before grouping, excludes archived and keeps negative cents exact',async()=>{
  const c=await customer();await mutate('orders.create',inputOrder(c.id,null,'2026-01-15','0.10'));
  await mutate('orders.create',inputOrder(c.id,null,'2026-01-14','999'));
  await mutate('orders.create',inputOrder(c.id,null,'2026-03-16','999'));
  await mutate('expenses.create',{expenseDate:'2026-01-15',concept:'Sintético',amount:'0.30',idempotencyKey:key()});
  const archived=await mutate('expenses.create',{expenseDate:'2026-02-01',concept:'Excluido',amount:'99',idempotencyKey:key()});await mutate('expenses.archive',{id:archived.id,expectedVersion:1,idempotencyKey:key()});
  const result=await dashboard('2026-01-15','2026-03-15');expect(result.difference).toBe('-0.10');expect(result.series).toEqual([{period:'2026-01-01',orders:'0.20',expenses:'0.30',difference:'-0.10'},{period:'2026-02-01',orders:'0.00',expenses:'0.00',difference:'0.00'},{period:'2026-03-01',orders:'0.00',expenses:'0.00',difference:'0.00'}]);expect(result.recentOrders).toHaveLength(1);
 });
 it('does not apply per-record money limits to aggregate buckets',async()=>{
  const c=await customer();for(let i=0;i<2;i++)await mutate('orders.create',{...inputOrder(c.id,null,'2026-10-01','999999999999.99'),lines:[{productId:null,description:'Límite sintético',quantity:1,unitPrice:'999999999999.99'}]});
  const result=await dashboard('2026-10-01','2026-10-01');expect(result.series[0]?.orders).toBe('1999999999999.98');expect(result.totalOrders).toBe('1999999999999.98');
 });
});

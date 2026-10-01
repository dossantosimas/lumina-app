import {it,expect} from 'vitest';
import {randomUUID} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import {db} from '@/server/db';
import {mutateForActor} from '@/server/domain';
import {queryForActor} from '@/server/queries';
import {migrator,clearDomain} from '../support/database';
it('1000 orders with five concurrent admitted owners p95 <= 3000ms NFR-005',async()=>{
 await clearDomain();const owners=Array.from({length:5},()=>randomUUID());
 for(const id of owners)await migrator.user.create({data:{id,name:'Dueño carga sintético',email:`${id}@example.test`,activeAccess:true,emailVerified:true}});
 const customer=await mutateForActor(owners[0]!,'clients.create',{name:'Cliente carga sintético',idempotencyKey:randomUUID()});
 const payload=()=>({customerId:customer.id,orderDate:'2026-09-30',lines:[{description:'Vainilla',quantity:2,unitPrice:'25000.00'},{description:'Lavanda',quantity:1,unitPrice:'35000.00'}],idempotencyKey:randomUUID()});
 await Promise.all(owners.map(async owner=>{for(let n=0;n<200;n++)await mutateForActor(owner,'orders.create',payload());}));
 expect(await db.salesOrder.count()).toBe(1000);
 const queries:number[]=[];const saves:number[]=[];
 await Promise.all(owners.map(async owner=>{
  for(let n=0;n<20;n++){
   let start=performance.now();await queryForActor(owner,n%2?'orders.list':'dashboard.summary',n%2?{page:1,pageSize:20}:{from:'2026-09-01',to:'2026-09-30'});queries.push(performance.now()-start);
   start=performance.now();await mutateForActor(owner,'expenses.create',{expenseDate:'2026-09-30',concept:'Cera carga sintética',amount:'120000',idempotencyKey:randomUUID()});saves.push(performance.now()-start);
  }
 }));
 const p95=(times:number[])=>[...times].sort((a,b)=>a-b)[Math.ceil(times.length*.95)-1]!;
 const evidence={at:new Date().toISOString(),environment:{os:process.platform,node:process.version,database:'Docker PostgreSQL17 local 1CPU/512MiB',connection:'local TCP; service boundary; excludes browser/network internet',owners:5,orders:1000,querySamples:queries.length,saveSamples:saves.length},queryP95Ms:p95(queries),saveP95Ms:p95(saves)};
 writeFileSync('.runtime/qa-load-result.json',JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence));
 expect(evidence.queryP95Ms).toBeLessThanOrEqual(3000);expect(evidence.saveP95Ms).toBeLessThanOrEqual(3000);
 // Retain synthetic domain/auth fixtures for the separately isolated restore proof.
 await db.$disconnect();await migrator.$disconnect();
},180000);

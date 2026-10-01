import 'server-only';
import {Prisma,PrismaClient} from '@/generated/prisma/client';
import type {QueryOperation,QueryData,EntityType} from '@/lib/contracts';
import {auditSchema,getSchema,listSchema,dashboardRangeSchema} from '@/lib/validation';
import {productDTO,clientDTO,orderDTO,expenseDTO,lockOwner,parseInput} from './domain';
import {DomainError} from './errors';
import {db} from './db';
function dates(from?:string,to?:string){return {...(from?{gte:new Date(`${from}T00:00:00Z`)}:{}),...(to?{lte:new Date(`${to}T00:00:00Z`)}:{})};}
function archived(value:boolean|'all'){return value==='all'?{}:{archivedAt:value?{not:null}:null};}
export async function queryForActor(actorId:string,operation:QueryOperation,input:unknown,database:PrismaClient=db):Promise<QueryData> {
 return database.$transaction(async tx=>{
  await lockOwner(tx,actorId);
  if(operation==='dashboard.summary') {
   const range=parseInput(dashboardRangeSchema,input);const from=new Date(`${range.from}T00:00:00Z`),to=new Date(`${range.to}T00:00:00Z`);
   const granularity:'day'|'month'=(to.getTime()-from.getTime())/86400000+1<=31?'day':'month';
   const aggregates=await tx.$queryRaw<{totalOrders:string;totalExpenses:string;difference:string;orderCount:bigint;expenseCount:bigint}[]>`WITH o AS (SELECT coalesce(sum(total),0) amount,count(*) count FROM sales_orders WHERE "archivedAt" IS NULL AND "orderDate" BETWEEN ${from}::date AND ${to}::date),e AS (SELECT coalesce(sum(amount),0) amount,count(*) count FROM expenses WHERE "archivedAt" IS NULL AND "expenseDate" BETWEEN ${from}::date AND ${to}::date) SELECT o.amount::text "totalOrders",e.amount::text "totalExpenses",(o.amount-e.amount)::text difference,o.count "orderCount",e.count "expenseCount" FROM o,e`;
   const totals=aggregates[0];if(!totals)throw new DomainError('UNAVAILABLE','No se pudo calcular el resumen');
   const recentOrders=await tx.salesOrder.findMany({where:{archivedAt:null,orderDate:dates(range.from,range.to)},orderBy:[{orderDate:'desc'},{id:'desc'}],take:5,include:{lines:true,customer:true}});
   const recentExpenses=await tx.expense.findMany({where:{archivedAt:null,expenseDate:dates(range.from,range.to)},orderBy:[{expenseDate:'desc'},{id:'desc'}],take:5});
   // Bucket first-of-month/day keys are UTC date-only labels; filter business range before grouping.
   const seriesRows=await tx.$queryRaw<{period:string;orders:string;expenses:string;difference:string}[]>`WITH
    periods AS (SELECT generate_series(date_trunc(${granularity},${from}::timestamp),date_trunc(${granularity},${to}::timestamp),CASE WHEN ${granularity}='day' THEN interval '1 day' ELSE interval '1 month' END)::date period),
    o AS (SELECT date_trunc(${granularity},"orderDate"::timestamp)::date period,sum(total) amount FROM sales_orders WHERE "archivedAt" IS NULL AND "orderDate" BETWEEN ${from}::date AND ${to}::date GROUP BY 1),
    e AS (SELECT date_trunc(${granularity},"expenseDate"::timestamp)::date period,sum(amount) amount FROM expenses WHERE "archivedAt" IS NULL AND "expenseDate" BETWEEN ${from}::date AND ${to}::date GROUP BY 1)
    SELECT to_char(p.period,'YYYY-MM-DD') period,coalesce(o.amount,0)::text orders,coalesce(e.amount,0)::text expenses,(coalesce(o.amount,0)-coalesce(e.amount,0))::text difference FROM periods p LEFT JOIN o USING(period) LEFT JOIN e USING(period) ORDER BY p.period`;
   const series=seriesRows.map(row=>({period:row.period,orders:new Prisma.Decimal(row.orders).toFixed(2),expenses:new Prisma.Decimal(row.expenses).toFixed(2),difference:new Prisma.Decimal(row.difference).toFixed(2)}));
   return {totalOrders:new Prisma.Decimal(totals.totalOrders).toFixed(2),totalExpenses:new Prisma.Decimal(totals.totalExpenses).toFixed(2),difference:new Prisma.Decimal(totals.difference).toFixed(2),counts:{orders:Number(totals.orderCount),expenses:Number(totals.expenseCount)},recentOrders:recentOrders.map(orderDTO),recentExpenses:recentExpenses.map(expenseDTO),granularity,series};
  }
  if(operation==='audit.forEntity'||operation==='audit.list') {
   const filter=parseInput(auditSchema,input);
   if(operation==='audit.forEntity'&&(!filter.entityType||!filter.entityId))throw new DomainError('VALIDATION','Indica entidad e identificador');
   const where={...(filter.entityType?{entityType:filter.entityType}:{}),...(filter.entityId?{entityId:filter.entityId}:{})};
   const items=await tx.auditEvent.findMany({where,orderBy:[{occurredAt:'desc'},{id:'desc'}],skip:(filter.page-1)*filter.pageSize,take:filter.pageSize});
   return {items:items.map(r=>({id:r.id,actorNameSnapshot:r.actorNameSnapshot,occurredAt:r.occurredAt.toISOString(),entityType:r.entityType as EntityType,entityId:r.entityId,action:r.action,before:r.before,after:r.after,resultingVersion:r.resultingVersion})),total:await tx.auditEvent.count({where}),page:filter.page,pageSize:filter.pageSize};
  }
  if(operation.endsWith('.get')) {
   const {id}=parseInput(getSchema,input);
   if(operation==='products.get'){const row=await tx.product.findUnique({where:{id}});if(!row)throw new DomainError('NOT_FOUND','Producto inexistente');return productDTO(row);}
   if(operation==='clients.get'){const row=await tx.customer.findUnique({where:{id}});if(!row)throw new DomainError('NOT_FOUND','Cliente inexistente');return clientDTO(row);}
   if(operation==='orders.get'){const row=await tx.salesOrder.findUnique({where:{id},include:{lines:true,customer:true}});if(!row)throw new DomainError('NOT_FOUND','Pedido inexistente');return orderDTO(row);}
   if(operation==='expenses.get'){const row=await tx.expense.findUnique({where:{id}});if(!row)throw new DomainError('NOT_FOUND','Gasto inexistente');return expenseDTO(row);}
  }
  const f=parseInput(listSchema,input);const page={page:f.page,pageSize:f.pageSize};const paging={skip:(f.page-1)*f.pageSize,take:f.pageSize};
  const contains={contains:f.search,mode:'insensitive' as const};
  if(operation==='products.list') {
   const where:Prisma.ProductWhereInput={...archived(f.archived),...(f.search?{OR:[{name:contains},{description:contains}]}:{})};
   return {items:(await tx.product.findMany({where,...paging,orderBy:[{name:'asc'},{id:'asc'}]})).map(productDTO),total:await tx.product.count({where}),...page};
  }
  if(operation==='clients.list') {
   const where:Prisma.CustomerWhereInput={...archived(f.archived),...(f.search?{OR:[{name:contains},{contact:contains},{notes:contains}]}:{})};
   return {items:(await tx.customer.findMany({where,...paging,orderBy:[{name:'asc'},{id:'asc'}]})).map(clientDTO),total:await tx.customer.count({where}),...page};
  }
  if(operation==='orders.list') {
   const where:Prisma.SalesOrderWhereInput={...archived(f.archived),orderDate:dates(f.from,f.to),...(f.customerId?{customerId:f.customerId}:{}),...(f.search?{OR:[{customerNameSnapshot:contains},{notes:contains},{lines:{some:{description:contains}}}]}:{})};
   return {items:(await tx.salesOrder.findMany({where,...paging,include:{lines:true,customer:true},orderBy:[{orderDate:'desc'},{id:'desc'}]})).map(orderDTO),total:await tx.salesOrder.count({where}),...page};
  }
  if(operation==='expenses.list') {
   const where:Prisma.ExpenseWhereInput={...archived(f.archived),expenseDate:dates(f.from,f.to),...(f.search?{OR:[{concept:contains},{supplier:contains},{invoiceReference:contains}]}:{})};
   return {items:(await tx.expense.findMany({where,...paging,orderBy:[{expenseDate:'desc'},{id:'desc'}]})).map(expenseDTO),total:await tx.expense.count({where}),...page};
  }
  throw new DomainError('VALIDATION','Operación inválida');
 },{isolationLevel:'RepeatableRead',maxWait:5000,timeout:15000});
}

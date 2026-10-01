import 'server-only';
import {createHash,randomUUID} from 'node:crypto';
import {z} from 'zod';
import {Prisma,PrismaClient} from '@/generated/prisma/client';
import type {ProductDTO,ClientDTO,OrderDTO,ExpenseDTO,MutationOperation,MutationReceipt,EntityType} from '@/lib/contracts';
import {mutationSchemas,productFields,clientFields,orderFields,expenseFields} from '@/lib/validation';
import {calculateLines,fromCents,toCents} from '@/lib/money';
import {DomainError} from './errors';
import {db} from './db';
type Tx=Prisma.TransactionClient;
type Customer=Prisma.CustomerGetPayload<Record<string,never>>;
type Order=Prisma.SalesOrderGetPayload<{include:{lines:true;customer:true}}>;
type Expense=Prisma.ExpenseGetPayload<Record<string,never>>;
type Product=Prisma.ProductGetPayload<Record<string,never>>;
export function productDTO(row:Product):ProductDTO {return {id:row.id,name:row.name,price:row.price.toFixed(2),description:row.description,archived:!!row.archivedAt,version:row.version};}
export function clientDTO(row:Customer):ClientDTO {return {id:row.id,name:row.name,contact:row.contact,notes:row.notes,archived:!!row.archivedAt,version:row.version};}
export function orderDTO(row:Order):OrderDTO {return {id:row.id,customerId:row.customerId,customerNameSnapshot:row.customerNameSnapshot,customerArchived:!!row.customer.archivedAt,orderDate:row.orderDate.toISOString().slice(0,10),notes:row.notes,total:row.total.toFixed(2),lines:row.lines.sort((a,b)=>a.position-b.position).map(l=>({id:l.id,productId:l.productId,description:l.description,quantity:l.quantity,unitPrice:l.unitPrice.toFixed(2),subtotal:fromCents(toCents(l.unitPrice.toFixed(2))*BigInt(l.quantity)),position:l.position})),archived:!!row.archivedAt,version:row.version};}
export function expenseDTO(row:Expense):ExpenseDTO {return {id:row.id,expenseDate:row.expenseDate.toISOString().slice(0,10),concept:row.concept,amount:row.amount.toFixed(2),supplier:row.supplier,invoiceReference:row.invoiceReference,archived:!!row.archivedAt,version:row.version};}
export function parseInput<T>(schema:z.ZodType<T>,input:unknown):T {
 const parsed=schema.safeParse(input);
 if(parsed.success)return parsed.data;
 const fields:Record<string,string[]>={};for(const issue of parsed.error.issues){const field=issue.path.join('.')||'_form';(fields[field]??=[]).push(issue.message);}
 throw new DomainError('VALIDATION','Revisa los campos indicados',fields);
}
export async function lockOwner(tx:Tx,actorId:string):Promise<{id:string;name:string}> {
 const rows=await tx.$queryRaw<{id:string;name:string;activeAccess:boolean}[]>`SELECT * FROM public.lock_active_owner(${actorId})`;
 const actor=rows[0];if(!actor?.activeAccess)throw new DomainError('FORBIDDEN','La cuenta no tiene acceso activo');return actor;
}
const receiptSchema=z.object({id:z.uuid(),version:z.number().int().positive(),archived:z.boolean(),total:z.string().optional()}).strict();
function snapshot(row:ProductDTO|ClientDTO|OrderDTO|ExpenseDTO):Prisma.InputJsonObject {
 if('price' in row)return {id:row.id,name:row.name,price:row.price,description:row.description,archived:row.archived,version:row.version};
 if('lines' in row)return {id:row.id,customerId:row.customerId,customerNameSnapshot:row.customerNameSnapshot,orderDate:row.orderDate,total:row.total,lines:row.lines.map(l=>({productId:l.productId,description:l.description,quantity:l.quantity,unitPrice:l.unitPrice,position:l.position})),archived:row.archived,version:row.version};
 if('concept' in row)return {id:row.id,expenseDate:row.expenseDate,concept:row.concept,amount:row.amount,supplier:row.supplier,invoiceReference:row.invoiceReference,archived:row.archived,version:row.version};
 return {id:row.id,name:row.name,archived:row.archived,version:row.version};
}
async function lockEntity(tx:Tx,entity:string,id:string):Promise<void> {
 if(entity==='products')await tx.$queryRaw`SELECT id FROM products WHERE id=${id}::uuid FOR UPDATE`;
 else if(entity==='clients')await tx.$queryRaw`SELECT id FROM customers WHERE id=${id}::uuid FOR UPDATE`;
 else if(entity==='orders')await tx.$queryRaw`SELECT id FROM sales_orders WHERE id=${id}::uuid FOR UPDATE`;
 else await tx.$queryRaw`SELECT id FROM expenses WHERE id=${id}::uuid FOR UPDATE`;
}
function checkVersion(row:{version:number;archivedAt:Date|null}|null,expected:number,action:string) {
 if(!row)throw new DomainError('NOT_FOUND','El registro no existe');
 if(row.version!==expected || (action==='restore'? !row.archivedAt : !!row.archivedAt))throw new DomainError('CONFLICT','El registro cambió. Recarga y revisa antes de guardar');
}
export async function mutateForActor(actorId:string,operation:MutationOperation,input:unknown,database:PrismaClient=db):Promise<MutationReceipt> {
 const schema=mutationSchemas[operation];if(!schema)throw new DomainError('VALIDATION','Operación inválida');
 const command=parseInput<z.output<typeof schema>>(schema,input);
 const {idempotencyKey,...payload}=command;
 const hash=createHash('sha256').update(JSON.stringify(payload)).digest('hex');
 const [entity,action]=operation.split('.');
 const entityType:EntityType=entity==='products'?'PRODUCT':entity==='clients'?'CUSTOMER':entity==='orders'?'ORDER':'EXPENSE';
 for(let attempt=0;attempt<3;attempt++) {
 try{return await database.$transaction(async tx=>{
  const actor=await lockOwner(tx,actorId);
  const inserted=await tx.$queryRaw<{id:string}[]>`INSERT INTO idempotency_records (id,"ownerId",scope,"requestKey","payloadHash",response,"createdAt") VALUES (${randomUUID()}::uuid,${actorId},${operation},${idempotencyKey}::uuid,${hash},'{}'::jsonb,NOW()) ON CONFLICT ("ownerId",scope,"requestKey") DO NOTHING RETURNING id`;
  if(!inserted.length){const prior=await tx.idempotencyRecord.findUniqueOrThrow({where:{ownerId_scope_requestKey:{ownerId:actorId,scope:operation,requestKey:idempotencyKey}}});if(prior.payloadHash!==hash)throw new DomainError('IDEMPOTENCY_MISMATCH','La clave ya corresponde a otro guardado');return parseInput(receiptSchema,prior.response);}
  const id='id' in command?command.id:randomUUID();
  const expected='expectedVersion' in command?command.expectedVersion:1;
  if(action!=='create')await lockEntity(tx,entity??'',id);
  let before:ProductDTO|ClientDTO|OrderDTO|ExpenseDTO|null=null;let after:ProductDTO|ClientDTO|OrderDTO|ExpenseDTO;
  if(entity==='products') {
    const row=action==='create'?null:await tx.product.findUnique({where:{id}});
    if(action!=='create')checkVersion(row,expected,action??'');
    if(row)before=productDTO(row);
    if(action==='create'||action==='update') {
      const fields=parseInput(productFields,{name:'name' in command?command.name:undefined,price:'price' in command?command.price:undefined,description:'description' in command?command.description:null});
      after=productDTO(action==='create'?await tx.product.create({data:{id,...fields}}):await tx.product.update({where:{id,version:expected},data:{...fields,version:{increment:1}}}));
    }else after=productDTO(await tx.product.update({where:{id,version:expected},data:{archivedAt:action==='archive'?new Date():null,version:{increment:1}}}));
  }else if(entity==='clients') {
    const row=action==='create'?null:await tx.customer.findUnique({where:{id}});
    if(action!=='create')checkVersion(row,expected,action??'');
    if(row)before=clientDTO(row);
    if(action==='create'||action==='update') {
      const fields=parseInput(clientFields,{name:'name' in command?command.name:undefined,contact:'contact' in command?command.contact:null,notes:'notes' in command?command.notes:null});
      after=clientDTO(action==='create'?await tx.customer.create({data:{id,...fields}}):await tx.customer.update({where:{id,version:expected},data:{...fields,version:{increment:1}}}));
    }else after=clientDTO(await tx.customer.update({where:{id,version:expected},data:{archivedAt:action==='archive'?new Date():null,version:{increment:1}}}));
  }else if(entity==='orders') {
    const row=action==='create'?null:await tx.salesOrder.findUnique({where:{id},include:{lines:true,customer:true}});
    if(action!=='create')checkVersion(row,expected,action??'');
    if(row)before=orderDTO(row);
    if(action==='create'||action==='update') {
      const fields=parseInput(orderFields,{customerId:'customerId' in command?command.customerId:undefined,orderDate:'orderDate' in command?command.orderDate:undefined,notes:'notes' in command?command.notes:null,lines:'lines' in command?command.lines:undefined});
      let total:string;try{total=calculateLines(fields.lines);}catch{throw new DomainError('VALIDATION','El total o subtotal supera el límite, o el total es cero',{lines:['Revisa cantidades y precios']});}
      let customerNameSnapshot=row?.customerNameSnapshot??'';
      if(!row||row.customerId!==fields.customerId) {
        const clients=await tx.$queryRaw<{name:string;archivedAt:Date|null}[]>`SELECT name,"archivedAt" FROM customers WHERE id=${fields.customerId}::uuid FOR SHARE`;
        const client=clients[0];if(!client||client.archivedAt)throw new DomainError('CONFLICT','Elige un cliente activo');customerNameSnapshot=client.name;
      }
      // Stable lock order: owner → idempotency → entity → client → products sorted by UUID.
      // A historical pointer remains valid after catalog archive; a newly added pointer must be active.
      const existingProducts=new Map<string,number>();
      for(const line of row?.lines??[])if(line.productId)existingProducts.set(line.productId,(existingProducts.get(line.productId)??0)+1);
      const requestedProducts=new Map<string,number>();
      for(const line of fields.lines)if(line.productId)requestedProducts.set(line.productId,(requestedProducts.get(line.productId)??0)+1);
      const productIds=[...new Set(fields.lines.flatMap(line=>line.productId?[line.productId]:[]))].sort();
      for(const productId of productIds) {
        const products=await tx.$queryRaw<{archivedAt:Date|null}[]>`SELECT "archivedAt" FROM products WHERE id=${productId}::uuid FOR SHARE`;
        const product=products[0];
        if(!product||(product.archivedAt&&(requestedProducts.get(productId)??0)>(existingProducts.get(productId)??0)))throw new DomainError('CONFLICT','Elige un producto activo para una referencia nueva',{lines:['Uno de los productos no está disponible']});
      }
      const data={customerId:fields.customerId,customerNameSnapshot,orderDate:new Date(`${fields.orderDate}T00:00:00Z`),notes:fields.notes,total};
      if(action==='create')await tx.salesOrder.create({data:{id,...data}});
      else {await tx.salesOrder.update({where:{id,version:expected},data:{...data,version:{increment:1}}});await tx.salesOrderLine.deleteMany({where:{orderId:id}});}
      await tx.salesOrderLine.createMany({data:fields.lines.map((l,index)=>({id:randomUUID(),orderId:id,position:index+1,...l}))});
    }else await tx.salesOrder.update({where:{id,version:expected},data:{archivedAt:action==='archive'?new Date():null,version:{increment:1}}});
    after=orderDTO(await tx.salesOrder.findUniqueOrThrow({where:{id},include:{lines:true,customer:true}}));
  }else {
    const row=action==='create'?null:await tx.expense.findUnique({where:{id}});
    if(action!=='create')checkVersion(row,expected,action??'');
    if(row)before=expenseDTO(row);
    if(action==='create'||action==='update') {
      const fields=parseInput(expenseFields,{expenseDate:'expenseDate' in command?command.expenseDate:undefined,concept:'concept' in command?command.concept:undefined,amount:'amount' in command?command.amount:undefined,supplier:'supplier' in command?command.supplier:null,invoiceReference:'invoiceReference' in command?command.invoiceReference:null});
      const data={...fields,expenseDate:new Date(`${fields.expenseDate}T00:00:00Z`)};
      after=expenseDTO(action==='create'?await tx.expense.create({data:{id,...data}}):await tx.expense.update({where:{id,version:expected},data:{...data,version:{increment:1}}}));
    }else after=expenseDTO(await tx.expense.update({where:{id,version:expected},data:{archivedAt:action==='archive'?new Date():null,version:{increment:1}}}));
  }
  const contactChanged='contact' in after&&after.contact!==((before&&'contact' in before)?before.contact:null);
  const notesChanged='notes' in after&&after.notes!==((before&&'notes' in before)?before.notes:null);
  await tx.auditEvent.create({data:{actorId,actorNameSnapshot:actor.name,entityType,entityId:id,action:(action??'').toUpperCase(),before:before?snapshot(before):Prisma.DbNull,after:{...snapshot(after),contactChanged,notesChanged},resultingVersion:after.version}});
  const receipt:MutationReceipt={id,version:after.version,archived:after.archived,...('total' in after?{total:after.total}:'amount' in after?{total:after.amount}:{})};
  await tx.idempotencyRecord.update({where:{ownerId_scope_requestKey:{ownerId:actorId,scope:operation,requestKey:idempotencyKey}},data:{response:{...receipt}}});
  return receipt;
 },{isolationLevel:'ReadCommitted',maxWait:5000,timeout:15000});}
 catch(error){
  const retryable=error instanceof Prisma.PrismaClientKnownRequestError&&(error.code==='P2034'||(error.code==='P2010'&&['40001','40P01'].includes(String(error.meta?.['code']))));
  if(retryable&&attempt<2)continue;
  if(retryable)throw new DomainError('UNAVAILABLE','El registro está ocupado. Reintenta el mismo guardado');
  throw error;
 }
 }
 throw new DomainError('UNAVAILABLE','No fue posible completar el guardado');
}

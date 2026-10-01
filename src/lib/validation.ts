import {z} from 'zod';
import {toCents} from './money';
const required=(max:number)=>z.string().trim().min(1,'Campo obligatorio').max(max,'Texto demasiado largo');
const optional=(max:number)=>z.string().trim().max(max,'Texto demasiado largo').nullish().transform(v=>v || null);
export const uuid=z.uuid();
export const dateOnly=z.string().regex(/^\d{4}-\d{2}-\d{2}$/,'Fecha inválida').refine(v=>!v.startsWith('0000-')&&!Number.isNaN(Date.parse(`${v}T00:00:00Z`)) && new Date(`${v}T00:00:00Z`).toISOString().slice(0,10)===v,'Fecha inexistente');
export const money=z.string().refine(v=>{try{toCents(v);return true;}catch{return false;}},'Usa un importe sin separadores de miles y hasta dos decimales').transform(v=>{const [w,f='']=v.split('.');return `${w}.${f.padEnd(2,'0')}`;});
export const clientFields=z.object({name:required(120),contact:optional(120),notes:optional(2000)}).strict();
export const productFields=z.object({name:required(120),price:money.refine(v=>toCents(v)>0n,'El precio debe ser mayor que cero'),description:optional(2000)}).strict();
export const orderFields=z.object({customerId:uuid,orderDate:dateOnly,notes:optional(2000),lines:z.array(z.object({productId:uuid.nullish().transform(v=>v??null),description:required(200),quantity:z.number().int().min(1).max(10000),unitPrice:money}).strict()).min(1).max(100)}).strict();
export const expenseFields=z.object({expenseDate:dateOnly,concept:required(300),amount:money.refine(v=>toCents(v)>0n,'El total debe ser mayor que cero'),supplier:optional(120),invoiceReference:optional(120)}).strict();
const meta={idempotencyKey:uuid};
const edit={id:uuid,expectedVersion:z.number().int().min(1)};
export const mutationSchemas={
 'products.create':productFields.extend(meta),'products.update':productFields.extend({...meta,...edit}),
 'products.archive':z.object({...meta,...edit}).strict(),'products.restore':z.object({...meta,...edit}).strict(),
 'clients.create':clientFields.extend(meta),'clients.update':clientFields.extend({...meta,...edit}),
 'orders.create':orderFields.extend(meta),'orders.update':orderFields.extend({...meta,...edit}),
 'expenses.create':expenseFields.extend(meta),'expenses.update':expenseFields.extend({...meta,...edit}),
 'clients.archive':z.object({...meta,...edit}).strict(),'clients.restore':z.object({...meta,...edit}).strict(),
 'orders.archive':z.object({...meta,...edit}).strict(),'orders.restore':z.object({...meta,...edit}).strict(),
 'expenses.archive':z.object({...meta,...edit}).strict(),'expenses.restore':z.object({...meta,...edit}).strict(),
};
export const listSchema=z.object({search:z.string().trim().max(120).default(''),archived:z.union([z.boolean(),z.literal('all')]).default(false),page:z.number().int().min(1).max(1000000).default(1),pageSize:z.number().int().min(1).max(50).default(20),from:dateOnly.optional(),to:dateOnly.optional(),customerId:uuid.optional()}).strict().refine(v=>!v.from||!v.to||v.from<=v.to,{message:'El inicio no puede ser posterior al fin',path:['from']});
export const rangeSchema=z.object({from:dateOnly,to:dateOnly}).strict().refine(v=>v.from<=v.to,{message:'El inicio no puede ser posterior al fin',path:['from']});
export const dashboardRangeSchema=rangeSchema.refine(v=>(Date.parse(`${v.to}T00:00:00Z`)-Date.parse(`${v.from}T00:00:00Z`))/86400000+1<=36600,{message:'Selecciona un periodo de hasta 36.600 días',path:['to']});
export const getSchema=z.object({id:uuid}).strict();
export const auditSchema=z.object({entityType:z.enum(['PRODUCT','CUSTOMER','ORDER','EXPENSE']).optional(),entityId:uuid.optional(),page:z.number().int().min(1).default(1),pageSize:z.number().int().min(1).max(50).default(20)}).strict();

export type ErrorCode = 'UNAUTHENTICATED' | 'FORBIDDEN' | 'VALIDATION' | 'NOT_FOUND' | 'CONFLICT' | 'IDEMPOTENCY_MISMATCH' | 'RATE_LIMITED' | 'UNAVAILABLE' | 'INTERNAL';
export type ActionResult<T> = {ok:true; data:T; requestId:string} | {ok:false; error:{code:ErrorCode;message:string;fieldErrors?:Record<string,string[]>};requestId:string};
export type QueryOperation = 'products.list'|'products.get'|'clients.list'|'clients.get'|'orders.list'|'orders.get'|'expenses.list'|'expenses.get'|'audit.forEntity'|'audit.list'|'dashboard.summary';
export type MutationOperation = `${'products'|'clients'|'orders'|'expenses'}.${'create'|'update'|'archive'|'restore'}`;
export type EntityType = 'PRODUCT'|'CUSTOMER'|'ORDER'|'EXPENSE';
export interface ProductDTO {id:string;name:string;price:string;description:string|null;archived:boolean;version:number}
export interface ClientDTO {id:string;name:string;contact:string|null;notes:string|null;archived:boolean;version:number}
export interface OrderLineDTO {id:string;productId:string|null;description:string;quantity:number;unitPrice:string;subtotal:string;position:number}
export interface OrderDTO {id:string;customerId:string;customerNameSnapshot:string;customerArchived:boolean;orderDate:string;notes:string|null;total:string;lines:OrderLineDTO[];archived:boolean;version:number}
export interface ExpenseDTO {id:string;expenseDate:string;concept:string;amount:string;supplier:string|null;invoiceReference:string|null;archived:boolean;version:number}
export interface AuditDTO {id:string;actorNameSnapshot:string;occurredAt:string;entityType:EntityType;entityId:string;action:string;before:unknown;after:unknown;resultingVersion:number}
export interface PageDTO<T> {items:T[];total:number;page:number;pageSize:number}
export interface DashboardPeriodDTO {period:string;orders:string;expenses:string;difference:string}
export interface DashboardDTO {totalOrders:string;totalExpenses:string;difference:string;counts:{orders:number;expenses:number};recentOrders:OrderDTO[];recentExpenses:ExpenseDTO[];granularity:'day'|'month';series:DashboardPeriodDTO[]}
export type QueryData = ProductDTO|ClientDTO|OrderDTO|ExpenseDTO|PageDTO<ProductDTO>|PageDTO<ClientDTO>|PageDTO<OrderDTO>|PageDTO<ExpenseDTO>|PageDTO<AuditDTO>|DashboardDTO;
export interface MutationReceipt {id:string;version:number;archived:boolean;total?:string}
export interface ListInput {search?:string;archived?:boolean|'all';page?:number;pageSize?:number;from?:string;to?:string;customerId?:string}
export interface ClientInput {name:string;contact?:string|null;notes?:string|null}
export interface ProductInput {name:string;price:string;description?:string|null}
export interface OrderInput {customerId:string;orderDate:string;notes?:string|null;lines:{productId?:string|null;description:string;quantity:number;unitPrice:string}[]}
export interface ExpenseInput {expenseDate:string;concept:string;amount:string;supplier?:string|null;invoiceReference?:string|null}
export interface MutationMeta {idempotencyKey:string;id?:string;expectedVersion?:number}

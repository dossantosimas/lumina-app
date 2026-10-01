'use server';
import {randomUUID} from 'node:crypto';
import {Prisma} from '@/generated/prisma/client';
import type {ActionResult,MutationOperation,MutationReceipt,QueryOperation,QueryData} from '@/lib/contracts';
import {requireOwner} from './auth';
import {DomainError} from './errors';
import {mutateForActor} from './domain';
import {queryForActor} from './queries';
async function execute<T>(operation:string,work:(actorId:string)=>Promise<T>):Promise<ActionResult<T>> {
 const requestId=randomUUID();const start=Date.now();
 try {const owner=await requireOwner();const data=await work(owner.id);return {ok:true,data,requestId};}
 catch(error){
  const expected=error instanceof DomainError?error:undefined;
  const unavailable=error instanceof Prisma.PrismaClientInitializationError||(error instanceof Prisma.PrismaClientKnownRequestError&&['P1001','P1002','P1008','P1017','P2024','P2028','P2034'].includes(error.code));
  const code=expected?.code??(unavailable?'UNAVAILABLE':'INTERNAL');
  console.error(JSON.stringify({requestId,operation,durationMs:Date.now()-start,code}));
  return {ok:false,error:{code,message:expected?.message??(unavailable?'No fue posible conectar. Conserva los datos y reintenta.':'No fue posible completar la operación'),...(expected?.fieldErrors?{fieldErrors:expected.fieldErrors}:{})},requestId};
 }
}
export async function queryAction(operation:QueryOperation,input:unknown):Promise<ActionResult<QueryData>> {
 if(!['clients.list','clients.get','orders.list','orders.get','expenses.list','expenses.get','products.list','products.get','audit.forEntity','audit.list','dashboard.summary'].includes(operation))return {ok:false,error:{code:'VALIDATION',message:'Operación inválida'},requestId:randomUUID()};
 return execute(operation,id=>queryForActor(id,operation,input));
}
export async function mutationAction(operation:MutationOperation,input:unknown):Promise<ActionResult<MutationReceipt>> {
 if(typeof operation!=='string'||!/^(clients|orders|expenses|products)\.(create|update|archive|restore)$/.test(operation))return {ok:false,error:{code:'VALIDATION',message:'Operación inválida'},requestId:randomUUID()};
 return execute(operation,id=>mutateForActor(id,operation,input));
}

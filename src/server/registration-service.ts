import 'server-only';
import {randomUUID} from 'node:crypto';
import {hashPassword} from 'better-auth/crypto';
import {z} from 'zod';
import {db} from './db';
import type {PrismaClient} from '@/generated/prisma/client';
import type {InitialSetupResult} from './initial-setup-service';

const fields=z.strictObject({name:z.string().trim().min(1).max(120),email:z.string().trim().toLowerCase().pipe(z.email().max(254)),password:z.string().min(12).max(128),passwordConfirmation:z.string().min(12).max(128)}).refine(v=>v.password===v.passwordConfirmation);
export function registrationOrigin(baseURL:string|undefined):string|null {
 try{const u=new URL(baseURL??'');return u.origin===baseURL&&(u.protocol==='https:'||(u.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(u.hostname)))?u.origin:null;}catch{return null;}
}
export async function registerOwner(input:unknown,origin:string|null,baseURL:string|undefined,database:PrismaClient=db):Promise<InitialSetupResult> {
 if(!registrationOrigin(baseURL)||origin!==baseURL)return {ok:false,code:'UNAVAILABLE',message:'Abre el registro desde la dirección principal de Lúmina.'};
 const parsed=fields.safeParse(input);
 if(!parsed.success)return {ok:false,code:'INVALID',message:'Revisa el nombre, correo y las contraseñas de 12 a 128 caracteres.'};
 try{
  const attempt=await database.$queryRaw<{reserved:boolean}[]>`SELECT public.reserve_public_registration_attempt() AS reserved`;
  if(!attempt[0]?.reserved)return {ok:false,code:'UNAVAILABLE',message:'Se alcanzó el límite de registros. Espera un minuto y vuelve a intentarlo.'};
  const hash=await hashPassword(parsed.data.password);
  const result=await database.$queryRaw<{created:boolean}[]>`SELECT public.register_owner_account(${randomUUID()},${parsed.data.name},${parsed.data.email},${hash}) AS created`;
  return result[0]?.created?{ok:true,message:'Cuenta creada. Ya puedes iniciar sesión.'}:{ok:false,code:'INVALID',message:'No pudimos crear la cuenta. Si ya tienes una, inicia sesión.'};
 }catch{return {ok:false,code:'UNAVAILABLE',message:'No pudimos crear la cuenta. Intenta iniciar sesión o vuelve a intentarlo.'};}
}

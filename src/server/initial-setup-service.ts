import 'server-only';
import {randomUUID,createHash,timingSafeEqual} from 'node:crypto';
import {hashPassword} from 'better-auth/crypto';
import {z} from 'zod';
import {db} from './db';
import type {PrismaClient} from '@/generated/prisma/client';

export type InitialSetupResult={ok:boolean;code?:'CLOSED'|'INVALID'|'UNAVAILABLE';message:string};
const inputSchema=z.strictObject({name:z.string().trim().min(1).max(120),email:z.email().trim().toLowerCase().max(254),password:z.string().min(12).max(128),passwordConfirmation:z.string().min(12).max(128),activationCode:z.string().max(128).optional()}).refine(v=>v.password===v.passwordConfirmation);
export function localSetupOrigin(baseURL:string|undefined):string|null {
 try{const url=new URL(baseURL??'');return url.origin===baseURL&&url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname)?url.origin:null;}catch{return null;}
}
export function setupOrigin(baseURL:string|undefined,activationToken:string|undefined):string|null {
 if(localSetupOrigin(baseURL))return baseURL!;
 try{const url=new URL(baseURL??'');return url.origin===baseURL&&url.protocol==='https:'&&/^[a-f0-9]{64}$/.test(activationToken??'')?url.origin:null;}catch{return null;}
}
export async function initialSetupAvailable(database:PrismaClient=db):Promise<boolean> {
 try{const result=await database.$queryRaw<{available:boolean}[]>`SELECT public.initial_owner_available() AS available`;return result[0]?.available===true;}catch{return false;}
}
export async function provisionInitialOwner(input:unknown,origin:string|null,baseURL:string|undefined,database:PrismaClient=db):Promise<InitialSetupResult> {
 const token=process.env['INITIAL_SETUP_TOKEN'];
 if(!setupOrigin(baseURL,token)||origin!==baseURL)return {ok:false,code:'UNAVAILABLE',message:'La creación de la primera cuenta no está disponible desde este acceso.'};
 const parsed=inputSchema.safeParse(input);
 if(!parsed.success)return {ok:false,code:'INVALID',message:'Revisa el nombre, correo y las contraseñas de 12 a 128 caracteres.'};
 if(!localSetupOrigin(baseURL)){
  const supplied=parsed.data.activationCode??'';
  if(!timingSafeEqual(createHash('sha256').update(supplied).digest(),createHash('sha256').update(token!).digest()))return {ok:false,code:'INVALID',message:'El código de activación no es válido.'};
 }
 try{
  if(!await initialSetupAvailable(database))return {ok:false,code:'CLOSED',message:'La primera cuenta ya fue creada. Inicia sesión.'};
  const attempts=await database.$queryRaw<{reserved:boolean}[]>`SELECT public.reserve_initial_owner_attempt() AS reserved`;
  if(!attempts[0]?.reserved)return {ok:false,code:'UNAVAILABLE',message:'No se pudo crear la cuenta. Espera un minuto o vuelve al inicio de sesión.'};
  // Exact default Better Auth 1.7.6 hash implementation; no custom password algorithm.
  const hashed=await hashPassword(parsed.data.password);
  const result=await database.$queryRaw<{created:boolean}[]>`SELECT public.create_initial_owner(${randomUUID()},${parsed.data.name},${parsed.data.email},${hashed}) AS created`;
  return result[0]?.created?{ok:true,message:'Cuenta creada. Ya puedes iniciar sesión.'}:{ok:false,code:'CLOSED',message:'La primera cuenta ya fue creada. Inicia sesión.'};
 }catch{return {ok:false,code:'UNAVAILABLE',message:'No se pudo crear la cuenta. Revisa que la base de datos esté disponible.'};}
}

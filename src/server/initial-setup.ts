'use server';
import {headers} from 'next/headers';
import {initialSetupAvailable,localSetupOrigin,provisionInitialOwner} from './initial-setup-service';
import type {InitialSetupResult} from './initial-setup-service';
export async function getInitialSetupStatus():Promise<{available:boolean}> {
 return {available:!!localSetupOrigin(process.env['BETTER_AUTH_URL'])&&await initialSetupAvailable()};
}
export async function createInitialOwner(input:unknown):Promise<InitialSetupResult> {
 const requestHeaders=await headers();const baseURL=process.env['BETTER_AUTH_URL'];
 const local=localSetupOrigin(baseURL);
 if(!local||requestHeaders.get('host')!==new URL(local).host||
  (requestHeaders.has('x-forwarded-host')&&requestHeaders.get('x-forwarded-host')!==new URL(local).host)||
  (requestHeaders.has('x-forwarded-proto')&&requestHeaders.get('x-forwarded-proto')!=='http'))
  return {ok:false,code:'UNAVAILABLE',message:'La configuración inicial solo está disponible desde esta aplicación local.'};
 return provisionInitialOwner(input,requestHeaders.get('origin'),baseURL);
}

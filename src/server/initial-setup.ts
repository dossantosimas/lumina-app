'use server';
import {headers} from 'next/headers';
import {initialSetupAvailable,localSetupOrigin,setupOrigin,provisionInitialOwner} from './initial-setup-service';
import type {InitialSetupResult} from './initial-setup-service';
export async function getInitialSetupStatus():Promise<{available:boolean;requiresActivationCode:boolean}> {
 const baseURL=process.env['BETTER_AUTH_URL'];
 return {available:!!setupOrigin(baseURL,process.env['INITIAL_SETUP_TOKEN'])&&await initialSetupAvailable(),requiresActivationCode:!localSetupOrigin(baseURL)};
}
export async function createInitialOwner(input:unknown):Promise<InitialSetupResult> {
 const requestHeaders=await headers();const baseURL=process.env['BETTER_AUTH_URL'];
 const local=setupOrigin(baseURL,process.env['INITIAL_SETUP_TOKEN']);
 if(!local||requestHeaders.get('host')!==new URL(local).host||
  (requestHeaders.has('x-forwarded-host')&&requestHeaders.get('x-forwarded-host')!==new URL(local).host)||
  (requestHeaders.has('x-forwarded-proto')&&requestHeaders.get('x-forwarded-proto')!==new URL(local).protocol.slice(0,-1)))
  return {ok:false,code:'UNAVAILABLE',message:'La creación de la primera cuenta no está disponible desde este acceso.'};
 return provisionInitialOwner(input,requestHeaders.get('origin'),baseURL);
}

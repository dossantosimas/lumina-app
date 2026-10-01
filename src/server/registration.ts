'use server';
import {headers} from 'next/headers';
import {registrationOrigin,registerOwner} from './registration-service';
export async function registerAccount(input:unknown) {
 const base=process.env['BETTER_AUTH_URL'],origin=registrationOrigin(base);
 const h=await headers();
 if(!origin||h.get('host')!==new URL(origin).host||(h.has('x-forwarded-host')&&h.get('x-forwarded-host')!==new URL(origin).host)||(h.has('x-forwarded-proto')&&h.get('x-forwarded-proto')!==new URL(origin).protocol.slice(0,-1)))return {ok:false,code:'UNAVAILABLE' as const,message:'Abre el registro desde la dirección principal de Lúmina.'};
 return registerOwner(input,h.get('origin'),base);
}

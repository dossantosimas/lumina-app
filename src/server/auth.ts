import 'server-only';
import {betterAuth} from 'better-auth';
import {prismaAdapter} from 'better-auth/adapters/prisma';
import {headers} from 'next/headers';
import {db} from './db';
import {DomainError} from './errors';
function configureAuth() {
 const secret=process.env['BETTER_AUTH_SECRET'];const baseURL=process.env['BETTER_AUTH_URL'];
 if(!secret || secret.length<32 || !baseURL) throw new Error('Configura BETTER_AUTH_SECRET y BETTER_AUTH_URL');
 const url=new URL(baseURL);
 if(url.origin!==baseURL || (url.protocol!=='https:' && !(url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname)))) throw new Error('Origen de autenticación inválido');
 return betterAuth({appName:'Lúmina',logger:{disabled:true},secret,baseURL,trustedOrigins:[baseURL],database:prismaAdapter(db,{provider:'postgresql'}),
 emailAndPassword:{enabled:true,disableSignUp:true,minPasswordLength:12,maxPasswordLength:128},
 user:{additionalFields:{activeAccess:{type:'boolean',defaultValue:false,input:false}}},
 session:{expiresIn:60*60*24*7,updateAge:60*60*24,cookieCache:{enabled:false}},
 rateLimit:{enabled:true,storage:'database',window:60,max:60,customRules:{'/sign-in/email':{window:60,max:5}}},
 advanced:{useSecureCookies:url.protocol==='https:',trustedProxyHeaders:false,ipAddress:{ipAddressHeaders:[]}},
 databaseHooks:{session:{create:{before:async(session)=>{const user=await db.user.findUnique({where:{id:session.userId},select:{activeAccess:true}});return user?.activeAccess?{data:session}:false;}}}},
 });
}
let authInstance:ReturnType<typeof configureAuth>|undefined;
export function getAuth() {return authInstance ??= configureAuth();}
export interface Owner {id:string;name:string;email:string}
export async function requireOwner():Promise<Owner> {
 const session=await getAuth().api.getSession({headers:await headers()});
 if(!session) throw new DomainError('UNAUTHENTICATED','Inicia sesión para continuar');
 const owner=await db.user.findUnique({where:{id:session.user.id},select:{id:true,name:true,email:true,activeAccess:true}});
 if(!owner?.activeAccess) throw new DomainError('FORBIDDEN','La cuenta no tiene acceso activo');
 return {id:owner.id,name:owner.name,email:owner.email};
}
export async function getCurrentOwner():Promise<Owner|null> {try{return await requireOwner();}catch(error){if(error instanceof DomainError)return null;throw error;}}

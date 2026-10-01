import {betterAuth} from 'better-auth';
import {prismaAdapter} from 'better-auth/adapters/prisma';
import {PrismaPg} from '@prisma/adapter-pg';
import {PrismaClient} from '../src/generated/prisma/client';
import {emitKeypressEvents} from 'node:readline';
import {createInterface} from 'node:readline/promises';
import {stdin,stdout} from 'node:process';
import {pathToFileURL} from 'node:url';
import {z} from 'zod';

export function createOperator(database:PrismaClient,secret:string,baseURL:string) {
 let resetToken:string|undefined;
 const auth=betterAuth({appName:'Lúmina operador',logger:{disabled:true},secret,baseURL,trustedOrigins:[baseURL],database:prismaAdapter(database,{provider:'postgresql'}),
  emailAndPassword:{enabled:true,disableSignUp:false,autoSignIn:false,minPasswordLength:12,maxPasswordLength:128,resetPasswordTokenExpiresIn:600,revokeSessionsOnPasswordReset:true,
   sendResetPassword:async({token})=>{resetToken=token;}},
  user:{additionalFields:{activeAccess:{type:'boolean',defaultValue:false,input:false}}},
  session:{cookieCache:{enabled:false}},rateLimit:{enabled:false},
 });
 const validEmail=(email:string)=>z.email().parse(email.trim().toLowerCase());
 const validPassword=(password:string)=>z.string().min(12).max(128).parse(password);
 return {
  async provision(name:string,email:string,password:string) {
   const created=await auth.api.signUpEmail({body:{name:z.string().trim().min(1).max(120).parse(name),email:validEmail(email),password:validPassword(password)}});
   await database.$transaction(async tx=>{
    await tx.$queryRaw`SELECT id FROM "user" WHERE id=${created.user.id} FOR UPDATE`;
    await tx.user.update({where:{id:created.user.id},data:{activeAccess:true}});
    await tx.session.deleteMany({where:{userId:created.user.id}});
   });
  },
  async reset(email:string,password:string) {
   resetToken=undefined;const normalized=validEmail(email);validPassword(password);
   const user=await database.user.findUnique({where:{email:normalized},select:{id:true}});if(!user)throw new Error('Operación no disponible');
   await auth.api.requestPasswordReset({body:{email:normalized}});
   const token=resetToken;resetToken=undefined;if(!token)throw new Error('Operación no disponible');
   await auth.api.resetPassword({body:{token,newPassword:password}});
  },
  async revoke(email:string) {
   await database.$transaction(async tx=>{
    const user=await tx.user.findUnique({where:{email:validEmail(email)},select:{id:true}});if(!user)throw new Error('Operación no disponible');
    await tx.$queryRaw`SELECT id FROM "user" WHERE id=${user.id} FOR UPDATE`;
    await tx.user.update({where:{id:user.id},data:{activeAccess:false}});
    await tx.session.deleteMany({where:{userId:user.id}});
   });
  },
 };
}
async function hiddenPrompt(label:string):Promise<string> {
 if(!stdin.isTTY || !stdout.isTTY)throw new Error('El operador requiere terminal interactiva');
 stdout.write(label);emitKeypressEvents(stdin);stdin.setRawMode(true);stdin.resume();
 return new Promise((resolve,reject)=>{
  let value='';
  const cleanup=()=>{stdin.off('keypress',onKey);stdin.setRawMode(false);stdin.pause();stdout.write('\n');};
  const onKey=(text:string|undefined,key:{name?:string;ctrl?:boolean;meta?:boolean})=>{
   if(key.ctrl&&key.name==='c'){cleanup();reject(new Error('Cancelado'));}
   else if(key.name==='return'){cleanup();resolve(value);}
   else if(key.name==='backspace')value=value.slice(0,-1);
   else if(text&&!key.ctrl&&!key.meta&&!text.startsWith('\u001b')&&value.length<128)value+=text;
  };
  stdin.on('keypress',onKey);
 });
}
async function main() {
 if(process.argv.length!==3 || !['provision','reset','revoke'].includes(process.argv[2]??''))throw new Error('Uso: auth:operator provision|reset|revoke. Los datos se introducen mediante prompts.');
 if(!stdin.isTTY || !stdout.isTTY)throw new Error('Se requiere una terminal interactiva');
 const url=process.env['DIRECT_URL'],secret=process.env['BETTER_AUTH_SECRET'],baseURL=process.env['BETTER_AUTH_URL'];
 if(!url||!secret||secret.length<32||!baseURL)throw new Error('Falta configuración del operador');
 const database=new PrismaClient({adapter:new PrismaPg({connectionString:url,max:2})});
 const visible=createInterface({input:stdin,output:stdout});
 try {
  if(await visible.question('Confirma identidad del dueño por un canal conocido. Escribe VERIFICADO: ')!=='VERIFICADO')throw new Error('Cancelado');
  const email=await visible.question('Correo del dueño: ');
  const name=process.argv[2]==='provision'?await visible.question('Nombre del dueño: '):'';
  visible.close();
  const operator=createOperator(database,secret,baseURL);
  if(process.argv[2]==='revoke')await operator.revoke(email);
  else {const password=await hiddenPrompt('Contraseña nueva (12–128 caracteres): ');const confirm=await hiddenPrompt('Confirmación: ');if(password!==confirm)throw new Error('Las contraseñas no coinciden');if(process.argv[2]==='provision')await operator.provision(name,email,password);else await operator.reset(email,password);}
  console.log('Operación de acceso completada.');
 } finally{visible.close();await database.$disconnect();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(()=>{console.error('No se completó la operación. Revisa los datos y la configuración del operador.');process.exitCode=1;});

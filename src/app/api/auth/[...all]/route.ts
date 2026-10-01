import {getAuth} from '@/server/auth';
export const runtime='nodejs';
async function handle(request:Request):Promise<Response> {
 const path=new URL(request.url).pathname;
 const allowed=(request.method==='POST' && ['/api/auth/sign-in/email','/api/auth/sign-out'].includes(path))||(request.method==='GET'&&path==='/api/auth/get-session');
 if(!allowed) return Response.json({error:'Ruta no disponible'},{status:404});
 return getAuth().handler(request);
}
export const GET=handle;
export const POST=handle;
export const PUT=handle;
export const PATCH=handle;
export const DELETE=handle;

import {readFileSync} from 'node:fs';
import {config} from 'dotenv';
import setup from './e2e-setup';
if(process.argv.includes('--prepare')){await setup();}
else{
 config({path:'.runtime/test.env',override:true,quiet:true});
 const url=new URL(process.env['DATABASE_URL']??'');
 if(url.pathname!=='/lumina_test'||url.hostname!=='127.0.0.1')throw new Error('Restore auth proof requires local QA credentials');
 url.pathname='/lumina_restore_test';process.env['DATABASE_URL']=url.href;
 const {getAuth}=await import('../../src/server/auth');const {db}=await import('../../src/server/db');
 try{
  const account=JSON.parse(readFileSync('.runtime/qa-account.json','utf8'))[0] as {email:string;password:string;id:string};
  const response=await getAuth().handler(new Request('http://localhost:3001/api/auth/sign-in/email',{method:'POST',headers:{'Content-Type':'application/json',origin:'http://localhost:3001'},body:JSON.stringify({email:account.email,password:account.password})}));
  if(response.status!==200)throw new Error('Synthetic restored owner could not login');
  const headers=new Headers({cookie:response.headers.getSetCookie().map((c:string)=>c.split(';')[0]).join('; ')});
  const session=await getAuth().api.getSession({headers});
  if(session?.user.id!==account.id)throw new Error('Restored session not admitted');
  const {queryForActor}=await import('../../src/server/queries');const expectedOrders=Number(process.env['QA_RESTORE_ORDER_COUNT']);const expectedProducts=Number(process.env['QA_RESTORE_PRODUCT_COUNT']);
  if(!Number.isSafeInteger(expectedOrders)||expectedOrders<1||!Number.isSafeInteger(expectedProducts)||expectedProducts<0)throw new Error('Missing source counts for isolated restore proof');
  const result=await queryForActor(account.id,'orders.list',{archived:'all'});
  if(!('total' in result)||result.total!==expectedOrders)throw new Error('Restored owner cannot read all original synthetic orders');
  const products=await queryForActor(account.id,'products.list',{archived:'all'});
  if(!('total' in products)||products.total!==expectedProducts)throw new Error('Restored owner cannot read all original synthetic products');
 }finally{await db.$disconnect();}
}

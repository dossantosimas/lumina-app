import {readFileSync} from 'node:fs';
import {parse} from 'dotenv';
import {Client} from 'pg';
import {createDatabase} from '@/server/db';
export function testEnvironment(path='.runtime/test-migrator.env') {
 const env=parse(readFileSync(path));const url=new URL(env['DATABASE_URL']??'');
 if(url.pathname!=='/lumina_test'||!['localhost','127.0.0.1'].includes(url.hostname))throw new Error('Refusing QA outside local lumina_test');
 return env;
}
export const migrator=createDatabase(testEnvironment()['DATABASE_URL']!);
export async function sqlAdmin<T>(work:(client:Client)=>Promise<T>) {
 const client=new Client({connectionString:testEnvironment()['DATABASE_URL']});
 await client.connect();try{return await work(client);}finally{await client.end();}
}
export async function clearDomain() {
 // Fixed identifiers and a validated isolated test database. Never production.
 await sqlAdmin(client=>client.query('TRUNCATE audit_events,idempotency_records,sales_order_lines,sales_orders,expenses,customers,products CASCADE'));
}

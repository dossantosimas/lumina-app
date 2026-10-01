import 'server-only';
import {PrismaClient} from '@/generated/prisma/client';
import {PrismaPg} from '@prisma/adapter-pg';
const globalDB=globalThis as typeof globalThis & {luminaDB?:PrismaClient};
export function createDatabase(url:string):PrismaClient {return new PrismaClient({adapter:new PrismaPg({connectionString:url,max:5,connectionTimeoutMillis:5000})});}
export const db=globalDB.luminaDB ?? createDatabase(process.env['DATABASE_URL'] || 'postgresql://invalid:invalid@localhost:5432/invalid');
if(process.env['NODE_ENV']!=='production') globalDB.luminaDB=db;

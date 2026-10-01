import {describe,it,expect} from 'vitest';
import {productFields,orderFields,dateOnly,dashboardRangeSchema} from '@/lib/validation';
import {randomUUID} from 'node:crypto';
describe('catalog and analytics input limits',()=>{
 it('normalizes positive product prices and optional description',()=>expect(productFields.parse({name:' Lavanda ',price:'25000',description:' '})).toEqual({name:'Lavanda',price:'25000.00',description:null}));
 it.each(['0','-1','0.001','1e3'])('rejects invalid catalog price %s',price=>expect(productFields.safeParse({name:'Vela',price}).success).toBe(false));
 it('rejects oversized names/descriptions and browser authority',()=>{
  expect(productFields.safeParse({name:'x'.repeat(121),price:'1'}).success).toBe(false);
  expect(productFields.safeParse({name:'Vela',price:'1',description:'x'.repeat(2001)}).success).toBe(false);
  expect(productFields.safeParse({name:'Vela',price:'1',activeAccess:true}).success).toBe(false);
 });
 it('accepts free lines and optional catalog references',()=>{
  const base={customerId:randomUUID(),orderDate:'2026-10-01',lines:[{description:'Vela personalizada',quantity:1,unitPrice:'0.10'}]};
  expect(orderFields.parse(base).lines[0]?.productId).toBe(null);
  const productId=randomUUID();expect(orderFields.parse({...base,lines:[{...base.lines[0],productId}]}).lines[0]?.productId).toBe(productId);
  expect(orderFields.safeParse({...base,lines:[{...base.lines[0],productId:'invalid'}]}).success).toBe(false);
 });
 it('rejects PostgreSQL year zero and excessive dashboard ranges without changing list range rules',()=>{
  expect(dateOnly.safeParse('0000-01-01').success).toBe(false);
  expect(dashboardRangeSchema.safeParse({from:'1900-01-01',to:'2100-01-01'}).success).toBe(false);
  expect(dashboardRangeSchema.safeParse({from:'2024-02-01',to:'2024-02-29'}).success).toBe(true);
 });
});

import {describe,it,expect} from 'vitest';
import {calculateLines,toCents,fromCents} from '@/lib/money';
import {clientFields,dateOnly,expenseFields,orderFields,rangeSchema,mutationSchemas} from '@/lib/validation';
import {randomUUID} from 'node:crypto';
describe('COP exact money REQ-007 AC-007/010',()=>{
 it('retains fractional COP exactly and computes the approved multiline example',()=>{
  expect(calculateLines([{quantity:2,unitPrice:'25000.00'},{quantity:1,unitPrice:'35000.00'}])).toBe('85000.00');
  expect(calculateLines([{quantity:3,unitPrice:'0.10'},{quantity:1,unitPrice:'0.20'}])).toBe('0.50');
 });
 it('permits courtesy only when another line produces a positive total',()=>{
  expect(calculateLines([{quantity:2,unitPrice:'0'},{quantity:1,unitPrice:'1'}])).toBe('1.00');
  expect(()=>calculateLines([{quantity:1,unitPrice:'0'}])).toThrow();
 });
 it('rejects multiplication overflow and addition overflow',()=>{
  expect(()=>calculateLines([{quantity:2,unitPrice:'999999999999.99'}])).toThrow();
  expect(()=>calculateLines([{quantity:1,unitPrice:'999999999999.99'},{quantity:1,unitPrice:'0.01'}])).toThrow();
  expect(calculateLines([{quantity:1,unitPrice:'999999999999.99'}])).toBe('999999999999.99');
 });
 it.each(['-1','1.001','NaN','Infinity','1e3','25,50','25,000.00',' 1','01','1000000000000'])('rejects ambiguous/invalid decimal %s',value=>expect(()=>toCents(value)).toThrow());
 it('allows aggregate totals beyond individual bounds and negative differences',()=>{
  expect(fromCents(199999999999998n)).toBe('1999999999999.98');
  expect(fromCents(-3000n)).toBe('-30.00');
 });
});
describe('business input contracts AC-004/010/011',()=>{
 const order={customerId:randomUUID(),orderDate:'2026-09-30',lines:[{description:'Vainilla mediana',quantity:1,unitPrice:'25.50'}]};
 it('normalizes optional emptiness without discarding names',()=>expect(clientFields.parse({name:' Ana ',contact:' ',notes:''})).toEqual({name:'Ana',contact:null,notes:null}));
 it.each(['2026-02-29','2026-04-31','2026-13-01','30/09/2026'])('rejects nonexistent date %s',value=>expect(dateOnly.safeParse(value).success).toBe(false));
 it('accepts leap date and rejects reversed inclusive range',()=>{
  expect(dateOnly.parse('2024-02-29')).toBe('2024-02-29');
  expect(rangeSchema.safeParse({from:'2026-10-01',to:'2026-09-30'}).success).toBe(false);
 });
 it.each([0,-1,0.5,10001])('rejects quantity %s',quantity=>expect(orderFields.safeParse({...order,lines:[{...order.lines[0],quantity}]}).success).toBe(false));
 it('rejects empty lines, whitespace descriptions and more than 100 lines',()=>{
  expect(orderFields.safeParse({...order,lines:[]}).success).toBe(false);
  expect(orderFields.safeParse({...order,lines:[{...order.lines[0],description:' '}]}).success).toBe(false);
  expect(orderFields.safeParse({...order,lines:Array.from({length:101},()=>order.lines[0])}).success).toBe(false);
 });
 it.each(['0','-1','1.001'])('rejects expense total %s',amount=>expect(expenseFields.safeParse({expenseDate:'2026-09-30',concept:'Cera',amount}).success).toBe(false));
 it('rejects browser authority over total/admission/resulting version',()=>{
  expect(mutationSchemas['orders.create'].safeParse({...order,idempotencyKey:randomUUID(),total:'1'}).success).toBe(false);
  expect(clientFields.safeParse({name:'Ana',activeAccess:true}).success).toBe(false);
 });
});

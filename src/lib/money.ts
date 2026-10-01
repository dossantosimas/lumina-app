export const MAX_CENTS = 99999999999999n;
export function toCents(value: string): bigint {
  if (!/^(0|[1-9]\d{0,11})(\.\d{1,2})?$/.test(value)) throw new Error('Importe decimal inválido');
  const [whole = '0', fraction = ''] = value.split('.');
  const result = BigInt(whole) * 100n + BigInt(fraction.padEnd(2,'0'));
  if (result > MAX_CENTS) throw new Error('Importe fuera del límite');
  return result;
}
export function fromCents(value: bigint): string {
  const sign = value < 0n ? '-' : ''; const absolute = value < 0n ? -value : value;
  return `${sign}${absolute / 100n}.${(absolute % 100n).toString().padStart(2,'0')}`;
}
export function calculateLines(lines:{quantity:number;unitPrice:string}[]):string {
  let total = 0n;
  for(const line of lines) {
    const subtotal = toCents(line.unitPrice) * BigInt(line.quantity);
    if(subtotal>MAX_CENTS) throw new Error('Subtotal fuera del límite');
    total += subtotal;
  }
  if(total<=0n || total>MAX_CENTS) throw new Error('Total debe ser positivo y estar dentro del límite');
  return fromCents(total);
}

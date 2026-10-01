'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import type { ClientDTO, OrderDTO, ExpenseDTO, ProductDTO } from '@/lib/contracts';
export type RecordDTO = ClientDTO | OrderDTO | ExpenseDTO | ProductDTO;
export type Resource = 'clients' | 'orders' | 'expenses' | 'products';
export const routes = { clients: '/clientes', orders: '/pedidos', expenses: '/gastos', products:'/productos' };
export const names = { clients: 'Clientes', orders: 'Pedidos', expenses: 'Gastos', products:'Productos' };
export function title(row: RecordDTO) { return 'name' in row ? row.name : 'concept' in row ? row.concept : row.customerNameSnapshot; }
export function money(value: string) { const negative = value.startsWith('-'); const [whole, decimal = '00'] = value.replace('-', '').split('.'); return `${negative ? '− ' : ''}COP ${BigInt(whole || '0').toLocaleString('es-CO')}${decimal === '00' ? '' : ',' + decimal}`; }
export function minor(value: string) { if (!/^\d+(,\d{1,2})?$/.test(value))
    return null; const [a, b = ''] = value.split(','); return BigInt(a) * 100n + BigInt(b.padEnd(2, '0')); }
export function canonical(value: string) { const v = minor(value); if (v === null)
    throw new Error('Escribe dígitos y coma decimal, sin separadores de miles'); return `${v / 100n}.${(v % 100n).toString().padStart(2, '0')}`; }
export function today() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
export function date(value: string) { return value.split('-').reverse().join('/'); }
export function Icon({ name }: {
    name: string;
}) { const paths: Record<string, ReactNode> = { Productos: <><path d="M4 7h16v14H4zM4 7l4-4h8l4 4M12 7v14"/></>, Más:<><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>, Resumen: <><path d="M3 12h5v9H3zM10 3h5v18h-5zM17 8h4v13h-4z"/></>, Pedidos: <><path d="M6 3h12v18H6zM9 8h6M9 12h6M9 16h4"/></>, Clientes: <><circle cx="12" cy="7" r="4"/><path d="M4 21v-3a8 8 0 0 1 16 0v3"/></>, Gastos: <><path d="M3 5h18v14H3zM3 9h18"/><path d="M15 14h3"/></> }; return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">{paths[name] ?? <path d="M12 5v14M5 12h14"/>}</svg>; }
export function Dialog({ title, children, onClose }: {
    title: string;
    children: ReactNode;
    onClose: () => void;
}) { const ref = useRef<HTMLDialogElement>(null); useEffect(() => {
    const previous = document.activeElement;
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
        // Release the native modal's inert background before restoring its opener.
        dialog?.close();
        if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
}, []); return <dialog ref={ref} onCancel={e => { e.preventDefault(); onClose(); }} aria-labelledby="dialog-title"><div className="dialog-head"><h2 id="dialog-title">{title}</h2><button type="button" onClick={onClose} aria-label="Cerrar diálogo">×</button></div>{children}</dialog>; }
export function Status({ children, error = false }: {
    children: ReactNode;
    error?: boolean;
}) { return <div className={error ? 'notice error' : 'notice'} role={error ? 'alert' : 'status'}>{children}</div>; }

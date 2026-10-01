'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { queryAction, mutationAction } from '@/server/actions';
import type { ActionResult, AuditDTO, PageDTO, QueryData } from '@/lib/contracts';
import { type Resource, type RecordDTO, title, routes, date, money, Dialog, Status } from './ui';
import { ResourceList } from './resource-list';
import { LoginForm } from './login-form';
export function RecordDetail({ resource, initial, saved = false, returnTo }: {
    resource: Resource;
    initial: ActionResult<QueryData>;
    saved?: boolean;
    returnTo?: string;
}) { const router = useRouter(); const back = returnTo && (returnTo === routes[resource] || returnTo.startsWith(routes[resource] + '?')) ? returnTo : routes[resource]; const [conflict, setConflict] = useState(false); const [result, setResult] = useState(initial); const [confirm, setConfirm] = useState(false); const [busy, setBusy] = useState(false); const [message, setMessage] = useState(''); const [history, setHistory] = useState<ActionResult<QueryData> | null>(null); const [historyBusy, setHistoryBusy] = useState(false); const [associated, setAssociated] = useState<ActionResult<QueryData> | null>(null); const [login, setLogin] = useState(false); const [uncertain, setUncertain] = useState(false); const intent = useRef<{
    id: string;
    expectedVersion: number;
    idempotencyKey: string;
    restore: boolean;
} | null>(null); const row = result.ok ? result.data as RecordDTO : null; async function refresh() { const r = await queryAction(`${resource}.get`, { id: row?.id }); setResult(r); if(r.ok){setConflict(false);if(conflict)setMessage('');setHistory(null);intent.current=null;} } async function toggle() { if (!row)
    return; if (!intent.current)
    intent.current = { id: row.id, expectedVersion: row.version, idempotencyKey: crypto.randomUUID(), restore: row.archived }; setBusy(true); try {
    const { restore, ...input } = intent.current;
    const r = await mutationAction(`${resource}.${restore ? 'restore' : 'archive'}`, input);
    if (r.ok) {
        setMessage(restore ? 'Registro restaurado' : 'Registro archivado');
        setUncertain(false);
        intent.current = null;
        setConfirm(false);
        await refresh();
        router.refresh();
    }
    else {
        setMessage(r.error.message); if(r.error.code === 'CONFLICT') setConflict(true);
        if (r.error.code === 'UNAUTHENTICATED') {
            setLogin(true);
            setUncertain(true);
        }
        else if (['INTERNAL', 'UNAVAILABLE'].includes(r.error.code))
            setUncertain(true);
        else {
            intent.current = null;
            setUncertain(false);
        }
    }
}
catch {
    setUncertain(true);
    setMessage('El resultado no está confirmado. Reintenta para comprobar la misma operación.');
}
finally {
    setBusy(false);
} } async function loadHistory(page = 1) { if (!row)
    return; setHistoryBusy(true); try {
    setHistory(await queryAction('audit.forEntity', { entityType: resource === 'clients' ? 'CUSTOMER' : resource === 'orders' ? 'ORDER' : resource === 'products' ? 'PRODUCT' : 'EXPENSE', entityId: row.id, page, pageSize: 20 }));
}
catch {
    setMessage('No pudimos cargar el historial. Inténtalo de nuevo.');
}
finally {
    setHistoryBusy(false);
} } return <>{!row ? <Status error>{!result.ok ? result.error.message : 'Este registro no está disponible'} <Link href={back}>Volver a la lista</Link></Status> : <><Link className="back-link" href={back}>← Volver a {resource === 'clients' ? 'clientes' : resource === 'orders' ? 'pedidos' : resource === 'products' ? 'productos' : 'gastos'}</Link><div className="page-head"><div><p className="eyebrow">{row.archived ? 'REGISTRO ARCHIVADO' : 'DETALLE DEL REGISTRO'}</p><h1>{title(row)}</h1></div><div className="head-actions">{!row.archived && <Link className="button primary" href={routes[resource] + '/' + row.id + '/editar'}>Editar</Link>}<button onClick={() => setConfirm(true)} disabled={busy}>{row.archived ? 'Restaurar' : 'Archivar'}</button></div></div>{saved && <Status>Registro guardado.</Status>}{message && <Status error={uncertain || conflict}>{message}{conflict && <button onClick={() => void refresh()}>Actualizar registro</button>}</Status>}<section className="detail-panel">{'contact' in row && <dl><div><dt>Contacto</dt><dd>{row.contact || 'Sin contacto'}</dd></div><div><dt>Notas</dt><dd>{row.notes || 'Sin notas'}</dd></div></dl>}{'price' in row && <><div className="detail-amount">{money(row.price)}</div><dl><div><dt>Descripción</dt><dd>{row.description||'Sin descripción'}</dd></div></dl></>}{'concept' in row && <><div className="detail-amount">{money(row.amount)}</div><dl><div><dt>Fecha</dt><dd>{date(row.expenseDate)}</dd></div><div><dt>Proveedor</dt><dd>{row.supplier || 'Sin proveedor'}</dd></div><div><dt>Referencia de factura</dt><dd>{row.invoiceReference || 'Sin referencia'}</dd></div></dl></>}{'lines' in row && <><dl className="inline-details"><div><dt>Cliente</dt><dd><Link href={'/clientes/' + row.customerId}>{row.customerNameSnapshot}</Link>{row.customerArchived && <span className="badge">Cliente archivado</span>}</dd></div><div><dt>Fecha del pedido</dt><dd>{date(row.orderDate)}</dd></div></dl><h2>Velas del pedido</h2><ul className="detail-lines">{row.lines.map(l => <li key={l.id}><div><strong>{l.description}</strong><small>{l.quantity} × {money(l.unitPrice)}</small></div><strong className="money">{money(l.subtotal)}</strong></li>)}</ul><div className="order-total"><span>Total</span><strong>{money(row.total)}</strong></div>{row.notes && <dl><dt>Notas</dt><dd>{row.notes}</dd></dl>}</>}</section>{resource === 'clients' && <section className="secondary-section"><div className="section-head"><h2>Pedidos de este cliente</h2><button onClick={async () => { setAssociated(await queryAction('orders.list', { customerId: row.id, archived: 'all', page: 1, pageSize: 20 })); }}>Consultar pedidos</button></div>{associated && <ResourceList resource="orders" customerId={row.id} initial={associated}/>}</section>}<section className="secondary-section"><div className="section-head"><h2>Historial de cambios</h2><button disabled={historyBusy} onClick={() => void loadHistory()}>{historyBusy ? 'Cargando…' : 'Consultar historial'}</button></div>{history && !history.ok && <Status error>{history.error.message}</Status>}{history?.ok && <History data={history.data as PageDTO<AuditDTO>} onPage={page => void loadHistory(page)} busy={historyBusy}/>}</section>{confirm && <Dialog title={row.archived ? '¿Restaurar este registro?' : '¿Archivar este registro?'} onClose={() => { if (!busy)
    setConfirm(false); }}><p>{row.archived ? 'Volverá a aparecer en las listas activas.' : resource === 'products' ? 'Dejará de estar disponible para pedidos nuevos. Los pedidos históricos conservarán su descripción y precio.' : resource === 'clients' ? 'Dejará de estar disponible para pedidos nuevos. Los pedidos históricos conservarán su cliente.' : 'Dejará de aparecer en las listas activas y el resumen. Puedes restaurarlo después.'}</p>{uncertain && <Status error>{message}</Status>}<div className="form-actions"><button disabled={busy} onClick={() => setConfirm(false)}>Cancelar</button><button className="primary" disabled={busy} onClick={() => void toggle()}>{busy ? 'Guardando…' : uncertain ? 'Comprobar y reintentar' : row.archived ? 'Restaurar' : 'Archivar'}</button></div></Dialog>}{login && <Dialog title="Vuelve a iniciar sesión" onClose={() => setLogin(false)}><LoginForm onSuccess={() => { setLogin(false); void toggle(); }}/></Dialog>}</>}</>; }
const auditLabels: Record<string, string> = { price:'Precio',productId:'Producto del catálogo',name: 'Nombre', orderDate: 'Fecha del pedido', expenseDate: 'Fecha del gasto', concept: 'Concepto', amount: 'Importe', total: 'Total', archived: 'Archivado', customerNameSnapshot: 'Cliente', customerId: 'Identificador del cliente', contactChanged: 'Contacto modificado', notesChanged: 'Notas modificadas', supplier: 'Proveedor', invoiceReference: 'Referencia de factura', description: 'Descripción', quantity: 'Cantidad', unitPrice: 'Precio unitario', subtotal: 'Subtotal', position: 'Posición', version: 'Versión', lines: 'Velas' };
function BusinessSnapshot({ value }: {
    value: unknown;
}) { if (value === null || value === undefined)
    return <p className="muted">Sin datos previos</p>; if (typeof value !== 'object')
    return <span>{String(value)}</span>; if (Array.isArray(value))
    return <ol>{value.map((v, i) => <li key={i}><BusinessSnapshot value={v}/></li>)}</ol>; return <dl>{Object.entries(value as Record<string, unknown>).filter(([k]) => k !== 'id').map(([k, v]) => <div key={k}><dt>{auditLabels[k] ?? k}</dt><dd>{typeof v === 'boolean' ? (v ? 'Sí' : 'No') : typeof v === 'object' ? <BusinessSnapshot value={v}/> : String(v ?? '—')}</dd></div>)}</dl>; }
function History({ data, onPage, busy }: {
    data: PageDTO<AuditDTO>;
    onPage: (page: number) => void;
    busy: boolean;
}) { const actionLabels: Record<string, string> = { CREATE: 'Creado', UPDATE: 'Editado', ARCHIVE: 'Archivado', RESTORE: 'Restaurado', create: 'Creado', update: 'Editado', archive: 'Archivado', restore: 'Restaurado' }; return <>{data.items.length === 0 && <p className="empty">Sin cambios registrados.</p>}<ol className="history-list">{data.items.map(a => <li key={a.id}><div><strong>{actionLabels[a.action] ?? a.action}</strong><small>{a.actorNameSnapshot} · {new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(a.occurredAt))}</small></div><details><summary>Ver cambios · versión {a.resultingVersion}</summary><div className="compare"><section><h3>Antes</h3><BusinessSnapshot value={a.before}/></section><section><h3>Después</h3><BusinessSnapshot value={a.after}/></section></div></details></li>)}</ol><div className="pagination"><button disabled={busy || data.page <= 1} onClick={() => onPage(data.page - 1)}>Anterior</button><span>Página {data.page}</span><button disabled={busy || data.page * data.pageSize >= data.total} onClick={() => onPage(data.page + 1)}>Siguiente</button></div></>; }

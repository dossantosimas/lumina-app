'use client';
import Link from 'next/link';
import { EvolutionChart } from './evolution-chart';
import { useState } from 'react';
import { queryAction } from '@/server/actions';
import type { ActionResult, DashboardDTO, QueryData } from '@/lib/contracts';
import { money, date, Status } from './ui';
export function Dashboard({ initial, from, to }: {
    initial: ActionResult<QueryData>;
    from: string;
    to: string;
}) { const [result, setResult] = useState(initial); const [busy, setBusy] = useState(false); const [range, setRange] = useState({ from, to }); async function load() { if (range.from > range.to)
    return; setBusy(true); try {
    setResult(await queryAction('dashboard.summary', range));
}
catch {
    setResult({ ok: false, error: { code: 'UNAVAILABLE', message: 'No pudimos cargar los datos. Inténtalo de nuevo.' }, requestId: '' });
}
finally {
    setBusy(false);
} } const data = result.ok ? result.data as DashboardDTO : null; return <><div className="page-head"><div><p className="eyebrow">TU NEGOCIO AL DÍA</p><h1>Resumen</h1></div><Link className="button primary" href="/pedidos/nuevo">Nuevo pedido <span aria-hidden="true">+</span></Link></div><form className="filters" onSubmit={e => { e.preventDefault(); void load(); }}><label>Desde<input type="date" required value={range.from} onChange={e => setRange({ ...range, from: e.target.value })}/></label><label>Hasta<input type="date" required value={range.to} onChange={e => setRange({ ...range, to: e.target.value })}/></label><button disabled={busy || range.from > range.to}>Consultar</button></form>{range.from > range.to && <Status error>Desde debe ser anterior o igual a Hasta.</Status>}{busy && <Status>Cargando resumen…</Status>}{!result.ok && <Status error>{result.error.message} <button onClick={() => void load()}>Reintentar</button></Status>}{data && <><section className="metrics" aria-label="Valores registrados"><div><span>Pedidos registrados</span><strong className="metric-orders">{money(data.totalOrders)}</strong><small>{data.counts.orders} pedidos</small></div><div><span>Gastos registrados</span><strong className="metric-expenses">{money(data.totalExpenses)}</strong><small>{data.counts.expenses} gastos</small></div><div><span>Diferencia registrada</span><strong className="metric-difference">{money(data.difference)}</strong><small>No representa utilidad contable ni saldo de caja.</small></div></section><EvolutionChart data={data}/><div className="recent-grid"><section className="recent-section"><div className="section-head"><h2>Últimos pedidos</h2><Link href="/pedidos">Ver todos</Link></div>{data.recentOrders.length ? <ul className="recent-list">{data.recentOrders.map(r => <li key={r.id}><Link href={'/pedidos/' + r.id}><span><strong>{r.customerNameSnapshot}</strong><small>{date(r.orderDate)}</small></span><span className="money">{money(r.total)}</span></Link></li>)}</ul> : <p className="empty">No hay pedidos en este periodo.</p>}</section><section className="recent-section"><div className="section-head"><h2>Últimos gastos</h2><Link href="/gastos/nuevo">Registrar gasto</Link></div>{data.recentExpenses.length ? <ul className="recent-list">{data.recentExpenses.map(r => <li key={r.id}><Link href={'/gastos/' + r.id}><span><strong>{r.concept}</strong><small>{date(r.expenseDate)}</small></span><span className="money">{money(r.amount)}</span></Link></li>)}</ul> : <p className="empty">No hay gastos en este periodo.</p>}</section></div></>}</>; }

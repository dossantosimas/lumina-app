'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';

import { useRouter } from 'next/navigation';

import { mutationAction, queryAction } from '@/server/actions';

import type { ClientDTO, ProductDTO, MutationOperation, MutationReceipt, ActionResult, PageDTO } from '@/lib/contracts';

import { canonical, minor, money, today, Dialog, Status, routes, type Resource, type RecordDTO } from './ui';

import { SearchCombobox, type Choice } from './search-combobox';

import { LoginForm } from './login-form';

interface Line {

    key: string;

    productId: string | null;
    productLabel?: string;

    description: string;

    quantity: string;

    unitPrice: string;

}

interface Draft {

    name: string;

    price: string;

    description: string;

    contact: string;

    notes: string;

    customerId: string;

    orderDate: string;

    expenseDate: string;

    concept: string;

    amount: string;

    supplier: string;

    invoiceReference: string;

    lines: Line[];

}

function initialDraft(record?: RecordDTO): Draft { const c = record && 'contact' in record ? record : undefined; const p = record && 'price' in record ? record : undefined; const o = record && 'lines' in record ? record : undefined; const x = record && 'concept' in record ? record : undefined; return { name: c?.name ?? p?.name ?? '', price:p?.price.replace('.',',')??'', description:p?.description??'', contact: c?.contact ?? '', notes: c?.notes ?? o?.notes ?? '', customerId: o?.customerId ?? '', orderDate: o?.orderDate ?? today(), expenseDate: x?.expenseDate ?? today(), concept: x?.concept ?? '', amount: x?.amount.replace('.', ',') ?? '', supplier: x?.supplier ?? '', invoiceReference: x?.invoiceReference ?? '', lines: o?.lines.map(l => ({ key: l.id, productId:l.productId||null, description: l.description, quantity: String(l.quantity), unitPrice: l.unitPrice.replace('.', ',') })) ?? [{ key: crypto.randomUUID(), productId:null, description: '', quantity: '1', unitPrice: '' }] }; }

export function RecordForm({ resource, record, clients = [] }: {

    resource: Resource;

    record?: RecordDTO;

    clients?: ClientDTO[];

}) {

    const router = useRouter();

    const [draft, setDraft] = useState(() => initialDraft(record));

    const [errors, setErrors] = useState<Record<string, string[]>>({});

    const [message, setMessage] = useState('');

    const [busy, setBusy] = useState(false);

    const [uncertain, setUncertain] = useState(false);

    const [login, setLogin] = useState(false);

    const [online, setOnline] = useState(true);

    const [customerOptions, setCustomerOptions] = useState(clients);



    const [newClient, setNewClient] = useState(false);

    const [leave, setLeave] = useState(false);

    const [latest, setLatest] = useState<RecordDTO | null>(null);

    const [compare, setCompare] = useState(false);

    const [dirty, setDirty] = useState(false); const [duplicates, setDuplicates] = useState<ClientDTO[]>([]); const duplicateAcknowledgment = useRef('');

    const [leaveTarget, setLeaveTarget] = useState<string | null>(null);

    const pending = useRef<{

        op: MutationOperation;

        input: Record<string, unknown>;

    } | null>(null);

    const success = useRef(false); const submitting = useRef(false);

    useEffect(() => { const update = () => setOnline(navigator.onLine); update(); window.addEventListener('online', update); window.addEventListener('offline', update); const before = (e: BeforeUnloadEvent) => { if (dirty && !success.current) {

        e.preventDefault();

    } }; const navigation = (e: MouseEvent) => { if (!dirty || success.current || e.defaultPrevented)

        return; const element = e.target; if (!(element instanceof Element))

        return; const anchor = element.closest('a'); if (!anchor || !anchor.href || anchor.hash || anchor.target === '_blank')

        return; const url = new URL(anchor.href); if (url.origin !== window.location.origin)

        return; e.preventDefault(); setLeaveTarget(url.pathname + url.search); setLeave(true); }; document.addEventListener('click', navigation, true); window.addEventListener('beforeunload', before); return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); window.removeEventListener('beforeunload', before); document.removeEventListener('click', navigation, true); }; }, [dirty]);

    function change<K extends keyof Draft>(key: K, value: Draft[K]) { if (uncertain)

        return; setDraft(prev => ({ ...prev, [key]: value })); setDirty(true); }

    function lineChange(index: number, key: Exclude<keyof Line, 'key'>, value: string) { change('lines', draft.lines.map((l, i) => i === index ? { ...l, [key]: value } : l)); }

    const parts = draft.lines.map(l => { const p = minor(l.unitPrice); const q = /^\d+$/.test(l.quantity) ? BigInt(l.quantity) : 0n; return p === null ? null : p * q; });

    const total = parts.every(p => p !== null) ? parts.reduce<bigint>((s, v) => s + (v ?? 0n), 0n) : null;

    const moneyText = (v: bigint) => `${v / 100n}.${(v % 100n).toString().padStart(2, '0')}`;

    function field(label: string, key: Exclude<keyof Draft, 'lines'>, options: {

        required?: boolean;

        max?: number;

        type?: string;

        money?: boolean;

        textarea?: boolean;

    } = {}) { const id = `field-${key}`; return <label htmlFor={id}>{label}{!options.required && <small>Opcional</small>}{options.textarea ? <textarea id={id} value={draft[key]} maxLength={options.max} onChange={e => change(key, e.target.value)} aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? id + '-error' : undefined}/> : <input id={id} type={options.type ?? 'text'} inputMode={options.money ? 'decimal' : undefined} required={options.required} value={draft[key]} maxLength={options.max} onChange={e => change(key, e.target.value)} aria-invalid={Boolean(errors[key])} aria-describedby={[options.money ? id + '-help' : '', errors[key] ? id + '-error' : ''].filter(Boolean).join(' ') || undefined}/>}{options.money && <small id={id + '-help'}>Sin separadores de miles. Ejemplo: 25000,50.{minor(draft[key]) !== null && ' ' + money(canonical(draft[key]))}</small>}{errors[key] && <small className="field-error" id={id + '-error'}>{errors[key].join('. ')}</small>}</label>; }

    async function send() { if (!pending.current)

        return; setBusy(true); setMessage(''); try {

        const response: ActionResult<MutationReceipt> = await mutationAction(pending.current.op, pending.current.input);

        if (response.ok) {

            success.current = true;

            setDirty(false);

            router.push(routes[resource] + '/' + response.data.id + '?guardado=1');

            router.refresh();

            return;

        }

        setErrors(response.error.fieldErrors ?? {});

        setMessage(response.error.message);

        if (response.error.code === 'UNAUTHENTICATED') {

            setLogin(true);

            setUncertain(true);

        }

        else if (response.error.code === 'UNAVAILABLE' || response.error.code === 'INTERNAL') {

            setUncertain(true);

        }

        else {

            pending.current = null;

            setUncertain(false);

            if (response.error.code === 'CONFLICT' && record) {

                const current = await queryAction(`${resource}.get`, { id: record.id });

                if (current.ok)

                    setLatest(current.data as RecordDTO);

            }

        }

    }

    catch {

        setUncertain(true);

        setMessage('No sabemos si se guardó. Reintenta la misma operación para comprobar el resultado.');

    }

    finally {

        setBusy(false);

    } }

    async function submit(e: FormEvent) { e.preventDefault(); if(submitting.current)return; submitting.current=true; setBusy(true); try { if (uncertain) {

        await send();

        return;

    } const invalid: Record<string, string[]> = {}; const required = (key: string, value: string, text: string) => { if (!value.trim())

        invalid[key] = [text]; }; let payload: Record<string, unknown> = {}; if (resource === 'clients') {

        required('name', draft.name, 'Escribe el nombre');

        payload = { name: draft.name, contact: draft.contact, notes: draft.notes };

    }

    else if(resource === 'products'){ required('name',draft.name,'Escribe el nombre'); const price=minor(draft.price); if(price===null||price<=0n||price>99999999999999n) invalid.price=['Escribe un precio positivo válido']; payload={name:draft.name,description:draft.description,price:price===null?'':canonical(draft.price)}; }

    else if (resource === 'expenses') {

        required('concept', draft.concept, 'Escribe el concepto');

        const m = minor(draft.amount);

        if (m === null || m <= 0n || m > 99999999999999n)

            invalid.amount = ['Escribe un total positivo válido, sin separadores de miles'];

        payload = { expenseDate: draft.expenseDate, concept: draft.concept, amount: m === null ? '' : canonical(draft.amount), supplier: draft.supplier, invoiceReference: draft.invoiceReference };

    }

    else {

        required('customerId', draft.customerId, 'Selecciona un cliente');

        draft.lines.forEach((l, i) => { required(`lines.${i}.description`, l.description, 'Describe la vela'); if (!/^\d+$/.test(l.quantity) || Number(l.quantity) < 1 || Number(l.quantity) > 10000)

            invalid[`lines.${i}.quantity`] = ['Escribe una cantidad entera entre 1 y 10000']; const price = minor(l.unitPrice); if (price === null || price > 99999999999999n)

            invalid[`lines.${i}.unitPrice`] = ['Escribe dígitos y coma decimal, sin separadores de miles']; });

        if (total === null || total <= 0n || total > 99999999999999n)

            invalid.total = ['El total debe ser positivo y no superar COP 999.999.999.999,99'];

        payload = { customerId: draft.customerId, orderDate: draft.orderDate, notes: draft.notes, lines: draft.lines.map(l => ({ productId:l.productId||null, description: l.description, quantity: Number(l.quantity), unitPrice: minor(l.unitPrice) === null ? '' : canonical(l.unitPrice) })) };

    } if (resource === 'orders')

        required('orderDate', draft.orderDate, 'Selecciona una fecha'); if (resource === 'expenses')

        required('expenseDate', draft.expenseDate, 'Selecciona una fecha'); setErrors(invalid); if (Object.keys(invalid).length) {

        setMessage('Revisa los campos indicados antes de guardar.');

        document.getElementById('form-errors')?.focus();

        return;

    } if(resource === 'clients' && !record && duplicateAcknowledgment.current !== draft.name.trim()){ const found = await queryAction('clients.list', {search:draft.name.trim(),archived:'all',pageSize:5}); if(!found.ok){setMessage(found.error.message);return;} const matches=(found.data as PageDTO<ClientDTO>).items; duplicateAcknowledgment.current=draft.name.trim(); if(matches.length){setDuplicates(matches);setMessage('Revisa las posibles coincidencias. Puedes guardar si se trata de otra persona.');return;} } pending.current = { op: `${resource}.${record ? 'update' : 'create'}`, input: { ...payload, idempotencyKey: crypto.randomUUID(), ...(record ? { id: record.id, expectedVersion: record.version } : {}) } }; await send(); } finally {submitting.current=false;setBusy(false);} }

    function cancel() { if (dirty || uncertain)

        setLeave(true);

    else

        router.push(record ? routes[resource] + '/' + record.id : routes[resource]); }

    return <><div className="page-head"><div><p className="eyebrow">{record ? 'EDITAR REGISTRO' : 'NUEVO REGISTRO'}</p><h1>{resource === 'clients' ? 'Cliente' : resource === 'orders' ? 'Pedido' : resource === 'products' ? 'Producto' : 'Gasto'}</h1></div><button type="button" onClick={cancel}>Cancelar</button></div>{!online && <Status error>Sin conexión. Tus cambios aún no se han guardado.</Status>}{latest && <Status error>Este registro cambió mientras lo editabas.{latest.archived && ' Ahora está archivado.'}<button type="button" onClick={() => setCompare(true)}>Comparar cambios</button><button type="button" onClick={() => { if (confirm('¿Descartar tu borrador y cargar la versión actual?')) {

        router.refresh();

        success.current = true;

        window.location.assign(routes[resource] + '/' + record!.id);

    } }}>Cargar versión actual</button></Status>}<form onSubmit={submit} className={resource==='orders'?'editor order-editor':'editor'} noValidate><fieldset disabled={busy || uncertain || Boolean(latest)}>{message && <div id="form-errors" tabIndex={-1} className="notice error" role="alert">{message}{Object.entries(errors).map(([key, values]) => <div key={key}><a href={'#field-' + key}>{values.join('. ')}</a></div>)}</div>}{resource === 'clients' && <div className="form-stack">{field('Nombre', 'name', { required: true, max: 120 })}{duplicates.length > 0 && <Status>Posibles coincidencias: {duplicates.map(c => c.name + (c.archived ? ' (archivado)' : '')).join(', ')}. Puedes continuar si es una persona distinta.</Status>}{field('Contacto', 'contact', { max: 120 })}{field('Notas', 'notes', { max: 2000, textarea: true })}</div>}{resource === 'expenses' && <div className="form-stack"><div className="field-pair">{field('Fecha', 'expenseDate', { required: true, type: 'date' })}{field('Total (COP)', 'amount', { required: true, money: true })}</div>{field('Concepto', 'concept', { required: true, max: 300, textarea: true })}<p className="muted">Puedes registrar el total de una factura como un gasto.</p><div className="field-pair">{field('Proveedor', 'supplier', { max: 120 })}{field('Referencia de factura', 'invoiceReference', { max: 120 })}</div></div>}{resource === 'products' && <div className="form-stack"><div className="field-pair">{field('Nombre', 'name', {required:true,max:120})}{field('Precio (COP)', 'price', {required:true,money:true})}</div>{field('Descripción','description',{max:2000,textarea:true})}</div>}{resource === 'orders' && <><div className="field-pair order-header"><div><SearchCombobox disabled={busy||uncertain||Boolean(latest)} label="Cliente (obligatorio)" id="field-customerId" value={draft.customerId} selected={customerOptions.find(c=>c.id===draft.customerId)?{id:draft.customerId,label:customerOptions.find(c=>c.id===draft.customerId)!.name}:record&&'lines' in record&&record.customerId===draft.customerId?{id:record.customerId,label:record.customerNameSnapshot}:undefined} error={errors.customerId?.join('. ')} placeholder="Buscar cliente por nombre o contacto" onSelect={choice=>{if(choice)setCustomerOptions(previous=>[{id:choice.id,name:choice.label,contact:choice.detail??null,notes:null,archived:false,version:1},...previous.filter(c=>c.id!==choice.id)]);change('customerId',choice?.id??'');}} search={async text=>{const result=await queryAction('clients.list',{search:text,pageSize:50,archived:false});if(!result.ok)throw new Error(result.error.message);const found=(result.data as PageDTO<ClientDTO>).items;return found.map(c=>({id:c.id,label:c.name,detail:c.contact??undefined}));}}/><button type="button" className="text-button create-client" onClick={()=>setNewClient(true)}>+ Crear cliente</button></div>{field('Fecha del pedido','orderDate',{required:true,type:'date'})}</div><div className="section-head"><h2>Velas del pedido</h2><span>{draft.lines.length} / 100</span></div><div className="order-lines">{draft.lines.map((l,i)=><section className="order-line compact-line" key={l.key} aria-label={'Vela '+(i+1)}><div className="line-product"><SearchCombobox disabled={busy||uncertain||Boolean(latest)} label={'Producto · vela '+(i+1)} id={'field-lines.'+i+'.productId'} value={l.productId??''} selected={l.productId?{id:l.productId,label:l.productLabel??l.description}:undefined} placeholder="Buscar producto" error={errors[`lines.${i}.productId`]?.join('. ')} onSelect={(choice:Choice|null)=>{change('lines',draft.lines.map((line,index)=>index===i?{...line,productId:choice?.id??null,...(choice?.price?{productLabel:choice.label,description:choice.label,unitPrice:choice.price.replace('.',',')}: {})}:line));}} search={async text=>{const result=await queryAction('products.list',{search:text,pageSize:50,archived:false});if(!result.ok)throw new Error(result.error.message);const found=(result.data as PageDTO<ProductDTO>).items;return found.map(p=>({id:p.id,label:p.name,detail:money(p.price),price:p.price}));}}/><button type="button" className="text-button custom-line" onClick={()=>lineChange(i,'productId','')}>{l.productId?'Usar línea personalizada':'Personalizada'}</button></div><label className="line-description">Descripción de la vela<input id={'field-lines.'+i+'.description'} required maxLength={200} value={l.description} onChange={e=>lineChange(i,'description',e.target.value)} aria-invalid={Boolean(errors[`lines.${i}.description`])} aria-describedby={errors[`lines.${i}.description`]?`field-lines.${i}.description-error`:undefined}/>{errors[`lines.${i}.description`]&&<small className="field-error" id={`field-lines.${i}.description-error`}>{errors[`lines.${i}.description`].join('. ')}</small>}</label><label className="line-quantity">Cantidad<input id={'field-lines.'+i+'.quantity'} inputMode="numeric" required value={l.quantity} onChange={e=>lineChange(i,'quantity',e.target.value)} aria-invalid={Boolean(errors[`lines.${i}.quantity`])} aria-describedby={errors[`lines.${i}.quantity`]?`field-lines.${i}.quantity-error`:undefined}/>{errors[`lines.${i}.quantity`]&&<small className="field-error" id={`field-lines.${i}.quantity-error`}>{errors[`lines.${i}.quantity`].join('. ')}</small>}</label><label className="line-price">Precio unitario (COP)<input id={'field-lines.'+i+'.unitPrice'} inputMode="decimal" required value={l.unitPrice} onChange={e=>lineChange(i,'unitPrice',e.target.value)} aria-invalid={Boolean(errors[`lines.${i}.unitPrice`])} aria-describedby={errors[`lines.${i}.unitPrice`]?`field-lines.${i}.unitPrice-error`:undefined}/>{errors[`lines.${i}.unitPrice`]&&<small className="field-error" id={`field-lines.${i}.unitPrice-error`}>{errors[`lines.${i}.unitPrice`].join('. ')}</small>}</label><div className="line-subtotal"><small>Subtotal</small><strong className="money">{parts[i]===null?'—':money(moneyText(parts[i]!))}</strong></div><button className="remove-line" type="button" aria-label={'Quitar vela '+(i+1)} disabled={draft.lines.length===1} onClick={()=>change('lines',draft.lines.filter((_,index)=>index!==i))}>×</button></section>)}</div><button type="button" disabled={draft.lines.length>=100} onClick={()=>{const key=crypto.randomUUID();change('lines',[...draft.lines,{key,productId:null,description:'',quantity:'1',unitPrice:''}]);setTimeout(()=>document.getElementById('field-lines.'+draft.lines.length+'.description')?.focus(),0);}}>+ Añadir vela</button><details className="order-notes" open={errors.notes?true:undefined}><summary>Notas del pedido · opcional</summary>{field('Notas del pedido','notes',{max:2000,textarea:true})}</details></>}</fieldset><div className={resource==='orders'?'form-actions order-savebar':'form-actions'}>{resource==='orders'&&<div className="savebar-total"><span>Total del pedido</span><strong>{total===null?'—':money(moneyText(total))}</strong>{errors.total&&<small className="field-error" id="field-total">{errors.total.join('. ')}</small>}</div>}<button type="submit" className="primary" disabled={busy || !online || Boolean(latest)}>{busy ? 'Guardando…' : uncertain ? 'Comprobar guardado y reintentar' : 'Guardar ' + (resource === 'clients' ? 'cliente' : resource === 'orders' ? 'pedido' : resource === 'products' ? 'producto' : 'gasto')}</button><button type="button" onClick={cancel}>Cancelar</button></div>{uncertain && <Status>El borrador está protegido mientras comprobamos el guardado. Reintenta con el mismo contenido.</Status>}</form>{login && <Dialog title="Vuelve a iniciar sesión" onClose={() => setLogin(false)}><p>Tu borrador sigue en esta pestaña.</p><LoginForm onSuccess={() => { setLogin(false); void send(); }}/></Dialog>}{newClient && <Dialog title="Crear cliente" onClose={() => setNewClient(false)}><InlineClient onSaved={c => { setCustomerOptions(prev => [c, ...prev]); change('customerId', c.id); setNewClient(false); }}/></Dialog>}{leave && <Dialog title="¿Salir sin guardar?" onClose={() => setLeave(false)}><p>{uncertain ? 'El resultado del guardado aún no está confirmado. Comprueba el registro antes de crear otro.' : 'Perderás los cambios de este borrador.'}</p><div className="form-actions"><button onClick={() => setLeave(false)}>Seguir editando</button><button className="primary" onClick={() => { success.current = true; router.push(leaveTarget ?? routes[resource]); }}>Descartar cambios</button></div></Dialog>}{compare && latest && <Dialog title="Comparar cambios" onClose={() => setCompare(false)}><div className="compare"><section><h3>Tu borrador</h3><DraftSummary draft={draft} resource={resource}/></section><section><h3>Versión actual</h3><DraftSummary draft={initialDraft(latest)} resource={resource}/></section></div></Dialog>}</>;

}

function DraftSummary({ draft, resource }: {

    draft: Draft;

    resource: Resource;

}) { return <dl>{Object.entries(draft).filter(([k, v]) => k !== 'lines' && v && ((resource === 'products' && ['name','price','description'].includes(k)) || (resource === 'clients' && ['name', 'contact', 'notes'].includes(k)) || (resource === 'expenses' && ['expenseDate', 'concept', 'amount', 'supplier', 'invoiceReference'].includes(k)) || (resource === 'orders' && ['customerId', 'orderDate', 'notes'].includes(k)))).map(([k, v]) => <div key={k}><dt>{{ price:'Precio',description:'Descripción',name: 'Nombre', contact: 'Contacto', notes: 'Notas', expenseDate: 'Fecha', concept: 'Concepto', amount: 'Total', supplier: 'Proveedor', invoiceReference: 'Factura', customerId: 'Cliente', orderDate: 'Fecha' }[k]}</dt><dd>{String(v)}</dd></div>)}{resource === 'orders' && draft.lines.map((l, i) => <div key={l.key}><dt>Vela {i + 1}</dt><dd>{l.description} · {l.quantity} × {l.unitPrice} COP</dd></div>)}</dl>; }

function InlineClient({ onSaved }: {

    onSaved: (client: ClientDTO) => void;

}) { const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [uncertain, setUncertain] = useState(false); const [duplicates, setDuplicates] = useState<ClientDTO[] | null>(null); const pending = useRef<Record<string, unknown> | null>(null); async function save(e: FormEvent<HTMLFormElement>) { e.preventDefault(); if (!pending.current) {

    const data = new FormData(e.currentTarget);

    pending.current = { name: String(data.get('name')).trim(), contact: String(data.get('contact')).trim(), idempotencyKey: crypto.randomUUID() };

    if (!duplicates) {

        const r = await queryAction('clients.list', { search: pending.current.name, archived: 'all', pageSize: 5 });

        if (r.ok && (r.data as PageDTO<ClientDTO>).items.length) {

            setDuplicates((r.data as PageDTO<ClientDTO>).items);

            pending.current = null;

            return;

        }

    }

} setBusy(true); try {

    const r = await mutationAction('clients.create', pending.current);

    if (r.ok) {

        const client = await queryAction('clients.get', { id: r.data.id });

        if (client.ok)

            onSaved(client.data as ClientDTO);

        else {

            setUncertain(true);

            setError('Cliente guardado. Reintenta para cargar sus datos.');

        }

    }

    else {

        setError(r.error.message);

        if (['UNAVAILABLE', 'INTERNAL', 'UNAUTHENTICATED'].includes(r.error.code))

            setUncertain(true);

        else

            pending.current = null;

    }

}

catch {

    setUncertain(true);

    setError('No sabemos si se guardó. Reintenta el mismo cliente.');

}

finally {

    setBusy(false);

} } return <form className="form-stack" onSubmit={save}>{error && <Status error>{error}</Status>}{duplicates && <Status>Posibles coincidencias: {duplicates.map(c => c.name).join(', ')}. Puedes continuar si es una persona distinta.</Status>}<fieldset disabled={busy || uncertain}><label>Nombre (obligatorio)<input name="name" required maxLength={120}/></label><label>Contacto (opcional)<input name="contact" maxLength={120}/></label></fieldset><button className="primary" disabled={busy}>{busy ? 'Guardando…' : uncertain ? 'Comprobar y reintentar' : 'Guardar cliente'}</button></form>; }


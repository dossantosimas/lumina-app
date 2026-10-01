'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Icon, Dialog } from './ui';
export function Shell({ children, owner }: {
    children: React.ReactNode;
    owner: {
        name: string;
        email: string;
    };
}) { const path = usePathname(); const [more,setMore]=useState(false); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); async function logout() { setBusy(true); try {
    const r = await fetch('/api/auth/sign-out', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    if (!r.ok)
        throw new Error();
    window.location.replace('/login');
}
catch {
    setError('No pudimos cerrar la sesión. Inténtalo de nuevo.');
    setBusy(false);
} } return <div className="app-shell"><a className="skip-link" href="#content">Saltar al contenido</a><aside className="sidebar"><Link href="/resumen" className="brand" aria-label="Lúmina"><Image src="/brand/lumina-symbol.png" alt="" width={38} height={49} priority/><span>Lúmina<small>CANDLE STUDIO</small></span></Link><nav aria-label="Navegación principal">{['Resumen', 'Pedidos', 'Clientes', 'Gastos'].map(n => <Link key={n} className={path.startsWith('/' + n.toLowerCase()) ? 'nav-link selected' : 'nav-link'} aria-current={path.startsWith('/' + n.toLowerCase()) ? 'page' : undefined} href={'/' + n.toLowerCase()}><Icon name={n}/><span>{n}</span></Link>)}<Link className={path.startsWith('/productos')?'nav-link secondary-nav selected':'nav-link secondary-nav'} href="/productos" aria-current={path.startsWith('/productos')?'page':undefined}><Icon name="Productos"/><span>Productos</span></Link><button className={path.startsWith('/productos')?'nav-link more-nav selected':'nav-link more-nav'} aria-haspopup="dialog" aria-expanded={more} onClick={()=>setMore(true)}><Icon name="Más"/><span>Más</span></button></nav><div className="sidebar-foot">Hecho para tu día a día.</div></aside><div className="workspace"><header className="account"><span>{owner.name || owner.email}</span><button type="button" onClick={logout} disabled={busy}>{busy ? 'Cerrando…' : 'Cerrar sesión'}</button>{error && <span role="alert">{error}</span>}</header><main id="content" className="content">{children}</main>{more&&<Dialog title="Más" onClose={()=>setMore(false)}><Link className="button secondary-destination" href="/productos" aria-current={path.startsWith('/productos')?'page':undefined} onClick={()=>setMore(false)}><Icon name="Productos"/>Productos</Link></Dialog>}<footer className="workspace-footer">Lúmina Candle Studio <span>Con cuidado, en cada detalle.</span></footer></div></div>; }

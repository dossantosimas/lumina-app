'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { LoginForm } from '@/components/login-form';

export function LoginScreen({ initialSetupAvailable, accountCreated }: {
    initialSetupAvailable: boolean;
    accountCreated: boolean;
}) {
    const router = useRouter();
    return <main className="login-page"><section className="login-panel">
        <Image src="/brand/lumina-symbol.png" alt="" width={72} height={92} className="login-symbol" priority/>
        <p className="eyebrow">CANDLE STUDIO</p><h1>Lúmina</h1>
        <p className="login-intro">Tu negocio, en un solo lugar.</p>
        {accountCreated && <p className="notice" role="status">Tu cuenta está lista. Inicia sesión.</p>}
        {initialSetupAvailable && <div className="initial-access">
            <p>Aún no hay una cuenta de dueño.</p>
            <Link className="button primary" href="/configuracion-inicial">Crear primera cuenta</Link>
        </div>}
        <LoginForm onSuccess={() => { router.replace('/resumen'); router.refresh(); }}/>
    </section></main>;
}

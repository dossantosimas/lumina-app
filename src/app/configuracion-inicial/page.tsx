import Image from 'next/image';
import { redirect } from 'next/navigation';
import { InitialSetupForm } from '@/components/initial-setup-form';
import { getInitialSetupStatus } from '@/server/initial-setup';

export const dynamic = 'force-dynamic';

export default async function InitialSetup() {
    const setup = await getInitialSetupStatus();
    if (!setup.available) redirect('/login');
    return <main className="login-page"><section className="login-panel setup-panel">
        <Image src="/brand/lumina-symbol.png" alt="" width={56} height={72} className="login-symbol" priority/>
        <p className="eyebrow">LÚMINA · CANDLE STUDIO</p><h1>Primera cuenta</h1>
        <p className="login-intro">Crea tu acceso como dueño de Lúmina. Esta configuración se cerrará al crear la cuenta.</p>
        <InitialSetupForm requiresActivationCode={setup.requiresActivationCode}/>
    </section></main>;
}

import Image from 'next/image';
import {InitialSetupForm} from '@/components/initial-setup-form';
import {headers} from 'next/headers';
import {redirect} from 'next/navigation';
import {registrationOrigin} from '@/server/registration-service';
export const dynamic='force-dynamic';
export default async function Registration(){
 const canonical=registrationOrigin(process.env['BETTER_AUTH_URL']);
 if(canonical&&(await headers()).get('host')!==new URL(canonical).host)redirect(`${canonical}/registro`);
 return <main className="login-page"><section className="login-panel setup-panel">
  <Image src="/brand/lumina-symbol.png" alt="" width={56} height={72} className="login-symbol" priority/>
  <p className="eyebrow">LÚMINA · CANDLE STUDIO</p><h1>Crear cuenta</h1>
  <p className="login-intro">Tu cuenta tendrá acceso a todos los datos de Lúmina.</p>
  <InitialSetupForm mode="public"/>
 </section></main>;
}

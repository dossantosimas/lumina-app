import { LoginScreen } from '@/components/login-screen';
import { getInitialSetupStatus } from '@/server/initial-setup';

export const dynamic = 'force-dynamic';

export default async function Login({ searchParams }: {
    searchParams: Promise<{ cuenta?: string | string[] }>;
}) {
    const [setup, params] = await Promise.all([getInitialSetupStatus(), searchParams]);
    return <LoginScreen initialSetupAvailable={setup.available} accountCreated={params.cuenta === 'creada'}/>;
}

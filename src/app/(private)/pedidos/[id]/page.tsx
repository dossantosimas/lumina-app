import { queryAction } from '@/server/actions';
import { RecordDetail } from '@/components/record-detail';
export default async function Page({ params, searchParams }: {
    params: Promise<{
        id: string;
    }>;
    searchParams: Promise<{
        guardado?: string;
        volver?: string;
    }>;
}) { const { id } = await params; const { guardado, volver } = await searchParams; return <RecordDetail resource="orders" initial={await queryAction('orders.get', { id })} returnTo={volver} saved={guardado === '1'}/>; }

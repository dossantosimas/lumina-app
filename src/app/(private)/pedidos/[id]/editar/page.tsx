import { queryAction } from '@/server/actions';
import { RecordForm } from '@/components/record-form';
import type { ClientDTO, PageDTO } from '@/lib/contracts';
import type { RecordDTO } from '@/components/ui';
import Link from 'next/link';
export default async function Page({ params }: {
    params: Promise<{
        id: string;
    }>;
}) { const { id } = await params; const result = await queryAction('orders.get', { id }); if (!result.ok)
    return <div role="alert">{result.error.message}<Link href="/pedidos">Volver a la lista</Link></div>; const row = result.data as RecordDTO; if (row.archived)
    return <div role="alert">Este registro está archivado. Restáuralo antes de editarlo.<Link href={'/pedidos/' + id}>Abrir detalle</Link></div>; const clients = 'orders' === 'orders' ? await queryAction('clients.list', { archived: false, pageSize: 50 }) : null; return <RecordForm resource="orders" record={row} clients={clients?.ok ? (clients.data as PageDTO<ClientDTO>).items : []}/>; }

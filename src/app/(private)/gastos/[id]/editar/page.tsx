import { queryAction } from '@/server/actions';
import { RecordForm } from '@/components/record-form';
import type { RecordDTO } from '@/components/ui';
import Link from 'next/link';
export default async function Page({ params }: {
    params: Promise<{
        id: string;
    }>;
}) { const { id } = await params; const result = await queryAction('expenses.get', { id }); if (!result.ok)
    return <div role="alert">{result.error.message}<Link href="/gastos">Volver a la lista</Link></div>; const row = result.data as RecordDTO; if (row.archived)
    return <div role="alert">Este registro está archivado. Restáuralo antes de editarlo.<Link href={'/gastos/' + id}>Abrir detalle</Link></div>; return <RecordForm resource="expenses" record={row}/>; }

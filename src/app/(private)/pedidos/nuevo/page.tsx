import { queryAction } from '@/server/actions';
import { RecordForm } from '@/components/record-form';
import type { ClientDTO, PageDTO } from '@/lib/contracts';
export default async function Page() { const clients = 'orders' === 'orders' ? await queryAction('clients.list', { archived: false, pageSize: 50 }) : null; return <RecordForm resource="orders" clients={clients?.ok ? (clients.data as PageDTO<ClientDTO>).items : []}/>; }

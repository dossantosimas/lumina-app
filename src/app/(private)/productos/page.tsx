import { queryAction } from '@/server/actions';
import { ResourceList } from '@/components/resource-list';
import type { ListInput } from '@/lib/contracts';
export default async function Page({ searchParams }: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) { const query = await searchParams; const text = (key: string) => typeof query[key] === 'string' ? query[key] as string : undefined; const filters: ListInput = { page: Number(text('page') || 1), pageSize: 20, search: text('search') || '', archived: text('archived') === 'all' ? 'all' : text('archived') === 'true', from: text('from') || undefined, to: text('to') || undefined }; return <ResourceList resource="products" initialFilters={filters} initial={await queryAction('products.list', filters)}/>; }

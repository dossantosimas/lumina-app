import { redirect } from 'next/navigation';
import { getCurrentOwner } from '@/server/auth';
import { Shell } from '@/components/shell';
export const dynamic = 'force-dynamic';
export default async function PrivateLayout({ children }: {
    children: React.ReactNode;
}) { const owner = await getCurrentOwner(); if (!owner)
    redirect('/login'); return <Shell owner={owner}>{children}</Shell>; }

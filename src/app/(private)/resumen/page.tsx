import { queryAction } from '@/server/actions';
import { Dashboard } from '@/components/dashboard';
export default async function Page() { const to = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); const from = to.slice(0, 7) + '-01'; const last = new Date(Date.UTC(Number(to.slice(0, 4)), Number(to.slice(5, 7)), 0)).getUTCDate(); const end = to.slice(0, 7) + '-' + String(last).padStart(2, '0'); return <Dashboard from={from} to={end} initial={await queryAction('dashboard.summary', { from, to: end })}/>; }

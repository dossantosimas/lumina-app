import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: { default: 'Lúmina', template: '%s · Lúmina' }, description: 'Pedidos, clientes y gastos de Lúmina Candle Studio', robots: { index: false, follow: false } };
export default function RootLayout({ children }: {
    children: React.ReactNode;
}) { return <html lang="es-CO"><body>{children}</body></html>; }

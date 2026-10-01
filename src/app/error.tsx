'use client';
export default function ErrorPage({ reset }: {
    reset: () => void;
}) { return <main className="error-page"><h1>No pudimos abrir esta página</h1><p>Inténtalo de nuevo. Si estabas editando, revisa el registro antes de volver a guardarlo.</p><button className="primary" onClick={reset}>Reintentar</button></main>; }

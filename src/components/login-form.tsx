'use client';
import { useState, type FormEvent } from 'react';
export function LoginForm({ onSuccess }: {
    onSuccess: () => void;
}) { const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [visible, setVisible] = useState(false); async function submit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); setBusy(true); setError(''); const f = new FormData(e.currentTarget); try {
    const r = await fetch('/api/auth/sign-in/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: f.get('email'), password: f.get('password') }) });
    if (!r.ok)
        throw new Error();
    onSuccess();
}
catch {
    setError('No pudimos iniciar sesión. Revisa el correo y la contraseña e inténtalo de nuevo.');
}
finally {
    setBusy(false);
} } return <form onSubmit={submit} className="form-stack">{error && <p role="alert" className="notice error">{error}</p>}<label>Correo<input name="email" type="email" autoComplete="username" required maxLength={254}/></label><label>Contraseña<input name="password" type={visible ? 'text' : 'password'} autoComplete="current-password" required/></label><button type="button" className="text-button" aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? 'Ocultar' : 'Mostrar'} contraseña</button><button className="primary" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button><p className="muted">Para recuperar el acceso, contacta a quien administra las cuentas de Lúmina.</p></form>; }

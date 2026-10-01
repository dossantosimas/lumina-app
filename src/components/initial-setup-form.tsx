'use client';

import { useRef, useState, useTransition, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createInitialOwner } from '@/server/initial-setup';

type Field = 'activationCode' | 'name' | 'email' | 'password' | 'passwordConfirmation';
const fields: Field[] = ['activationCode', 'name', 'email', 'password', 'passwordConfirmation'];

export function InitialSetupForm({requiresActivationCode=false}:{requiresActivationCode?:boolean}) {
    const router = useRouter();
    const submitting = useRef(false);
    const [busy, setBusy] = useState(false);
    const [, startTransition] = useTransition();
    const [visible, setVisible] = useState(false);
    const [closed, setClosed] = useState(false);
    const [message, setMessage] = useState('');
    const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (submitting.current || closed) return;
        const form = event.currentTarget;
        const values = new FormData(form);
        const input = {
            name: String(values.get('name') ?? '').trim(),
            email: String(values.get('email') ?? '').trim(),
            password: String(values.get('password') ?? ''),
            passwordConfirmation: String(values.get('passwordConfirmation') ?? ''),
            ...(requiresActivationCode?{activationCode:String(values.get('activationCode')??'').trim()}:{}),
        };
        const nextErrors: Partial<Record<Field, string>> = {};
        if(requiresActivationCode&&!/^[a-f0-9]{64}$/.test(input.activationCode??''))nextErrors.activationCode='Escribe el código de activación recibido.';
        if (!input.name || input.name.length > 120) nextErrors.name = 'Escribe tu nombre, hasta 120 caracteres.';
        if (!input.email || input.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) nextErrors.email = 'Escribe un correo válido.';
        if (input.password.length < 12 || input.password.length > 128) nextErrors.password = 'Usa una contraseña de 12 a 128 caracteres.';
        if (input.passwordConfirmation !== input.password || !input.passwordConfirmation) nextErrors.passwordConfirmation = 'Las contraseñas deben coincidir.';
        setErrors(nextErrors);
        setMessage('');
        const firstInvalid = fields.find(field => nextErrors[field]);
        if (firstInvalid) {
            setMessage('Revisa los campos indicados antes de crear tu cuenta.');
            (form.elements.namedItem(firstInvalid) as HTMLInputElement | null)?.focus();
            return;
        }
        submitting.current = true;
        setBusy(true);
        startTransition(async () => {
            try {
                const result = await createInitialOwner(input);
                if (result.ok) {
                    form.reset();
                    router.replace('/login?cuenta=creada');
                    router.refresh();
                    return;
                }
                if (result.code === 'CLOSED') {
                    setClosed(true);
                    form.reset();
                }
                setMessage(result.message);
            } catch {
                setMessage('No pudimos confirmar la creación de tu cuenta. Intenta iniciar sesión; si aún no existe, vuelve a intentarlo aquí.');
            } finally {
                submitting.current = false;
                setBusy(false);
            }
        });
    }

    function error(field: Field) {
        return errors[field] && <small id={`setup-${field}-error`} className="field-error">{errors[field]}</small>;
    }

    return <form onSubmit={submit} className="form-stack" noValidate aria-busy={busy}>
        {message && <p role="alert" className="notice error">{message}</p>}
        {!closed && <>
            {requiresActivationCode&&<label>Código de activación<input name="activationCode" type="password" autoComplete="off" required maxLength={64} disabled={busy} aria-invalid={!!errors.activationCode} aria-describedby={errors.activationCode?'setup-activationCode-error':undefined}/>{error('activationCode')}</label>}
            <label>Nombre<input name="name" autoComplete="name" required maxLength={120} disabled={busy} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'setup-name-error' : undefined}/>{error('name')}</label>
            <label>Correo<input name="email" type="email" autoComplete="username" required maxLength={254} disabled={busy} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'setup-email-error' : undefined}/>{error('email')}</label>
            <label>Contraseña<input name="password" type={visible ? 'text' : 'password'} autoComplete="new-password" required minLength={12} maxLength={128} disabled={busy} aria-invalid={!!errors.password} aria-describedby={`setup-password-help${errors.password ? ' setup-password-error' : ''}`}/><small id="setup-password-help">Entre 12 y 128 caracteres.</small>{error('password')}</label>
            <label>Confirmar contraseña<input name="passwordConfirmation" type={visible ? 'text' : 'password'} autoComplete="new-password" required minLength={12} maxLength={128} disabled={busy} aria-invalid={!!errors.passwordConfirmation} aria-describedby={errors.passwordConfirmation ? 'setup-passwordConfirmation-error' : undefined}/>{error('passwordConfirmation')}</label>
            <button type="button" className="text-button" aria-pressed={visible} disabled={busy} onClick={() => setVisible(!visible)}>{visible ? 'Ocultar' : 'Mostrar'} contraseñas</button>
            <button className="primary" disabled={busy}>{busy ? 'Creando cuenta…' : 'Crear mi cuenta'}</button>
        </>}
        <Link className="button" href="/login" aria-disabled={busy} onClick={event => { if (submitting.current) event.preventDefault(); }}>{closed ? 'Ir a iniciar sesión' : 'Volver al acceso'}</Link>
    </form>;
}

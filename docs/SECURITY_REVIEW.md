# Security review — Lúmina

Date: 2026-09-30. Reviewer: security_auditor, independiente de los productores.
Scope: implementación de auth, acciones/queries, servicios, SQL inicial, roles/grants, operador CLI, entornos locales, dependencias y configuración HTTP. No pentest ni deployment productivo.
Verdict: **Approve para entrega local**. SEC-04 cerrado mediante revisión de código y respuesta HTTP real. Sin Critical/High/Medium abiertos encontrados. SEC-05 conserva una limitación operativa local y un requisito previo al deployment productivo.

## Hallazgos y cierre

| ID | Severidad / estado | Evidencia | Riesgo, acción y criterio de cierre |
|---|---|---|---|
| SEC-04 | Medium / CLOSED | `next.config.ts` aplica headers a `/:path*`; QA pasó el caso HTTP y el revisor verificó independientemente GET `/login` y `/resumen` autenticado en localhost:3001, ambos HTTP 200 | Respuestas contienen X-Frame-Options DENY, CSP frame-ancestors 'none', X-Content-Type-Options nosniff y Referrer-Policy same-origin. Sin HSTS bajo HTTP local; la configuración lo activa solo con NODE_ENV production y BETTER_AUTH_URL HTTPS. La CSP se limita al bloqueo de framing; no se afirma cobertura completa de XSS mediante CSP. |
| SEC-05 | Low / LIMITACIÓN OPERATIVA | `src/server/auth.ts`: ipAddressHeaders vacío y trustedProxyHeaders false; Better Auth instalado `dist/api/rate-limiter/index.mjs` usa no-trusted-ip cuando no hay IP confiable | El límite 5/minuto aplica a un bucket compartido por path, por lo que intentos pueden limitar también a otro dueño. No está deshabilitado y no confía headers arbitrarios. Documentar comportamiento local y corregir afirmación de límite por-IP actual en ARCHITECTURE. Antes de producción, configurar y verificar proxy/IP confiable según infraestructura elegida. No habilitar X-Forwarded-For sin controlar quién puede enviarlo. |

## Controles verificados en código

- SEC-01 de diseño cerrado: handler auth comprueba paths y métodos antes de Better Auth; signup/cambio de cuenta/reset/vinculación externos denegados. activeAccess tiene default false/input false. Runtime DB no puede modificar user/account; operador separado permite provisión y revocación. CLI no se importa desde src.
- SEC-02 de diseño cerrado: servicios llaman lockOwner dentro de su transacción antes de leer/escribir/replay. Función SQL lock_active_owner tiene cuerpo parametrizado, referencia public.user explícita, search_path fijo, privilegio PUBLIC revocado y devuelve solo id/nombre/admisión. Rol runtime solo EXECUTE; no gana UPDATE sobre cuentas. FOR SHARE se mantiene hasta commit y es incompatible con FOR UPDATE de revocación CLI. SQL de bootstrap revoca creación pública en schema; función no acepta nombres SQL ni comandos libres.
- SEC-03 de diseño cerrado: snapshot audit excluye contacto/notas literales, conserva flags; idempotencia almacena hash y acuse mínimo. Acciones registran requestId/operación/duración/código sin cuerpo o secretos. Rol runtime no tiene UPDATE/DELETE/TRUNCATE en audit.
- requireOwner valida sesión y admisión; Server Actions no dependen de controles UI. Queries vuelven a validar admisión bajo lock; servicios server-only y DTO explícitos. Sin caché compartida privada encontrada.
- Secret obligatorio de 32 caracteres o más, URL exacta validada, cookies Secure en HTTPS, cache sesión desactivada y trustedOrigins exacto. Callback de reset exclusivo de operador captura token en memoria y lo consume sin imprimir; password introducida ocultamente, no argumentos. Logger Auth deshabilitado.
- Entradas Zod strict, límites por campo/líneas/importes, queries parametrizadas y cálculo COP por BigInt evitan autoridad del navegador sobre total/version/admisión. Mutación/versión/audit/idempotencia confirman juntas; antes audit se obtiene de entidad bloqueada.
- Entornos runtime/operator/migrator/test separados, credenciales aleatorias e ignoradas por Git; PostgreSQL publicado exclusivamente en loopback. Restore script comprueba lumina_test local, usa destino aislado y mantiene dump en memoria. No se mostraron ni inspeccionaron valores reales de secretos.

## Evidencia y límites de validación

Ejecutado independientemente: `C:\Program Files\nodejs\npm.cmd audit --json`, exit 0, **0 vulnerabilidades** (705 dependencias; 231 prod, 384 dev; categorías adicionales solapadas). Lockfile resuelve deepmerge-ts 8.0.2 y mysql2 3.24.5 bajo overrides. Audit es la foto de advisories conocidos al revisar; no prueba ausencia universal de fallos.

Inspeccionados tests integration/auth y domain: autorización anónima, allowlist, sesión/revocación, replay revocado, rollback, audit redacción/permisos. QA independiente confirmó **16/16 integration** en la validación final, incluyendo provisión con operador real, reset de contraseña, invalidez de sesión previa, aceptación de contraseña nueva y revocación, además de denegaciones PostgreSQL 42501 a permisos runtime prohibidos. Este revisor no repitió suites DB mientras QA ejecutaba sus comprobaciones; los resultados de esas suites se atribuyen a test_generator.

Revalidación independiente el 2026-09-30: npm audit exit 0, total 0 advisories. HTTP propio sobre el servidor local de QA: `/login` y `/resumen` con sesión sintética válida devolvieron 200 y las cuatro cabeceras de SEC-04; no se imprimieron cookies ni credenciales. El caso E2E de cabeceras también pasó antes de esta comprobación.

La aprobación de seguridad no sustituye el resto del delivery gate: QA final, build, revisión de código y documentación deben completarse. Producción necesita HTTPS, proxy confiable y backups externos; no hay deployment autorizado ni ejecutado en esta revisión. No se afirma cumplimiento normativo.

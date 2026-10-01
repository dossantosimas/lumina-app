# Lúmina: arquitectura

Estado: blueprint aprobado el 2026-09-30 e implementado; validaciones vigentes en PROJECT_STATUS.md y QA_REPORT.md. Diseño: atlas; integración documental: nexus. Revisión independiente: BLUEPRINT_REVIEW.md, CODE_REVIEW.md y SECURITY_REVIEW.md.
Referencias: [Requirements](REQUIREMENTS.md), [stack](TECHNOLOGY_STACK.md), [contratos](API_DESIGN.md), [datos](DATABASE_DESIGN.md), [operación](RUNBOOK.md).

## Límites y organización

Una aplicación privada para un negocio, compartida por dueños con iguales permisos. Navegador responsive → Next.js/Node → servicios → Prisma/PostgreSQL. Better Auth administra autenticación bajo /api/auth. Sin API REST pública de negocio, microservicios, inventario, pagos, adjuntos ni integración fiscal.

Implementación: src/app para rutas, src/components para UI, src/lib para contratos/validación/dinero seguros para cliente y src/server para auth, DB, acciones y servicios. UI consume DTO explícitos, nunca Prisma ni secretos. Servicios y guard server-only. Sin repositorios genéricos ni infraestructura edge innecesaria. Un runtime Node simplifica transacciones/auth/operación para pocos dueños; ADR0001 registra la decisión.

## Acceso privado

Better Auth email/contraseña y adaptador Prisma; signup público deshabilitado. Handler aplica allowlist: POST /sign-in/email, POST /sign-out y GET /get-session bajo /api/auth. Cualquier otra ruta/método se deniega, incluidos signup, request/reset/change-password, change-email, update/delete-user y account linking. No catch-all abierto. Provisión por CLI de operador autorizado, sin listener HTTP adicional. Instancia CLI nunca importada en web. Sin contraseña predeterminada, autoaprovisionamiento al iniciar ni rol administrativo UI.

Admisión canónica: User.activeAccess, boolean default false, campo Better Auth input:false, nunca escribible por cliente. Cuenta nueva bloqueada hasta habilitación explícita del operador. CLI toma lock exclusivo de User; revocar desactiva admisión/elimina sesiones en transacción. Servicios toman lock compartido y comprueban activeAccess dentro de su transacción antes de consulta/mutación/replay. Si revocación gana no confirma una escritura comercial posterior; si mutación gana termina antes del commit de revocación. Orden de locks: dueño → clave idempotente → entidad → cliente. Archivo/edición de cliente respeta el orden sin duplicar su lock. Sin Redis ni locks de sesión.

Función limitada public.lock_active_owner(text), SECURITY DEFINER con search_path fijo/nombres SQL explícitos, permite FOR SHARE sin dar UPDATE de cuentas al runtime. Propietario migrador; EXECUTE PUBLIC revocado, runtime solo EXECUTE. Bootstrap revoca creación pública de schema; función no acepta nombres SQL/comandos arbitrarios. Revocación operador usa FOR UPDATE incompatible.

Contraseñas12..128; hashing de librería, nunca propio. Prompt oculto/confirmación, sin argumentos/URL/fixture versionado/log. Operador verifica identidad por canal conocido. Recuperación sin SMTP usa APIs Better Auth de solicitud/reset: callback exclusivo captura token de un solo uso en memoria, expira10min y lo consume en mismo proceso sin imprimirlo. Reset revoca sesiones. Web no expone callback/reset público; UI indica contactar al operador. Sin configuración de cuenta en el MVP.

Sesiones DB: expiración7d/actualización24h, cookie cache desactivada. Guard por query/action, incluidos accesos directos; layouts no bastan. Cookies HttpOnly, SameSite Lax, Secure con HTTPS productivo; HTTP solo loopback. Orígenes exactos sin wildcard, checks CSRF/origen Better Auth/Next. Rate limit en DB: login5/min en bucket compartido local, sin confiar headers IP. Antes de producción configurar/verificar proxy/IP confiable según ingress elegido. Secret aleatorio≥32 caracteres fuera de Git.

Headers globales: X-Frame-Options DENY, CSP frame-ancestors 'none', nosniff y Referrer-Policy same-origin. HSTS solo NODE_ENV production y origen Auth HTTPS. Sin restricciones adicionales de scripts CSP sin validación.

## Datos e invariantes

Diseño físico/límites canónicos: DATABASE_DESIGN.md y API_DESIGN.md.

- INV-A01: sesión válida/dueño activo; todas las cuentas admitidas comparten acciones.
- INV-A02: COP numeric(14,2), DTO decimal string, cálculo BigInt/Decimal exacto; nunca Number para dinero. Rechazar más de2 decimales sin redondeo silencioso. Sin descuento/impuesto/envío separado.
- INV-A03: nuevo pedido exige cliente activo, fecha y1..100 líneas libres; total servidor suma cantidad×precio, positivo; subtotales no negativos. Precio cero permite cortesía si otra línea hace positivo el total. Gasto positivo.
- INV-A04: nombre cliente snapshot y descripción/precio por línea. Editar cliente no reescribe histórico. Editar pedido conserva snapshot si no cambia cliente; cambio explícito copia nombre del nuevo cliente activo.
- INV-A05: pedido/líneas/total/versión/audit/idempotencia confirman juntos o ninguno. Clientes/gastos también audit e idempotencia transaccionales. Audit actor/fechaUTC/operación/entidad/before-after comercial (nombre/snapshot, descripción/líneas, cantidades/importes/fechas/estado/proveedor/referencia). Sin contacto/notas literales ni secretos; solo flags contactChanged/notesChanged. Append-only: runtime sin UPDATE/DELETE/TRUNCATE audit, consulta protegida paginada para dueños.
- INV-A06: archivo/restauración con confirmación, sin hard delete UI. Archivados readonly hasta restaurar. Archivar cliente no afecta pedidos históricos. Editar/archivar/restaurar compara versión esperada y aumenta versión atómica. Editar/restaurar pedido conserva cliente histórico aunque archivado.
- INV-A07: misma clave por dueño/operación+payload devuelve acuse persistido sin duplicar; payload distinto se rechaza. Idempotencia persiste hash y acuse mínimo, sin copia de datos privados.

Fecha comercial YYYY-MM-DD en SQL date sin desplazamiento; audit UTC. Resumen mes Bogotá/rango inclusivo, totales/recientes en snapshot RepeatableRead consistente. Excluye pedidos/gastos archivados; cliente archivado no oculta pedido activo. Diferencia puede ser negativa, sin presentarla como utilidad/cobro. Sin caché compartida privada ni sincronización instantánea prometida; refrescar al navegar/guardar/solicitar.

## Fallos y recuperación

Validación por campo conserva formulario. Sesión vencida pide login en diálogo conservando borrador. Conflicto conserva borrador/comparación y permite cargar versión vigente antes de nueva intención; nunca sobrescribir automáticamente. Archivo/restauración en conflicto permite actualizar y confirmar nueva acción.

Timeout/desconexión no confirma éxito: congelar payload/clave y reintentar misma intención. Guard síncrono evita envíos simultáneos durante preflight/guardado. Deadlock/serialización admite hasta3 intentos transaccionales cortos; falla explícita si persiste. DB caída fail closed, sin escritura parcial. QA nunca restaura sobre DB real de negocio.

Logs requestId/operación/duración/código sin contraseñas/cookies/tokens/contacto/cuerpos. Límites/paginación evitan consultas/cuerpos ilimitados. Borradores en memoria de pestaña, sin almacenamiento local de negocio ni offline.

## Backups y entrega

PostgreSQL17.11 Docker local con volumen; QA lumina_test aislada. Neon elegido para producción, sin cuenta/configuración activada; hosting Node pendiente. PrismaPg TCP pooled runtime; directa exclusiva operador/migrador/backups, roles separados/TLS/major compatible según [contrato](TECHNOLOGY_STACK.md#conexión-y-compatibilidad-docker--neon). Sin driver HTTP stateless ni locks/estado de sesión con pooling.

pg_dump custom/pg_restore aislados verifican relaciones/totales/historial/admisión/login/permisos negativos. Restore reasigna ownership/aplica grants exactos antes de runtime, sin presuponer ACL/ownership. Dump QA en memoria, destino temporal eliminado tras ensayo. Staging Neon solo sintético con credenciales/autorización antes de producción. Sin QA/restore productivo. Copia en mismo equipo no cubre pérdida del equipo.

Objetivo productivo propuesto: backup externo cifrado diario/retención7d/RPO24h/RTO4h, no SLA contratado. Plan Neon/destino requieren costes aceptados y operador. Restore nativo depende plan/ventana: no asumir7d/gratuidad ni reemplazar backup externo con una promesa. Dump privado/Auth protegido como DB. Producción necesita HTTPS/hosting/migraciones/grants/locks validados y autorización.

## Acceptance y proof

| Regla | Evidencia requerida |
|---|---|
| INV-A01 | Acceso anónimo/no admitido/revocado denegado, dos dueños compartidos, admisión no escribible, revocación vs mutación |
| INV-A02..03 | Decimales/límites/suma/overflow/importes persistidos |
| INV-A04 | Editar/archivar conserva snapshot; cambio cliente explícito adopta nuevo |
| INV-A05 | Fallo línea revierte pedido/líneas/audit/idempotencia; audit protegido y privacidad |
| INV-A06 | Edición concurrente un ganador/CONFLICT; archivo/restauración/audit |
| INV-A07 | Envíos simultáneos y timeout/retry un registro; hash distinto rechazado |
| Acceso operativo | Allowlist/métodos cerrados; provisión/reset/revocación real sin token expuesto; CLI fuera de web |
| Recuperación | Restore aislado con permisos exactos, login/query/conteos/relaciones/totales |

Resultados y límites en QA_REPORT.md; esta matriz no certifica ejecución por sí sola.

Fuentes: [Next.js seguridad](https://nextjs.org/docs/app/guides/data-security), [Better Auth opciones](https://better-auth.com/docs/reference/options), [sesiones](https://better-auth.com/docs/concepts/session-management), [password/reset](https://better-auth.com/docs/authentication/email-password), [PostgreSQL numeric](https://www.postgresql.org/docs/current/datatype-numeric.html), [pg_dump](https://www.postgresql.org/docs/current/app-pgdump.html).

## Delta LUM-11 — configuración inicial local

Autorizado por el usuario: /configuracion-inicial y enlace contextual en /login. Primera cuenta mediante nombre/correo/contraseña/confirmación; éxito vuelve al login, sin contraseña/email en URL. Signup general Better Auth permanece cerrado. Disponibilidad limitada al origen loopback configurado; acción exige origen exacto y cierra ante error de base de datos. No existe activación automática en dominio productivo externo.
Creación de identidad y cuenta credential, habilitación y cierre durable se confirman juntos en PostgreSQL. Función SECURITY DEFINER de alcance limitado, propietario migrador y PUBLIC EXECUTE revocado, evita entregar permisos genéricos de escritura Auth al runtime. Hash oficial de Better Auth, no implementación propia. Cualquier cuenta existente, incluso desactivada, impide abrir setup; marker privado conserva cierre tras eliminación. Triggers serializan además aprovisionamiento CLI.
Contratos actuales y evidencia se consolidan al cerrar revisión independiente de LUM-11. [Fuente oficial Better Auth sobre contraseñas](https://better-auth.com/docs/authentication/email-password).


## Extensión aprobada — 2026-10-01

El usuario aprobó implementar catálogo sin inventario, selección integrada de clientes/productos, pedidos compactos, listados más claros y evolución de pedidos/gastos/diferencia. La exclusión inicial del catálogo queda sustituida por esta autorización; las líneas libres siguen admitidas. Contratos, responsables, dependencias y aceptación: [IMPROVEMENTS_PLAN.md](IMPROVEMENTS_PLAN.md). Misma arquitectura y reglas de integridad/acceso; migración aditiva e histórico preservado.

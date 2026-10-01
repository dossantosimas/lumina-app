# Project Status

Current Phase: COMPLETE

Current Milestone: LUM-21 registro libre publicado y verificado.

Progress: LUM-01..21 DONE. Blueprint y ampliaciones aprobados; Vercel/Neon activos.

Completed:
- Acceso privado de dueños y primera cuenta local, clientes, pedidos multilínea y gastos COP; integridad, archivo/restauración, audit, concurrencia y reintentos.
- Analytics Reporter existente incorporado con commit fijado/licencia/trazabilidad; contratos de analítica y UX validados.
- Catálogo por presentación sin inventario, selección opcional y snapshots históricos preservados; migración aditiva/grants Docker real y QA aplicados.
- Cliente unico buscable, selección de productos con precio de opción aceptada, alta de cliente en flujo, filas compactas, notas plegables y total/guardado visibles.
- Listados reorganizados, Productos en navegacion y Más en celular; marca original preservada.
- Evolución verde/rojo/neutro diaria<=31d/mensual, períodos cero/negativos y tabla exacta; mismo snapshot que métricas.
- Reviews independientes codigo/seguridad y UX: APPROVE; IMP-R01..05 CLOSED.
- QA independiente, build, tipado, lint y restore aislado aprobados; documentación/entrega actualizadas.

In Progress:
- Ninguno.

Blocked:
- Ninguno para LUM-21. No se transfieren cuentas ni datos locales; los usuarios crearán sus cuentas desde el registro productivo.

Next:
- Crear las cuentas reales desde https://lumina-app-sepia.vercel.app/registro y comenzar a registrar datos del negocio.

Last Validation:
- 2026-10-01: 37 unitarias,29 integración PostgreSQL/Auth PASS; typecheck/lint finales exit0; build optimizado Next PASS.
- Navegador:23/23 suite completa PASS44.0s, mas prueba tactil1/1 PASS8.4s y gráfica negativa1/1 PASS5.1s:25 escenarios distintos (no una sola corrida25).
- Chromium teclado/toque emulado360/768 y visual1440x900;3lineas/cliente/fecha/total/guardar dentro900, sin overflow; grafica0.20/0.30/-0.10 y tabla exacta. Limites en IMPROVEMENTS_QA/UX_REVIEW.
- Restore QA snapshot14productos/7pedidos/15lineas/6gastos: FKs/totales exactos, login real, consulta protegida de TODOS los registros y privilegios PASS7.922s. Nunca restaurado sobre lumina ni Neon.
- Code/security y UX independientes APPROVE; evidencia IMPROVEMENTS_REVIEW.md, IMPROVEMENTS_UX_REVIEW.md e IMPROVEMENTS_QA.md.
- Servidor final local3000 iniciado; servidores QA cerrados; datos/cuentas reales sin fixtures ni modificaciones de negocio.

- 2026-10-01: conexión Neon directa/pooled verificada en solo lectura, TLS del cliente/certificado PASS, PostgreSQL18.6, public sin tablas. Credenciales en archivo ignorado; sin migraciones, transferencia de datos ni cambio del runtime local.

- 2026-10-01: usuario selecciona Vercel. Preparación de build con generación Prisma y región iad1; guía/env/gate en RUNBOOK. Proyecto Vercel/URL, rotación/roles Neon y autorización productiva pendientes; sin deployment.
- Preparacion Vercel: build:vercel (Prisma generate + Next/TypeScript) PASS, lint y diff check PASS; revision independiente cicd_expert APPROVE para configuracion/GitHub. No validacion cloud ni autorizacion de deployment.

- 2026-10-01: proyecto Vercel lumina-app confirmado en dossantosimas-projects; dominio lumina-app-sepia.vercel.app, sin deployment. Node22.x guardado; APP_URL y BETTER_AUTH_URL configuradas exclusivamente Production. Neon migraciones/roles, DATABASE_URL y BETTER_AUTH_SECRET pendientes. Esperando rotacion manual de credencial Neon y actualizacion del archivo ignorado.

- 2026-10-01: usuario autoriza preparar Neon reutilizando passwords de roles locales. Scripts ignorados neon-prepare/neon-apply preparados; secreto de firma propio de produccion. Auto-review rechazo ejecucion por necesitar aprobacion precisa de creacion de roles, cambio de owner y revocacion de permisos PUBLIC en neondb. Ninguna mutacion remota ejecutada; pendiente aprobacion de alcance.

- 2026-10-01: usuario aprueba explicitamente roles/cambio de ownership/revocacion PUBLIC y migraciones en neondb. Bootstrap y tres migraciones/grants completados; TLS pooled y privilegios runtime/operador/funciones verificados en solo lectura PASS. Revision independiente cicd_expert APPROVE. Datos comerciales y duenos en Neon: cero. Passwords de roles reutilizados de Docker por solicitud del usuario; firma Auth aleatoria propia de produccion. Secrets Vercel y primera cuenta/deployment siguen pendientes; no se transfirieron cuentas ni datos Docker.

- 2026-10-01: usuario autoriza explicitamente DATABASE_URL runtime restringida y BETTER_AUTH_SECRET en Vercel Production y deployment. Ambas variables Secret guardadas exclusivamente Production. Despliegue main commit9e95076 iniciado, ID EyDPNSfGAVsZJuqaHGnV7ZmeCD5L; comprobacion Ready/HTTPS pendiente. Transferencia de cuentas locales sigue pendiente de consentimiento especifico.

- 2026-10-01: Vercel Production Ready en56s, main9e95076, deployment EyDPNSfGAVsZJuqaHGnV7ZmeCD5L. URL https://lumina-app-sepia.vercel.app. Secrets runtime exclusivos Production; sin operador/migrador en Vercel. Smoke HTTPS sololectura PASS: login200, DENY/nosniff/HSTS, pantallas privadas y setup inicial redirigen login (Next streaming meta1s), session anonima null. No se ha probado login autenticado; cero cuentas productivas, autorizacion de copia de cuentas sigue pendiente.

- Production registration extension tested/reviewed:37unit/30integration, typecheck/lint/build PASS, isolated browser1/1 PASS with responsive screenshots. Code/security APPROVE; private activation code in ignored production-registration-code.txt. Waiting explicit permission to store INITIAL_SETUP_TOKEN in VercelProduction and deploy. No account created or transferred in Neon.

- LUM-21 final: 2026-10-01: Vercel Production Ready50s, deployment86gAgpBzw4cYdjfLqC6JrC3Anm91, main5126a55. /registro200 sin código; login Crear cuenta; HTTPS/cabeceras/guardas privadas/session anónima PASS10checks. Neon4migraciones, TLS y permisos restringidos PASS; cero cuentas comerciales creadas por QA. Registro/login reales del usuario pendientes de su uso, no de código.
- Code/security independiente APPROVE; 37unit/35integration, E2E1 compuesto aislado, typecheck/lint/build PASS. Notas históricas de token/transferencia quedan sustituidas por registro libre autorizado.

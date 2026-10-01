# Operación de Lúmina

Fecha: 2026-09-30. Autor: contrato doc_generator/quill; revisión documental pendiente de nexus. Describe comandos existentes y condiciones productivas; no activa infraestructura ni crea credenciales cloud.

## Entornos y secretos

| Archivo local ignorado | Uso |
|---|---|
| `.env` | Runtime: DATABASE_URL restringida, secreto/origen Better Auth y APP_URL |
| `.runtime/docker.env` y `postgres-password` | Puerto local y secreto administrador del contenedor |
| `.runtime/migrator.env` | URL directa de migración, APP_DB_ROLE/OPERATOR_DB_ROLE; nunca runtime web |
| `.runtime/operator.env` | URL directa de gestión Auth, secreto/origen Auth; nunca bundle web |
| `.runtime/test.env` | Runtime aislado de QA en lumina_test, puerto app 3001 |
| `.runtime/test-migrator.env` y `test-operator.env` | Migración/operador separados de QA |

No versionar, imprimir ni pegar secretos en argumentos, tickets o logs. `env:init` genera el conjunto local; `.env.example` solo muestra nombres/valores de sustitución, no debe utilizarse como credencial real. Preservar los archivos existentes junto con el volumen: eliminarlos y regenerarlos no cambia automáticamente contraseñas de roles ya creados. Archivos parciales requieren reparación controlada, sin pérdida de datos.

## Arranque y parada

La secuencia de instalación está en [README](../README.md#preparación-local-en-windows). Después de preparar DB/roles/migraciones:

```powershell
npm.cmd run db:up
npm.cmd run dev
```

Dev usa loopback y puerto 3000. Para validar build y arrancarlo localmente:

```powershell
npm.cmd run build
npm.cmd run start
```

Detén el proceso Node con Ctrl+C; `npm.cmd run db:stop` conserva el volumen. No uses `docker compose down -v` ni `prisma migrate reset` con datos que deban conservarse.

## Cuentas y recuperación de acceso

```powershell
npm.cmd run auth:operator -- provision
npm.cmd run auth:operator -- reset
npm.cmd run auth:operator -- revoke
```

Ejecutar en terminal interactiva por operador autorizado. Verificar identidad por canal conocido; contraseña nueva de 12–128 caracteres mediante prompt oculto. Provisión crea cuenta y habilita admisión; reset consume token de un solo uso en memoria y revoca sesiones; revoke desactiva admisión y elimina sesiones. No hay reset público/SMTP ni gestión administrativa desde la interfaz. Reset de contraseña no reactiva por sí mismo una cuenta revocada.

Todos los dueños autorizados tienen los mismos permisos de negocio. El runtime no modifica user/account ni admisión; operador separado gestiona Auth. Revocación usa lock incompatible con escrituras, evitando commit comercial posterior a una revocación ganadora.

El límite local de login es **5 intentos/minuto en un bucket compartido**, porque no se confían cabeceras IP de proxy. Varios dueños pueden compartir ese límite; esperar la ventana al recibir limitación. Antes de producción configurar y probar proxy/IP confiable según infraestructura; no activar X-Forwarded-For arbitrario.

## Migraciones y roles

```powershell
npm.cmd run db:generate
npm.cmd run db:migrate
npm.cmd run db:grants
npm.cmd run db:migrate:test
npm.cmd run db:grants:test
```

Las migraciones usan su URL directa y rol propietario; grants aplica permisos explícitos a runtime/operador. Runtime no es owner/superuser, no borra clientes/pedidos/gastos y no UPDATE/DELETE/TRUNCATE auditoría. Solo la función limitada lock_active_owner permite tomar el lock de admisión; EXECUTE público está revocado. La app actualiza/elimina líneas únicamente dentro del servicio transaccional de edición.

Antes de una migración productiva: revisar SQL y compatibilidad, copia recuperable, prueba aislada y autorización de deployment. Si falla, comprobar SQL realmente aplicado; `migrate resolve --rolled-back` cambia el estado registrado, no revierte SQL. Revertir aplicación solo sobre schema compatible. No ejecutar down destructivo contra datos reales.

## QA y restauración local

Ejecutar integración → E2E → carga → restore en secuencia, con DB de QA aislada. Integración/carga limpian tablas sintéticas. La configuración rechaza otro nombre/host de DB; nunca apuntar esos comandos a Neon.

```powershell
npm.cmd run test
npm.cmd run test:integration
npm.cmd run test:e2e
npm.cmd run qa:load
npm.cmd run qa:restore
```

Playwright utiliza Chromium y puerto 3001; instalar su navegador según README. QA prepara cuentas sintéticas. `qa:load` mide cinco dueños concurrentes y deja 1.000 pedidos multilínea. Mide servicios/DB locales, no internet ni navegador.

`qa:restore` realiza pg_dump custom en memoria de lumina_test, crea lumina_restore_test, restaura, reconstruye ownership y permisos reales mediante grants, comprueba auditoría/admisión/permisos y login/query Auth, y elimina la base temporal. No crea un backup productivo permanente. Si falla con destino existente, investigar el ensayo previo antes de eliminar una DB; no reutilizar nombres productivos.

Los resultados están en `.runtime/qa-load-result.json`, `.runtime/qa-restore-result.json`, `test-results/` y [QA_REPORT](QA_REPORT.md). No compartir trazas completas: pueden contener información privada de los escenarios. Comprobar fecha/resultados tras las últimas correcciones; no equiparar test existente a test pasando.

## Backups productivos y recuperación

Objetivo propuesto antes de activar producción: copia externa cifrada diaria, retención 7 días, RPO 24 horas y RTO objetivo 4 horas. Requiere destino/operador y costes aceptados; no constituye un SLA ni presupone que Neon incluya esa ventana.

El procedimiento productivo debe aprobarse y ensayarse con la infraestructura elegida:

1. Configurar conexión directa con TLS y validación de certificado/hostname para backup, con credencial dedicada/autorizada y permisos de lectura suficientes. Usar libpq/service y fichero de contraseña protegido fuera del repo; no colocar URL con contraseña en argumentos o logs.
2. Ejecutar pg_dump formato custom con herramientas PostgreSQL compatibles. El dump contiene datos privados y Auth: cifrarlo y enviarlo al destino externo aprobado, comprobar integridad y registrar solo metadatos.
3. Restaurar a una DB aislada usando pg_restore; reconstruir propietarios/roles y aplicar grants revisados antes de habilitar runtime. Omitir ownership/ACL del dump requiere reconstruirlos explícitamente, como en el ensayo local.
4. Verificar conteos, relaciones, líneas/totales exactos, historial, admisión/login y permisos negativos. No conectar la app productiva al destino de ensayo.
5. Ante incidente real, seleccionar copia verificada y plan de recuperación autorizado; comprobar RPO/RTO observado, actualizar conexiones mediante gestión de secretos y verificar acceso antes de reabrir operación.

La recuperación nativa de Neon depende del plan y restore window configurados; verificar su cobertura, sin reemplazar la copia externa por una suposición. Una copia en el mismo equipo no cubre su pérdida.

## Activación Neon y hosting

Credenciales Neon recibidas el 2026-10-01 y guardadas exclusivamente en `.runtime/neon-admin.env` (ignorado), para uso administrativo. Conexiones directa y pooled comprobadas mediante consultas de solo lectura: PostgreSQL 18.6, sin tablas en public, TLS del cliente y certificado verificados con sslmode=verify-full. El indicador pg_stat_ssl pertenece al tramo interno del proxy Neon; no sustituye la comprobación TLS del cliente. Docker sigue siendo el entorno local. La credencial compartida debe rotarse antes de producción; nunca usar neondb_owner en el runtime web. Hosting seleccionado por el usuario: Vercel (2026-10-01); proyecto cloud y URL pendientes. Antes de activar: validar compatibilidad de PostgreSQL 18.6 en staging sintético, migraciones/transacciones/locks/grants y adaptador; preparar roles runtime/operador separados y obtener autorización de deployment.

Runtime Node usa PrismaPg TCP y URL pooled Neon con hostname -pooler, rol restringido y TLS. Reutilizar pool por proceso y acotar conexiones. URL directa y credenciales de migrador/operador permanecen fuera del entorno web. No driver HTTP stateless ni estado/locks de sesión a través de pooling transaccional. Timeouts mediante rol/configuración transaccional compatible probada; nunca confiar SET de sesión persistente.

La publicación requiere dominio/HTTPS, proxy controlado, origen exacto Better Auth, secretos seguros, backups/coste y autorización. HSTS solo se emite con NODE_ENV production y origen Auth HTTPS; anti-framing/nosniff/referrer están configurados. Esta configuración no certifica una plataforma productiva: revisar exposición de red, ingress y TLS en el hosting concreto.

## Incidentes habituales

| Síntoma | Acción |
|---|---|
| npm.ps1 roto | Usar npm.cmd; no cambiar política PowerShell/global para ejecutar el proyecto |
| Docker daemon detenido | Iniciar Docker Desktop y esperar healthcheck antes de db:up/bootstrap |
| Puerto 55432 ocupado | Resolver conflicto antes de generar env; no regenerar credenciales de un conjunto existente |
| DB no disponible | La app conserva borrador y no confirma éxito; restablecer conexión y reintentar misma intención |
| Guardado incierto | Conservar pestaña/payload/clave y usar comprobar/reintentar; no crear otra operación equivalente |
| CONFLICT | Consultar versión vigente y comparar borrador; confirmar nueva acción explícita, sin sobrescribir |
| Login limitado | Esperar ventana de un minuto; revisar bucket compartido local y proxy antes de producción |
| Migración/grants falla | Verificar entorno directo/rol y SQL aplicado; no elevar privilegios del runtime como solución |
| Restore QA falla | Conservar evidencia mínima, comprobar DB aislada y permisos reconstruidos; no restaurar producción para probar |

Logs de acciones contienen requestId/operación/duración/código, sin cuerpos ni secretos. Al reportar un incidente incluir requestId y comportamiento; no contactos, tokens, cookies ni contraseñas.

## Primera cuenta local desde navegador

Con PostgreSQL levantado y app iniciada, abrir http://localhost:3000/configuracion-inicial o Crear primera cuenta en login. Registrar nombre/correo/contraseña12..128 y confirmación; entrar desde login cuando termine. El cierre es durable: no se reabre por revocar/eliminar dueños. Si ya hay cualquier cuenta, usar login o recuperación CLI. No insertar/borrar usuarios para reabrir configuración.
La vía web solo está habilitada para el origen loopback exacto configurado. En producción externa se mantiene provisión de operador mediante conexión directa y rol dedicado; no habilitar registro público ni incluir credenciales de operador en runtime.
Migrar ambas bases locales y reaplicar grants después del cambio LUM-11; no regenerar entornos existentes. Pruebas del primer registro utilizan una base aislada, nunca dejan dueños ficticios en lumina.


## Extensión catálogo — 2026-10-01

Nueva migracion202610010005_products aplicada local/test: seguir db:migrate y db:grants al preparar cualquier entorno autorizado. products runtime SELECT/INSERT/UPDATE sinDELETE; operador cuentas no recibe permisos comerciales. Restore QA incluye productos/FK y prueba login/consulta de TODOS los pedidos/productos con conteos del snapshot original, incluidos archivados. CLI script nunca apunta a lumina/Neon para QA. Catálogo inicial real vacio, carga manual por dueños; no importación automatica de textos históricos. Despliegue productivo sigue sujeto a dependencias/autorización originales.


## Preparación Vercel — 2026-10-01

Configuración versionada en vercel.json: Next.js, npm ci, npm run build:vercel y región iad1 cercana a Neon us-east-1. El build genera Prisma Client (src/generated no se versiona) y compila; no aplica migraciones ni recibe credenciales administrativas. Configurar Node22.x en Vercel; engines exige al menos22.22.0 y menos23.

Importar dossantosimas/lumina-app desde GitHub, directorio raíz y rama main. Antes de desplegar, preparar Neon con migrador/operador/runtime separados, migraciones y grants revisados; validar PostgreSQL18.6 en staging aislado. Mantener Docker local y datos existentes; no se ha autorizado transferencia de datos locales.

Variables exclusivamente Production:

| Variable | Valor a configurar |
|---|---|
| DATABASE_URL | URL pooled Neon con rol runtime restringido y sslmode=verify-full |
| BETTER_AUTH_SECRET | Secreto aleatorio propio de producción de al menos32 caracteres |
| BETTER_AUTH_URL | Origen HTTPS exacto asignado por Vercel o dominio propio, sin barra final |
| APP_URL | El mismo origen HTTPS exacto |

No configurar DIRECT_URL, DATABASE_URL_UNPOOLED, credenciales neondb_owner ni operador en Vercel; no prefijar secretos con NEXT_PUBLIC_. Preview no debe recibir la base productiva: requiere entorno y datos sintéticos independientes; si no existen, omitir Preview. Mantener proxy/IP conservador hasta revisión específica, login5/min compartido.

Primer dueño productivo por CLI de operador usando archivo ignorado separado `.runtime/neon-operator.env`, con DIRECT_URL de operador y secreto/origen productivos; ejecutar `node --env-file=.runtime/neon-operator.env node_modules/tsx/dist/cli.mjs scripts/auth-operator.ts provision` en terminal interactiva. /configuracion-inicial permanece solo local; las cuentas Docker no aparecen automáticamente en Neon.

Gate de publicación: rotar la credencial compartida, confirmar cuenta/proyecto Vercel y URL, entorno Neon validado/roles/copia recuperable, cuenta de dueño y autorización productiva. No se han aplicado migraciones ni publicado el sitio. Verificar después: HTTPS/login/logout/primer dueño, operación de pedidos/clientes/productos/gastos, filtros/resumen y ausencia de secretos en logs.

Fuentes: https://vercel.com/docs/functions/runtimes/node-js/node-js-versions y https://vercel.com/kb/guide/nextjs-prisma-postgres.


Actualizacion Neon 2026-10-01: con aprobacion explicita se crearon lumina_app/lumina_operator/lumina_migrator, schema public del migrador, sin permisos PUBLIC, y se aplicaron las tres migraciones/grants. Passwords de roles iguales al entorno local por solicitud del usuario; BETTER_AUTH_SECRET productivo independiente. Evidencia sanitizada ignorada neon-validation-result.json y neon-review-result.json: TLS verificado, limites runtime/operador y ownership/PUBLIC EXECUTE PASS; ninguna cuenta ni dato comercial transferido. Configuracion exclusiva ignorada neon-app.env/neon-operator.env/neon-migrator.env. No usar npm db:migrate (archivo local) para Neon: operacion directa mediante entorno neon-migrator separado y reviewed scripts. Falta secretos runtime en Vercel, cuenta productiva y smoke de aplicacion. Cuenta Vercel observada Hobby: verificar condiciones de uso comercial antes de activar operacion real (https://vercel.com/docs/limits/fair-use-guidelines).


Publicacion Vercel 2026-10-01: URL https://lumina-app-sepia.vercel.app, proyecto dossantosimas-projects/lumina-app, rama main, commit9e95076, deployment EyDPNSfGAVsZJuqaHGnV7ZmeCD5L Ready56s. Node22.x; las cuatro variables configuradas soloProduction, DATABASE_URL y BETTER_AUTH_SECRET como Secret. HTTPS/cabeceras/login/guardas privadas verificadas sin escrituras; no existe primera cuenta aun. Aprovisionar por operador o transferir exclusivamente cuentas locales activas con consentimiento explicito, conservando hashes BetterAuth y sin sesiones. La web inicial permanece bloqueada en origenexterno. No conectar localhost a Neon ni asumir que datos/cuentas Docker se transfirieron.


## Primera cuenta HTTPS autorizada — 2026-10-01

Usuario solicita registrarse en produccion. Configurar INITIAL_SETUP_TOKEN de64 caractereshex aleatorios como Secret exclusivoProduction en Vercel. Valor privado generado en `.runtime/production-registration-code.txt` (ignorado): el dueno lo introduce en Codigo de activacion, no en URL ni logs. No publicar ese archivo ni valor. Registro https://lumina-app-sepia.vercel.app/configuracion-inicial: nombre/correo/password12..128/confirmacion y codigo. Solo origen/host/proxy exactos configurados; aliases no son origen de registro. Falta del secreto mantiene registro HTTPS cerrado. Crear primera cuenta cierra la base permanentemente incluso tras revocar/borrar dueños. El login oculta el enlace al cerrarse. No afecta el bootstrap HTTPloopback local y no habilita signup generico. Quitar INITIAL_SETUP_TOKEN de Vercel despues de terminar el alta y redeploy para eliminar credencial de bootstrap residual. Otras cuentas siguen por operador; no transferir cuentas locales sin consentimiento.

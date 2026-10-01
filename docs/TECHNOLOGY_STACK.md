# Lúmina: stack aprobado y versiones fijadas

Status: APPROVED BLUEPRINT / TECHNOLOGY_FINALIZATION READY FOR REVIEW. Aprobación usuario: 2026-09-30. Versiones consultadas: 2026-09-30.
Autor: atlas. Revisión independiente de LUM-01 requerida antes de scaffold. Decisión central: [ADR-0001](adr/0001-stack.md).

## Selección

| Responsabilidad | Tecnología | Motivo y coste principal |
|---|---|---|
| Aplicación web | Next.js App Router, React, TypeScript | Interfaz y operaciones de servidor en una aplicación; exige controlar fronteras cliente/servidor y caché de datos privados |
| Runtime y paquetes | Node.js LTS compatible, npm y lockfile | Ejecución portable; actualizar dependencias y verificar compatibilidad sigue siendo responsabilidad del proyecto |
| Persistencia | PostgreSQL: Docker local; Neon en producción | Decisión del usuario del 2026-09-30; relaciones y transacciones conservadas, DB gestionada con coste/plan por acordar |
| Acceso a datos | Prisma y Prisma Migrate | Contratos tipados y migraciones trazables; revisar SQL generado y evitar serializar Decimal directamente |
| Validación | Zod | Validación explícita en el servidor; tipos estáticos no sustituyen validar entradas |
| Autenticación | Better Auth, adaptador Prisma, email/contraseña | Sesiones revocables y hashing mantenido por librería; requiere aprovisionamiento cerrado y configuración segura |
| Presentación | CSS Modules y CSS global pequeño | Interfaz responsive sin framework visual adicional; diseñar componentes accesibles propios |
| Pruebas | Vitest, Playwright | Reglas de dominio y recorridos reales; necesitan DB de pruebas aislada y navegadores disponibles |
| Calidad | TypeScript strict, ESLint, build Next.js | Errores estáticos y build reproducible; complementan revisión y QA |
| DB local | PostgreSQL en Docker Compose | Desarrollo y pruebas reproducibles tras aprobación; Docker debe estar disponible, sin modificar instalación del equipo automáticamente |

## Versiones exactas de LUM-01

| Paquete / herramienta | Pin | Evidencia de compatibilidad |
|---|---|---|
| Node.js | 22.22.0 | Runtime disponible comprobado; satisface engines de Next, Prisma, auth CLI, Vitest y ESLint |
| npm | >=10.9.4 compatible con Node22.22 | 10.9.4 local y 11.19.0 en entorno autorizado verificados por nexus; registrar versión usada al generar lockfile, no instalar/cambiar npm global |
| next / eslint-config-next | 16.3.7 / 16.3.7 | Next Node>=20.9; React19 y Playwright>=1.51 compatibles |
| react / react-dom | 19.3.0 / 19.3.0 | Mismo release; peer react-dom ^19.3 |
| typescript | 5.9.3 | Parser typescript-eslint acepta >=4.8.4 <6.1; latest TS7 fuera de rango |
| prisma / @prisma/client / @prisma/adapter-pg | 7.10.0 / 7.10.0 / 7.10.0 | Misma versión estable exacta; Node ^22.12. No Prisma latest 8.0.0-rc.19 |
| pg / @types/pg | 8.23.0 / 8.23.1 | Driver Node PostgreSQL TCP; Better Auth peer pg ^8 |
| better-auth / auth CLI | 1.7.6 / 1.7.6 | Better Auth peers Next16, React19, Prisma7; CLI Node>=22.12 |
| zod | 4.6.5 | Satisface dependencia Better Auth ^4.5.4 |
| vitest / vite | 5.0.3 / 8.3.1 | Vitest acepta Vite8; ambos soportan Node22.22; Vite solo herramienta de tests, no otro frontend |
| @playwright/test | 1.63.0 | Node>=20; navegadores se instalan explícitamente en QA/scaffold |
| eslint | 9.39.4 | Plugins React/import/jsx-a11y de Next aceptan ESLint9; latest10 fuera de peers |
| tsx / dotenv / server-only | 4.23.15 / 18.0.4 / 0.0.1 | Scripts operador TypeScript, carga env server y barrera server-only |
| @types/node | 22.20.4 | Tipos major22 del runtime, no latest26 |
| @types/react / @types/react-dom | 19.3.0 / 19.3.0 | Tipos major19 alineados |
| PostgreSQL Docker | postgres:17.11-bookworm | Tag oficial comprobado; major17 soportada Neon y minor17.11 publicada/rollout documentado |

CSS Modules no añade paquete. Pins sin caret/tilde en manifest; lockfile generado/revisado durante scaffold fija transitivas. Pin de imagen por digest se registra después de pull verificado, no inventar digest ahora. Neon usa major17; minor gestionada por proveedor, confirmar version() en staging autorizado antes activar, no exigir congelar minor cloud.

Consultas metadata al registro oficial (sin instalar paquetes) verificaron engines, peerDependencies y versiones exactas. `prisma/latest` anuncia RC8; endpoint `/prisma/7.10.0` verifica versión estable coincidente. La CLI actual se llama `auth`, documentada en instalación Better Auth; no usar `@better-auth/cli` antiguo 1.4.x con runtime1.7.6. TS5.9.3 y ESLint9.39.4 son selección conservadora por peers, no máximos dist-tags.

Comandos previstos solo para scaffold posterior a review, aún no ejecutados:

```powershell
npm.cmd install --save-exact next@16.3.7 react@19.3.0 react-dom@19.3.0 @prisma/client@7.10.0 @prisma/adapter-pg@7.10.0 pg@8.23.0 better-auth@1.7.6 zod@4.6.5 dotenv@18.0.4 server-only@0.0.1
npm.cmd install --save-dev --save-exact typescript@5.9.3 prisma@7.10.0 auth@1.7.6 vitest@5.0.3 vite@8.3.1 @playwright/test@1.63.0 eslint@9.39.4 eslint-config-next@16.3.7 tsx@4.23.15 @types/node@22.20.4 @types/react@19.3.0 @types/react-dom@19.3.0 @types/pg@8.23.1
```

## Contratos de implementación del conjunto

Prisma7: config TypeScript para URL directa de CLI; generator `prisma-client` con output explícito, Client mediante PrismaPg y runtime Node. generate no requiere datos reales. Mejor Auth Prisma schema generado mediante CLI local `auth@1.7.6 generate` con config server y esquema revisado antes migración; la CLI generate no se usa como migración productiva. Modelo AuthUser/Account/Session/Verification/RateLimit alineado al adaptador, UUID y activeAccess default false/input:false; mapear nombres de modelo como documenta librería, no improvisar tablas. No habilitar plugins OAuth/SSO/device/magic-link/email-OTP. Web allowlist, instancia CLI separada, tx owner lock, audit inmutable/redactado, idempotencia mínima, decimal numeric(14,2) y límites API permanecen obligatorios.

Pruebas de compile/generate/adapter/auth CLI/schema/grants/locks/DB y npm audit son parte de LUM-02 y siguientes; metadata compatible no afirma build ni instalación ejecutados. Revisión LUM-01 confirma contratos; LUM-02 demuestra compatibilidad efectiva y corrige falla sin relajar seguridad.

## Seguridad de dependencias

Se consultaron avisos oficiales Next/React, Better Auth y release PostgreSQL17.11. Better Auth1.7.6 queda fuera de rangos afectados GHSA-qq9h-g4jm-xgf3 y GHSA-q84f-53jg-9ppm; tampoco se habilitan esos plugins. No declarar árbol libre de vulnerabilidades por esta consulta: revisar `npm audit` sobre lockfile real y advisories aplicables antes entrega, corregir hallazgos bloqueantes. Next/React seleccionados posteriores a las correcciones RSC documentadas; endpoints de Server Actions siguen expuestos y requieren guard explícito.

Fuentes: [registry Next](https://registry.npmjs.org/next/16.3.7), [Prisma estable](https://registry.npmjs.org/prisma/7.10.0), [Better Auth metadata](https://registry.npmjs.org/better-auth/1.7.6), [CLI auth](https://registry.npmjs.org/auth/1.7.6), [CLI documentada](https://better-auth.com/docs/installation), [TypeScript](https://registry.npmjs.org/typescript/5.9.3), [ESLint9](https://registry.npmjs.org/eslint/9.39.4), [Next advisories](https://github.com/vercel/next.js/security/advisories), [React RSC notice](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components), [Better Auth password advisory](https://github.com/better-auth/better-auth/security/advisories/GHSA-qq9h-g4jm-xgf3), [device advisory](https://github.com/better-auth/better-auth/security/advisories/GHSA-q84f-53jg-9ppm), [PostgreSQL17.11](https://www.postgresql.org/docs/release/17.11/), [imagen oficial](https://raw.githubusercontent.com/docker-library/official-images/master/library/postgres), [Neon versión17](https://raw.githubusercontent.com/neondatabase/website/main/content/docs/postgresql/postgres-version-support.md).

## Evaluación de alternativas

| Criterio del framework | Monolito seleccionado como propuesta | React/Vite + Supabase considerado |
|---|---|---|
| Complexity | Una aplicación; servidor y DB explícitos | Menos operación propia; políticas RLS y funciones SQL añaden fronteras |
| Maturity | Framework documentado, SQL transaccional | PostgreSQL y servicios Auth/API documentados |
| Maintainability | Reglas centralizadas por función del negocio | Reglas entre frontend, SQL y proveedor |
| Scalability | Adecuado para pocos dueños; ampliar Node/DB | Adecuado; condicionado a límites del servicio |
| Cost | Runtime/DB y mantenimiento; sin gastos activados | Servicio y límites del plan; sin asumir gratuidad productiva |
| Developer experience | Tipado compartido, pruebas de dominio | CRUD inicial rápido; pruebas de permisos imprescindibles |
| Ecosystem | React/TypeScript/SQL y herramientas estándar | React/TypeScript/SQL más SDK proveedor |
| Deployment | Node o contenedor, PostgreSQL | Frontend estático y backend remoto |
| Security | Guard de dueño en servidor en cada operación | RLS en todas las tablas expuestas y funciones |
| Vendor lock-in | Bajo en datos/hosting; moderado en framework/ORM | Moderado en Auth/API/Storage, menor en datos SQL |

La preferencia responde a reglas atómicas y mantenimiento portable, sin necesidad de realtime. El usuario seleccionó PostgreSQL Docker para desarrollo y Neon para producción el 2026-09-30; esto no aprueba el blueprint ni autoriza cuentas, contratos o deployment. Hosting de aplicación Node aún no elegido.

## Operación y dependencias de entrega

Implementación local: package.json y lockfile fijan overrides indirectos deepmerge-ts 8.0.2 y mysql2 3.24.5. Corrigen avisos del árbol de herramientas Prisma sin bajar el major aprobado ni usar audit fix --force. Generate/migraciones/build pasaron con esos overrides; npm audit independiente devolvió cero vulnerabilidades el 2026-09-30. Referencias: [deepmerge-ts, advisory primario](https://github.com/advisories/GHSA-ggr8-5vv4-36mx) y [mysql2, advisory primario](https://github.com/advisories/GHSA-rgwj-5xj2-c3m3). ESLint9 se conserva por compatibilidad declarada con eslint-config-next16; su aviso de soporte queda registrado como dependencia de tooling, sin afirmar soporte vigente.

El código se validará localmente después de la aprobación, con datos sintéticos y cuentas de prueba en Docker, nunca producción. La entrega incluirá guía de Node, variables, migraciones, aprovisionamiento y restauración. Para internet se requieren hosting Node, cuenta/DB Neon, HTTPS, URL, credenciales y backup externo; contratar y desplegar exige autorización del usuario. No se han creado cuentas ni conectado Neon. Staging Neon con datos sintéticos solo después del gate y con credenciales autorizadas; evidencia local no afirma compatibilidad cloud ejecutada.

## Conexión y compatibilidad Docker → Neon

Runtime Node usa Prisma con adaptador PostgreSQL TCP (`@prisma/adapter-pg` compatible) y `DATABASE_URL` del rol restringido de aplicación. En Neon usar URL pooled, hostname `-pooler`, con TLS y validación de certificado/hostname; no desactivar validación. Transacciones interactivas Prisma mantienen locks de fila hasta commit dentro de la misma transacción: no usar driver HTTP stateless ni estado/advisory locks de sesión. Reutilizar cliente/pool por proceso y limitar conexiones según instancia/plan. Si pruebas autorizadas revelan incompatibilidad, detener activación y corregir conexión sin relajar invariantes.

`DIRECT_URL` sin pooler queda exclusivamente en entorno del operador/migración, con credencial separada para DDL/grants y pg_dump/pg_restore. El runtime web no recibe ese secreto ni privilegios; ambos URL son server-only, jamás NEXT_PUBLIC ni log/CLI visible. Operador Auth usa conexión directa y permisos mínimos de gestión de cuentas, nunca privilegios publicados a web. Migración crea dueños de schema y grants explícitos: runtime no es owner ni superuser, sin UPDATE/DELETE/TRUNCATE de AuditEvent. Restore en DB aislada aplica ownership/grants revisados antes de habilitar runtime; no asumir grants incluidos/correctos automáticamente. Compatibilidad de roles Neon se verifica antes de activar.

TECHNOLOGY_FINALIZATION fija major17 e imagen postgres:17.11-bookworm para Docker/dev/test y herramientas pg_dump/restore17.11. Probar migraciones/transacciones/locks/adaptador localmente y luego en staging Neon autorizado antes de producción. No reemplazar Docker solicitado por PostgreSQL portable sin acordarlo si Docker falta.

Coste, región, límites, autosuspensión/latencia y restore window dependen del proyecto/plan Neon elegido. No asumir producción gratis, SLA, retención de siete días ni backup externo incluido. Mantener objetivo de copia externa diaria/7 días y restauración ensayada de ARCHITECTURE; validar qué cubre el restore nativo y qué requiere almacenamiento externo antes de activar.

Fuentes verificadas 2026-09-30: [Neon pooling, fuente oficial](https://raw.githubusercontent.com/neondatabase/website/main/content/docs/connect/connection-pooling.md), [Neon roles, fuente oficial](https://raw.githubusercontent.com/neondatabase/website/main/content/docs/manage/roles.md), [Prisma conexión/adaptador PG](https://docs.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections), [Neon restore y coste](https://neon.com/blog/new-usage-based-pricing). Los docs Neon web devolvieron markdown no legible por navegador; se verificó su repositorio oficial.

## Evidencia primaria

Consultada el 2026-09-29: [Next.js](https://nextjs.org/docs/app/getting-started), [deployment portable](https://nextjs.org/docs/app/getting-started/deploying), [Prisma transacciones](https://www.prisma.io/docs/orm/fundamentals/transactions), [Zod](https://zod.dev/), [Better Auth integración Next.js](https://better-auth.com/docs/integrations/next), [adaptador Prisma](https://better-auth.com/docs/adapters/prisma), [Vitest](https://vitest.dev/guide/), [Playwright](https://playwright.dev/docs/intro). Alternativa: [Supabase Database](https://supabase.com/docs/guides/database/overview), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) y [backups](https://supabase.com/docs/guides/platform/backups).

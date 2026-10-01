# ADR-0001: monolito web portable para Lúmina

Date: 2026-09-29. Status: ACCEPTED. Approval date: 2026-09-30, usuario «Aprobado».
Deciders: dueños de Lúmina con recomendación técnica atlas/nexus. Blueprint revisado independientemente; finalización de versiones LUM-01 requiere review antes de scaffold.

## Context

Lúmina requiere registrar pedidos multilínea, clientes y gastos completos en COP. Dueños con permisos iguales usan navegadores de celular, tablet y PC con internet. No inventario, catálogo, pagos ni adjuntos en este alcance. Persistencia compartida, importes exactos y cambios atómicos importan más que escala independiente. No hay proveedor contratado, presupuesto acordado ni fecha límite. Evitar complejidad de operación innecesaria y dependencia fuerte de servicios remotos.

## Decision propuesta

Construir un monolito modular Next.js/TypeScript ejecutable en Node con PostgreSQL, Prisma, Zod y Better Auth. Organizar por clientes/pedidos/gastos, con servicios exclusivamente de servidor y una DB transaccional. CSS Modules, Vitest y Playwright completan presentación y verificación; stack completo en TECHNOLOGY_STACK.md.

Elegir una sola capa Node para auth y CRUD: el default híbrido edge/contenedor/serverless de atlas añade runtimes y diagnósticos sin requisitos de batch, fan-out o latencia global. No desplegar edge ni Redis solo por ese default. Mantener auth admitida por operador y sesiones DB; no sistema propio de contraseñas.

## Alternatives considered

1. **React/Vite + Supabase:** viable, menos infraestructura backend propia, Auth/API gestionadas y datos PostgreSQL. Costes: reglas repartidas entre frontend, RLS y funciones; mayor acoplamiento a servicios Auth/API y cobertura de backups condicionada al plan, con Storage separado. No se propone porque transacciones y reglas centralizadas favorecen un backend pequeño portable; si operación gestionada se vuelve prioridad comercial, reconsiderar en un ADR nuevo.
2. **Monolito Django + PostgreSQL:** viable, auth y ORM integrados, modelo operativo simple. Costes: Python en backend más TypeScript/JS si se busca UI rica; o interacción tradicional por formularios con frontend adicional para pedidos dinámicos. No se propone porque un único lenguaje TypeScript y componentes interactivos facilita mantener la interfaz responsive multilínea con contratos compartidos. No se atribuye inferioridad técnica ni de seguridad.

## Consequences

Positivas: una frontera de validación/autorización, transacciones SQL para pedido completo, DB portable y pruebas de dominio claras. La funcionalidad no depende de cuenta cloud durante desarrollo.

Negativas: el operador mantiene runtime, DB, versiones, backups y cuentas. Next.js requiere cuidado de caché y acciones expuestas. Prisma/Better Auth añaden compatibilidad de adaptador y esquema que debe probarse. Recovery sin SMTP depende de operador autorizado; acceso compartido externo requiere hosting y HTTPS.

Neutrales: el 2026-09-30 el usuario seleccionó PostgreSQL Docker para desarrollo y Neon para producción y aprobó el blueprint. Hosting Node permanece por elegir y activación Neon requiere cuenta, plan, credenciales y autorización, sin gasto ni cuentas activadas. Docker depende de disponibilidad del equipo. No hay pruebas cloud ejecutadas durante blueprint.

Neon conserva modelo SQL y reduce operación del servidor DB; añade dependencia de proveedor, red/latencia, pooling y límites de plan. Usar Prisma PG TCP pooled para runtime y conexión directa con credencial separada para operación/migración/backups; no HTTP stateless que rompa transacciones interactivas/locks. Grants audit y versiones compatibles se validan según TECHNOLOGY_STACK.md. No asumir backup, coste cero ni SLA.

## Implementation plan y fitness

Solo tras aprobación: fijar versiones compatibles soportadas, verificar auth/adaptador, scaffold local, migraciones, slices, pruebas y revisiones. Criterios de fitness: módulos cliente no importan DB/auth/servicios server-only (build y chequeo de imports); guard negativo en cada operación; test SQL de pedido atómico; decimal sin Number; test de replay/concurrencia. Typecheck, lint, tests, build y restauración aislada deben pasar antes de entrega.

Rollback de cambios: DB de desarrollo se puede recrear con datos sintéticos; en producción usar backup validado y migraciones compatibles, sin borrar datos reales para volver atrás. Cambio futuro de stack requiere nuevo ADR y plan de migración, no modificar un ADR aceptado. Revisar resultados un mes después de aceptar mediante registro nuevo: Confirmed, Superseded o Deprecated; no se crea automatización sin solicitud.

## References

[Next.js deployment](https://nextjs.org/docs/app/getting-started/deploying), [Prisma transactions](https://www.prisma.io/docs/orm/fundamentals/transactions), [Better Auth Prisma](https://better-auth.com/docs/adapters/prisma), [PostgreSQL transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html), [Supabase Database](https://supabase.com/docs/guides/database/overview), [Django overview](https://docs.djangoproject.com/en/stable/intro/overview/).

Actualización de proveedor 2026-09-30: [Neon pooling, fuente oficial](https://raw.githubusercontent.com/neondatabase/website/main/content/docs/connect/connection-pooling.md), [Neon roles](https://raw.githubusercontent.com/neondatabase/website/main/content/docs/manage/roles.md), [Prisma conexiones PG](https://docs.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections), [Neon coste/restore](https://neon.com/blog/new-usage-based-pricing). No se fijan tarifas, SLA ni límites numéricos de plan a partir de referencias históricas.

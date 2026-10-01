# Migraciones

Schema Auth generado oficialmente con `node node_modules/auth/dist/index.mjs generate --config scripts/auth-schema-config.ts --output prisma/auth.generated.prisma --yes`; archivo original conservado. Integración añade únicamente las relaciones inversas a audit e idempotencia.

La migración inicial crea tablas e índices en una DB vacía. No elimina datos. Para revertir sobre una DB con datos se requiere copia/restore en base aislada y autorización del operador; no ejecutar DROP ni migrate reset contra datos reales. `db:migrate` y `db:grants` usan el entorno del migrador exclusivamente. Runtime y operador no son owners. La credencial del migrador no pertenece al entorno web.

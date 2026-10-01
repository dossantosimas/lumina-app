# Primera cuenta — QA independiente

Fecha: 2026-09-30. Recurso: `framework/agents/quality/test_generator.toml`, trazado en INVENTORY/SOURCES. Implementación producida por especialistas backend/frontend; QA no cambió código de aplicación ni permisos productivos.

**Resultado: PASS.** Verificación real con Chromium, build Next.js y PostgreSQL Docker local. No se crearon cuentas en la base de negocio `lumina`.

| Verificación | Evidencia |
|---|---|
| Regresión integración original + nueva | `npm.cmd run test:integration`: 22/22 PASS, 3 archivos, 5,07 s. Incluye concurrencia, cierre definitivo, permisos restringidos, rollback, origen/host, acceso y negocio. |
| Primera cuenta en navegador | `node scripts/qa-initial-setup.mjs`: 1/1 escenario PASS, 5,4 s. Base temporal exclusiva `lumina_initial_setup_e2e`, Next **start** en puerto 3002, migraciones y grants reales; eliminada al terminar. |
| Regresión UI de negocio | `$env:QA_E2E_BUILT='1'; $env:CI='1'; npm.cmd run test:e2e`: 14/14 PASS, 26,7 s. Next **start** en puerto 3001 con `lumina_test`; no escribe build mientras está abierto el servidor de negocio. |
| Tipos y lint, incluyendo tests añadidos | `npm.cmd run typecheck` y `npm.cmd run lint`: exit 0. |

El escenario UI comprobó:

- Enlace «Crear primera cuenta» desde login y formulario «Primera cuenta».
- Anchos 360, 768 y 1280 sin desbordamiento horizontal; campos y botones visibles. Capturas sin datos ni contraseñas: [móvil](qa-visual/initial-setup-360.png), [tablet](qa-visual/initial-setup-768.png), [escritorio](qa-visual/initial-setup-1280.png). Inspección visual móvil: logo legible, formulario alineado y acciones visibles.
- Formulario vacío: foco al nombre, campos `aria-invalid` y descripciones de error asociadas a nodos visibles.
- Navegación de teclado nombre → correo → contraseña; límites declarados de 12–128 caracteres, contraseña corta y confirmación distinta rechazadas, conteo de identidades aún cero.
- POST real pausado: botón «Creando cuenta…» deshabilitado, formulario `aria-busy` y correo deshabilitado mientras espera; no éxito anticipado.
- Creación real: exactamente una identidad, redirección `/login?cuenta=creada`, aviso «Tu cuenta está lista», enlace inicial desaparece; login con contraseña creada llega a `/resumen` y guard privado admite la cuenta.
- Navegador anónimo nuevo: `/configuracion-inicial` redirige a login después del alta y no muestra el enlace de configuración.

Las primeras corridas fallaron por localizadores del test que exigían etiquetas exactas: la ayuda/error dentro del `label` amplía su nombre accesible. Se corrigieron selectores de los tests a identificadores `name` existentes y se repitió desde una base vacía; no fue un fallo de la aplicación.

## Repetición y límites

Primero compilar con `npm.cmd run build`; mantener Docker activo y entorno local de pruebas generado. Ejecutar `node scripts/qa-initial-setup.mjs`. El runner rechaza sobrescribir una base temporal ya existente, usa credenciales en memoria y `.runtime` ignorado, aplica todas las migraciones y permisos mínimos, y elimina únicamente su base temporal al salir. No activa trace ni imprime contraseñas/URLs de conexión. El escenario crea una identidad sintética exclusivamente en esa base.

Cobertura de concurrencia de dos creadores y CLI compitiendo pertenece a integración real; no se duplicó artificialmente en navegador. No se validaron Neon, publicación externa, todas las tecnologías asistivas ni usabilidad con dueños reales. Capturas son evidencia de disposición visual, no una auditoría completa de accesibilidad.


Production bootstrap extension 2026-10-01:37 unit tests/30 integration PASS; typecheck/lint/build:vercel PASS. Production-mode token/origin/proxy validation and concurrent valid-token create/login tested in isolatedPostgreSQL; invalid token leaves zero identities. Browser initial-owner E2E1/1 PASS2.8m (assertions2.6s; Windows QAserver teardown needed scoped stop of only testserver3002). Screenshots360/768/1280 updated; no synthetic users created in Neon. Published activation still awaits INITIAL_SETUP_TOKEN authorization.

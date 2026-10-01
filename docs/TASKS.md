# Lúmina — Tasks

Estado: blueprint aprobado explícitamente por el usuario el 2026-09-30. Autor: project_manager; integración: nexus. Ejecución automática del lifecycle autorizada.
Fuente compartida: REQUIREMENTS.md, ARCHITECTURE.md, API_DESIGN.md, DATABASE_DESIGN.md, UX_PLAN.md y TECHNOLOGY_STACK.md, versión de blueprint aprobada.

| ID | Título | Owner/role | Dependencias | Prioridad | Estado |
|---|---|---|---|---|---|
| LUM-01 | Fijar stack y validar contratos | atlas; database_architect | Blueprint aprobado | P0 | DONE |
| LUM-02 | Preparar aplicación y DB reproducibles | cicd_expert; backend_developer | LUM-01 | P0 | DONE |
| LUM-03 | Dar acceso exclusivo a los dueños | backend_developer; frontend_developer | LUM-02 | P0 | DONE |
| LUM-04 | Registrar y mantener clientes | backend_developer; frontend_developer | LUM-03 | P0 | DONE |
| LUM-05 | Registrar pedidos de varias velas | backend_developer; frontend_developer | LUM-04 | P0 | DONE |
| LUM-06 | Registrar gastos de facturas completas | backend_developer; frontend_developer | LUM-04 | P0 | DONE |
| LUM-07 | Consultar resumen por fechas | frontend_developer; backend_developer | LUM-05, LUM-06 | P1 | DONE |
| LUM-08 | Verificar flujos y errores | test_generator; uiux_designer | LUM-07 y reviews de milestones | P0 | DONE |
| LUM-09 | Cerrar seguridad, código y build | security_auditor; code_reviewer; cicd_expert | LUM-08 | P0 | DONE |
| LUM-10 | Probar recuperación y entregar | cicd_expert; doc_generator; nexus | LUM-09 | P0 | DONE |

Estados permitidos: TODO, IN_PROGRESS, BLOCKED, REVIEW, DONE. Cada milestone exige revisión independiente; nadie aprueba su propio código.

## LUM-01 — Stack y contratos compatibles
Descripción: fijar versiones soportadas y contratos consistentes antes de iniciar código.
Aceptación: versiones verificadas en fuentes oficiales; notas, audit mínimo, admisión, dinero, archivo/restauración, histórico y resumen alineados; schema Auth definido por herramienta oficial; inspección de Docker elegido por usuario y resolución autorizada si falta; major PG compatible local/Neon, adaptador PG TCP, URL pooled runtime/direct operator y grants verificados; architecture-review independiente sin hallazgos materiales abiertos.
Comprobar: revisión documental y compatibilidad; no requiere scaffold. Skills atlas/design/architecture-review.

## LUM-02 — Entorno reproducible
Descripción: aplicación local arrancable con PostgreSQL persistente y pruebas separadas.
Aceptación: npm/lockfile, .env.example sin secretos; schema/migraciones revisados; usuario DB de aplicación separado de migración y sin UPDATE/DELETE audit; tokens/navegación responsive; scripts previstos operativos; DB prueba aislada, sin producción por defecto.
Comprobar: npm ci; typecheck/lint/test/integration/build según IMPLEMENTATION_PLAN; reiniciar DB y confirmar datos sintéticos. Skill scaffold. Sin funcionalidades extra.

## LUM-03 — Acceso privado
Descripción: login/logout individual y datos compartidos solo entre dueños autorizados.
Aceptación: guard por query/action y replay; allowlist Auth web; activeAccess false/input:false; provisión/reset/revocación CLI sin secretos expuestos; revocación concurrente no deja escritura posterior ganadora; cuentas iguales; logout limpia borradores; cookies/origen/rate limit correctos.
Comprobar: consultas directas sin sesión/no admitido/desactivado; endpoints denegados; reset y revocación; dos cuentas. Security review antes milestone. REQ-005, NFR-002.

## LUM-04 — Clientes
Descripción: crear/buscar/ver/editar/archivar/restaurar clientes compartidos.
Aceptación: nombre y límites; contacto/notas opcionales; duplicados permitidos; listas paginadas; confirmación archive/restore; archivados sin edición; historial mínimo con flags contacto/notas, protegido; clave repetida un resultado; versión vieja conflicto conserva borrador. Get histórico abre cliente archivado desde pedido activo; historial asociado lista pedidos de ambos estados mediante filtro all y muestra estado.
Comprobar: unitarias/integración y E2E teclado/filtros/dos dueños. REQ-004/005/008, AC-004/005/008.

## LUM-05 — Pedidos detallados
Descripción: conservar lo solicitado por cliente y sumar varias velas con dinero exacto.
Aceptación: cliente activo al crear/cambiar, cliente archivado existente admitido en edición/restauración; creación de cliente dentro del formulario conserva líneas; 1..100 líneas y límites API; 2×25.000+1×35.000=85.000 COP; total server; transacción líneas/audit/idempotencia sin parciales; snapshot histórico; archivo/restauración y conflictos/red sin pérdida o duplicados.
Comprobar: fallo inducido de línea, overflow, envíos simultáneos, carrera archive cliente, misma versión; E2E tres tamaños. REQ-001/006/007/008, AC-001/006/007/010/014/015.

## LUM-06 — Gastos
Descripción: factura completa en un gasto sin desglose ni adjunto.
Aceptación: fecha/concepto/total positivo y proveedor/ref opcionales; crear/ver/editar/filtrar/archivar/restaurar con historial; dinero exacto; reintentos/conflictos no duplican/sobrescriben; cancelar confirmación no altera datos.
Comprobar: factura 120.000 COP; validación negativa; replay y archivo/restauración. REQ-002/003/008, AC-002/003/011/012.

## LUM-07 — Resumen
Descripción: ver pedidos, gastos y diferencia registrada de un periodo.
Aceptación: mes actual Bogotá inicialmente; rango inclusivo dateOnly; agregados exactos snapshot consistente y últimos registros del mismo periodo; excluir archivados pedido/gasto, no pedidos de cliente archivado; diferencia negativa permitida y no presentada como utilidad/cobros; fallo no muestra cero falso.
Comprobar: fixtures límites del mes, sumas mayores al límite por registro, cero real vs error; checks y E2E. REQ-009, AC-009.

## LUM-08 — QA y UX
Descripción: probar cada criterio aprobado con evidencia independiente.
Aceptación: matriz REQ/AC/NFR→prueba/evidencia; 360/768/1280 sin overflow; teclado/contraste/foco/zoom; dos cuentas, persistencia, errores de red y edición; 1.000 pedidos/5 usuarios p95 ≤3 s entorno documentado; defectos corregidos; distinguir tiempos UX propuestos de pruebas humanas realizadas.
Comprobar: suite completa y comando de carga reproducible creado después gate. NFR-001..006 y AC-001..015. Skills test/radar/attest cuando corresponda.

## LUM-09 — Reviews y build
Descripción: cerrar hallazgos y confirmar que la misma versión final compila.
Aceptación: reviewers distintos de productores; evidencia/severidad/acción/cierre; auth/secretos/logs/origen/audit/recovery/dependencias; código dinero/tx/version/replay; sin bloqueantes abiertos; suite y build pasan tras últimas correcciones.
Comprobar: scripts completos y revisión de dependencias; registrar resultados reales. Skills judge/review y seguridad según alcance.

## LUM-10 — Recuperación y entrega
Descripción: demostrar recuperación y explicar operación de la app validada.
Aceptación: dump protegido/restore DB aislada con datos sintéticos; relaciones/totales/historial/acceso verificados; README/runbook instalación/variables/migraciones/cuentas/ejecución/tests/backups/deploy; TASKS/STATUS/requisitos actualizados; limitaciones productivas explícitas, sin afirmar hosting activo; COMPLETE solo con gates cumplidos.
Comprobar: seguir guía desde ambiente limpio; restauración aislada y evidencia final. Neon seleccionado como DB productiva; hosting Node pendiente. Documentar TLS, secretos/roles separados, pooled runtime/direct operación y backup/restore plan-dependiente; staging Neon solo sintético con credenciales autorizadas tras gate. No desplegar producción ni contratar servicios sin autorización y dependencias resueltas.



Cierre 2026-09-30: LUM-01..10 DONE. Revisiones independientes Approve, QA29/16/14 PASS, build/typecheck/lint final PASS, recuperación/restauración y visual cerradas. Evidencia en DELIVERY.md y QA_REPORT.md; producción pendiente fuera del contrato local.

## LUM-11 — Primera cuenta desde navegador (DONE)

Cambio autorizado explícitamente por el usuario después de la entrega inicial: necesita acceder sin aprovisionar su primera cuenta mediante terminal.
Owner: backend_developer/frontend_developer; revisión: security_auditor/code_reviewer; QA independiente.
Aceptación: enlace visible en login cuando no hay ninguna cuenta; formulario nombre/correo/contraseña/confirmación; contraseña oculta12..128 y errores accesibles; creación atómica de una única primera cuenta y cierre durable ante concurrencia; revocación/eliminación no reabren configuración; signup público sigue denegado; origen exacto/loopback, sin habilitación automática externa; secretos operador/migrador ausentes en web y permisos DB mínimos; login real con primera cuenta; enlace desaparece tras registro; responsive/teclado; pruebas/build/reviews y guía actualizadas.

Cierre LUM-11: INITIAL_SETUP_QA.md y INITIAL_SETUP_REVIEW.md, gates PASS y hallazgos IS-01/02 CLOSED. Primera cuenta disponible en navegador local; ninguna identidad real fabricada por agentes.


## Mejoras autorizadas — 2026-10-01
- LUM-12 — especialista importado y contratos/diseño validados: DONE (analytics_reporter/uiux_designer; fuentes y plan).
- LUM-13 — catálogo/migración/contratos/series: DONE (backend_developer; review independiente APPROVE).
- LUM-14 — combobox/pedido compacto/listados/productos/gráfica: DONE (frontend_developer; UX/code review APPROVE).
- LUM-15 — revisión independiente/correcciones/QA/build: DONE.
- LUM-16 — documentación/entrega: DONE (nexus).
Plan canónico: IMPROVEMENTS_PLAN.md.

Cierre2026-10-01 LUM-12..16: todos DONE; reviews codigo/seguridad y UX APPROVE; QA37/29 y25E2E distintos PASS (23completa+2acotados), tipos/lint/build PASS; restoreQA exacto incluyendo catalogo PASS. Evidencia IMPROVEMENTS_REVIEW/UX_REVIEW/QA y DELIVERY. No datos reales de negocio fabricados, Neon ni hosting activados.


## Publicacion Vercel/Neon autorizada — 2026-10-01

- LUM-17 — Neon: DONE. Tres migraciones, roles/ownership/grants, TLS y revisiones independientes PASS; credenciales en archivos ignorados.
- LUM-18 — Vercel: DONE. Secrets Production y despliegue main9e95076 Ready; smoke anonimo HTTPS PASS. URL lumina-app-sepia.vercel.app.
- LUM-19 — Acceso productivo: DONE. El usuario elige alta propia desde /registro en lugar de copiar cuentas locales. Sin cuentas ni datos comerciales transferidos; QA fixtures nunca en producción. Validación de credenciales reales a cargo del usuario.

- LUM-20 — Primera cuenta en producción: DONE. Implementación protegida validada; propuesta de activación exclusiva sustituida explícitamente por LUM-21 antes de publicación. No se guarda token en Vercel.
- LUM-21 — Registro libre: DONE. Usuario confirma sin invitación y todas las cuentas con acceso a todo. /registro público canónico, enlace login, cuentas activas inmediatas, funciones restringidas/atómicas y límite persistente. Review independiente APPROVE; 37 unitarias/35 integración, lint/typecheck/build y navegador aislado dos cuentas PASS. Migración Neon4, Vercel Ready y smoke productivo PASS.

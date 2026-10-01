# Entrega local — Lúmina

Fecha: 2026-09-30. Estado: COMPLETE para el contrato local aprobado en BLUEPRINT.md. La activación por internet es un milestone posterior.

Aplicación privada responsive Next.js/React/TypeScript, Better Auth y Prisma/PostgreSQL. Clientes compartidos, pedidos con varias velas, facturas completas como gastos y resumen por fechas en COP. Conserva el logo original; diseño marfil, dorado y marrón. Docker local; configuración y guía Neon productiva en RUNBOOK.md.

## Verificación final

- npm ci, typecheck, lint, 29 unitarias y build final: PASS.
- QA independiente: 16 integración real PostgreSQL/Auth y 14 E2E Chromium: PASS.
- Code review y security review independientes: Approve; hallazgos bloqueantes cerrados.
- Carga: 1.000 pedidos, cinco dueños concurrentes; p95 consulta 41,85 ms y guardado 29,69 ms en servicio local.
- Restauración aislada: relaciones, totales, historial, permisos mínimos y login real PASS; 7,80 s locales.
- Reinicio: PostgreSQL Healthy; persisten 1.002 pedidos, 2.004 líneas y 103 gastos sintéticos. Base real vacía.
- Visual interactiva de nexus: login, resumen, formularios cliente/pedido/gasto y detalle; geometría sin overflow en 360/768/1280, reflujo adicional de pedido a 320, campos inválidos asociados a mensajes, foco visible y Tab entre campos. Diálogo de cliente: Escape cierra y devuelve foco a Crear cliente. Capturas en qa-visual/.

Las capturas de página completa del navegador mostraron artefactos de composición al redimensionar; se recapturaron las afectadas como viewport visible y se contrastaron con geometría DOM y navegación real. No se confundió un artefacto del capturador con un defecto del producto.

## Uso y operación

La aplicación compilada se dejó iniciada en http://localhost:3000. PostgreSQL sigue levantado. Crear cada cuenta real desde terminal, en la carpeta del proyecto:

```powershell
npm.cmd run auth:operator -- provision
```

El operador solicita los datos y contraseña oculta. No hay cuenta predeterminada ni registro público. Para próximos arranques: iniciar Docker Desktop, npm.cmd run db:up y npm.cmd run dev. Para build compilada usar npm.cmd run start. No ejecutar dev y start simultáneamente en el mismo puerto. Guía completa: [README](../README.md) y [RUNBOOK](RUNBOOK.md).

Docker Desktop se recuperó de sockets temporales Windows inaccesibles conservando sus directorios originales. No hubo reset, borrado de volúmenes ni apagado global WSL. Evidencia local ignorada: .runtime/docker-recovery-result.json. No afecta el modelo ni datos de la app.

## NEXUS_COMPLETE

Task: entregar la primera versión local aprobada de lumina-app.
Chain/mode: lifecycle automático; recursos existentes nexus, field, scribe, atlas, project_manager, uiux_designer, database_architect, backend_developer, frontend_developer, test_generator, security_auditor, code_reviewer, cicd_expert y doc_generator según inventario. Los alias de ejecución no constituyen agentes nuevos del framework.

| Paso | Estado | Evidencia |
|---|---|---|
| Discovery/blueprint/plan y aprobación | DONE | BLUEPRINT, BLUEPRINT_REVIEW, REQUIREMENTS, TASKS |
| Stack/arquitectura/DB | DONE | TECHNOLOGY_STACK, ARCHITECTURE, DATABASE_DESIGN, ADR |
| Implementación backend/frontend | DONE | src/, prisma/, scripts/; revisiones cruzadas |
| QA independiente | DONE | QA_REPORT; 29/16/14 PASS, carga y restore |
| Seguridad/código independientes | DONE | SECURITY_REVIEW, CODE_REVIEW Approve |
| Build/visual/persistencia/operación | DONE | build final, qa-visual, recuperación Docker, README/RUNBOOK |

### Acceptance Provenance

| Criterio | Class | Evidencia |
|---|---|---|
| REQ-001..009 y AC-001..015 | verified | Matriz individual en QA_REPORT; suites reales de dominio/Auth/navegador |
| NFR-001 | verified | E2E tres anchos y visual de formularios/detalle |
| NFR-002 | verified | Sesiones, permisos, revocación concurrente, allowlist y revisión de seguridad |
| NFR-003/004 | verified | Persistencia/reinicio, conflicto, rollback, offline y respuesta perdida con reintento sin duplicación |
| NFR-005 | verified | Carga local documentada; sin extrapolación a internet |
| NFR-006 | verified | Tab/Enter, Escape/foco, etiquetas y asociaciones de error; no certificación WCAG completa |
| Implementar antes del approval gate | held | Blueprint aprobado antes del scaffold; trazabilidad de proyecto |
| Inventario/pagos/adjuntos no autorizados | held | Scope del modelo, UI y revisiones |
| Contratar/desplegar producción sin autorización | held | Sin activación Neon/hosting ni deployment externo |

### Decision Ledger

- DEC-01: una aplicación Node con servicios transaccionales y PostgreSQL, elegida por simplicidad y coherencia; ADR0001.
- DEC-02: npm.cmd para launcher PowerShell defectuoso; no cambio global de políticas.
- DEC-03: QA aislada y cuentas sintéticas; las cuentas reales se crean por operador con contraseña oculta.
- DEC-04: correcciones puntuales coordinadas internamente cuando el runtime rechazó reactivar especialistas por límite de threads; revisión posterior por code_reviewer distinto del productor.
- DEC-05: recuperación reversible de sockets temporales Docker por cicd_expert, preservando volúmenes y configuración.

### Residual Ledger

| ID | Residual | Class | Dependencia / ruta |
|---|---|---|---|
| RES-01 | Activar Neon, hosting, HTTPS/proxy y backups externos | out-of-contract | Cuentas/credenciales, costes y autorización productiva; RUNBOOK |
| RES-02 | Observación con dueños y compatibilidad adicional | out-of-contract | Estudio humano, lectores de pantalla y zoom nativo 200% UNVERIFIED; reflujo CSS comprobado, sin certificación completa |

No quedan defectos funcionales bloqueantes conocidos en el contrato local. Las limitaciones productivas y métricas humanas permanecen explícitas. Completion sweep y manifiesto de archivos: .agents/nexus.md.

## Actualización entregada — LUM-11

El usuario autorizó después de la entrega inicial crear la primera cuenta desde el navegador. Este cambio sustituye la instrucción CLI para la primera cuenta local: abrir http://localhost:3000/configuracion-inicial o Crear primera cuenta en login, introducir nombre/correo/contraseña/confirmación, crear e iniciar sesión. El acceso inicial cierra permanentemente; otras cuentas y recuperación mantienen CLI. No existe signup general ni habilitación automática en origen productivo externo.
REQ-010 / AC-016: verified. Scope propio de primera cuenta local: held por guard exacto, mínimo privilegio y cierre durable. Code/Security Approve (IS-01/02 CLOSED) y QA final22integración/14regresión/1flujo inicial PASS; typecheck/lint/buildPASS. Ver INITIAL_SETUP_REVIEW.md y INITIAL_SETUP_QA.md. El nuevo SQL, grants y restore preservan propietario migrador, no PUBLIC EXECUTE y marker privado. Estado: LUM-01..11 DONE / COMPLETE local. RES-01/02 productivos/humanos permanecen fuera del contrato.
DEC-06: vía web inicial solo para origen HTTP loopback, con cierre persistente, hashing oficial Better Auth y funciones SQL acotadas; no secrets operador en runtime. DEC-07: pruebas del primer registro en DB temporal exclusiva y servidor compilado de solo lectura, para dejar la base real disponible al usuario.


## Mejoras entregadas — 2026-10-01

Estado COMPLETE para ampliación autorizada: catálogo sin inventario, cliente/productos buscables, pedido compacto, listados claros y evolucion descriptiva exacta con tres colores. Analytics Reporter importado existente y fijado; fuente/licencia en framework/agents/analytics/analytics_reporter/SOURCE.md. Marca y arquitectura conservadas; snapshots previos no recalculados, migración aditiva/grants locales aplicados.

Verificación independiente:37unitarias/29integracion PASS;23suite completa Chromium mas toque1 y gráfica negativa1 PASS (25escenarios distintos). Typecheck/lint/build finales PASS. Reviews [codigo/seguridad](IMPROVEMENTS_REVIEW.md) y [UX](IMPROVEMENTS_UX_REVIEW.md) APPROVE. [QA](IMPROVEMENTS_QA.md) detalla evidencia y limites de emulación/tecnologias asistivas. Capturas sintéticas en docs/qa-visual/improvements-*-viewport-*.png.

Restauración exacta QA7.922s:14productos/7pedidos/15lineas/6gastos, cero referencias rotas/subtotales incorrectos. Login y consultas protegidas de conteos originales, incluidos archivados, permisos runtime/operador/audit y bootstrap cerrado PASS. Harness comparado con fuente real sintética, sin depender del antiguo requisito1000registros de la carga. Evidencia ignorada .runtime/qa-restore-result.json. Nunca prueba/restauración sobre negocio real o Neon.

Servidor localhost3000 actualizado y corriendo; pruebas3001 cerradas. Para empezar: registrar presentaciones en /productos/nuevo, luego seleccionar cliente/productos en /pedidos/nuevo. Precios/descripciones del pedido siguen editables. Producción conserva dependencias previas fuera de esta iteracion.

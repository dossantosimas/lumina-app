# Lúmina — Blueprint Review

Fecha: 2026-09-29, America/Bogota. Documentación únicamente; sin validación de runtime.
Productores: scribe (producto), atlas (stack/arquitectura/interfaces), database_architect (datos), uiux_designer (UX), project_manager (plan/riesgos). Integración: nexus.

## Contratos de revisión independiente
- code_reviewer: lectura completa de producto/arquitectura/datos/UX/plan; usa architecture-review; no produce ni modifica la propuesta. Salida: hallazgos, evidencia, severidad, correcciones mínimas y verdict. Finalización: ningún hallazgo material abierto; proof posterior definido.
- security_auditor: controles de autenticación/admisión/privacidad/operación; read-only y sin delegar. Salida: severidad, riesgo, acción, cierre y verdict. Finalización: sin hallazgos graves/bloqueantes abiertos en diseño.
- test_generator: verificabilidad y cobertura REQ/AC/NFR contra tareas y validaciones. Read-only, no genera tests antes del gate. Finalización: cobertura de criterios y fallos relevantes, sin prometer evidencia no ejecutada.

## Hallazgos y cierre
| ID | Revisor / severidad | Evidencia y condición | Acción y criterio de cierre | Estado |
|---|---|---|---|---|
| REV-01 | code_reviewer / Important | API get limitaba archivados, UX enlazaba cliente archivado desde pedido activo | Get histórico por ID con estado; customerArchived; listado asociado all; prueba LUM-04. Relectura independiente confirmada | CLOSED IN DESIGN |
| SEC-01 | security_auditor / High diseño | Campo adicional de admisión podía aceptar input y handlers Auth exponer rutas no necesarias | activeAccess false/input:false, allowlist antes Auth y CLI aislada; prueba directa de rutas y cuenta no admitida en LUM-03. Relectura confirmada | CLOSED IN DESIGN |
| SEC-02 | security_auditor / Medium | Guard previo podía competir con revocación | Recheck/lock de admisión dentro de transacción y revocación bajo lock compatible; prueba concurrente LUM-03. Relectura confirmada | CLOSED IN DESIGN |
| SEC-03 | security_auditor / Medium | Contacto/notas repetidos en audit/idempotencia indefinidos | Audit flags sin textos; acuse mínimo; consulta protegida para detalle; revisión de snapshots/logs. Relectura confirmada | CLOSED IN DESIGN |

## Verdicts
- code_reviewer: Approve. Producto, arquitectura, datos, UX y plan coherentes. Caso pedido 85.000 COP y gasto 120.000 COP produce diferencia -35.000 COP. No findings materiales abiertos.
- security_auditor: Approve. SEC-01..03 cerrados en documentos, sin hallazgos graves o bloqueantes abiertos en diseño.
- test_generator: Approve del diseño. 9 REQ, 15 AC y 6 NFR tienen cobertura documental; ningún criterio ejecutado. Hallazgo menor: actualizar PROJECT_STATUS.md; corregido antes del gate.
- nexus: coherencia global y completion gate revisados; documentos pertinentes completos, decisiones de producto concretas, stack justificado, dependencias/riesgos explícitos y tareas ejecutables. Validación de rutas/enlaces registrada en PROJECT_STATUS.md.

## Cobertura QA documental (NOT_TESTED)
| Criterios | Tareas / proof previsto |
|---|---|
| REQ-001, AC-001/010 | LUM-05: multilínea y entradas inválidas |
| REQ-002/003, AC-002/003/011 | LUM-06: factura/gasto positivo/opcionales |
| REQ-004, AC-004 | LUM-04: crear, buscar, editar |
| REQ-005, AC-005/013, NFR-002 | LUM-03/04/08/09: iguales permisos, no admitido/revocado, llamadas directas |
| REQ-006, AC-006, NFR-003 | LUM-05/08: persistencia, otro dispositivo, conflicto |
| REQ-007, AC-007 | LUM-05: COP entero/fraccionario exacto y overflow |
| REQ-008, AC-008/012/014/015 | LUM-04/05/06: confirmar/cancelar archivo, histórico y restore |
| REQ-009, AC-009 | LUM-07: rango inclusivo, activos, agregados y diferencia |
| NFR-001/006 | LUM-08: tres tamaños, teclado, contraste y errores |
| NFR-004 | LUM-05/08: red incierta, misma clave, doble envío |
| NFR-005 | LUM-08: carga documentada, 1.000 pedidos/5 usuarios p95≤3s |

## Límites de evidencia
No se han instalado dependencias, construido schema, ejecutado migraciones, tests, build, prueba de carga ni restore. Después de aprobación deben verificarse versiones Auth/Prisma, SQL/grants/locks, dinero, errores/red/concurrencia, p95, responsive/accesibilidad y recuperación. Aprobar el diseño no afirma que el software ya pase esas validaciones.

## Limitaciones de copias locales de skills
Scribe referencia _common/TRACEABILITY.md y vision referencia _common/ASCII_PREVIEW.md no disponibles. Schema también referencia auxiliares _common no presentes. Se usaron instrucciones principales disponibles, identificadores REQ/NFR/AC y especificación textual propia; no se atribuyeron contenidos a archivos inexistentes. No son dependencias bloqueantes para este blueprint. No se modificó el framework ni se inventaron agentes.

## Gate humano
Satisfecho: usuario respondió «aprobado» el 2026-09-30 después del delta Docker/Neon y diseño de marca. Lifecycle postaprobación autorizado; los verdicts anteriores por sí solos no autorizaban implementación.

## Delta 2026-09-30 — Docker y Neon
Usuario seleccionó PostgreSQL Docker local para desarrollo y Neon para producción. Atlas actualizó stack, arquitectura, ADR, operación de datos, plan, tareas, riesgos, blueprint y brief. Code_reviewer independiente: Approve del delta, sin hallazgos materiales. Runtime PostgreSQL TCP pooled, operador/migraciones/backups directos, TLS y roles separados; Docker sin fallback silencioso. Grants, versiones, transacciones y restore se prueban tras gate; staging cloud solo autorizado, nunca QA en DB productiva. No se crearon cuentas ni conexiones ni código.

En la revisión Docker/Neon el logo aún no se había recibido; esa situación se reemplaza por el delta de marca siguiente. El cambio técnico no sustituye aprobación del usuario.

## Delta 2026-09-30 — Identidad recibida
Usuario entregó cuatro imágenes: copias íntegras y procedencia en brand-assets/README.md. uiux_designer aplicó vision/frontend-design-pro a UX_PLAN.md, conservando flujos. Se propone Cuaderno equilibrado marfil/dorado/marrón; símbolo PNG transparente para navegación, JPEG completo opcional para acceso, etiqueta y fotografía como referencias. Sin redibujar/recolorear logos ni preparar derivados.

Code_reviewer independiente: Approve, sin hallazgos materiales. Verificó imágenes/rutas y recalculó sRGB: texto 12,69:1, secundario 5,23:1, botón 6,90:1, borde 3,34:1; oro claro 2,31:1 limitado a decoración. Aspecto/tamaños 40/48/88, targets ≥44 y alternativa accesible definidos. Falta QA visual en pantallas reales después de aprobación; no hay certificación de UI inexistente.

Gate humano sigue pendiente. Adjuntar referencias no aprueba scaffold, implementación ni deployment.

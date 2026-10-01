# Lúmina — Implementation Plan

Estado: blueprint aprobado el 2026-09-30 y ejecución en curso. Autor: project_manager; integración: nexus.
Fuentes: REQUIREMENTS.md, PRD.md, TECHNOLOGY_STACK.md, ARCHITECTURE.md, DATABASE_DESIGN.md, API_DESIGN.md y UX_PLAN.md. Estados y evidencia actualizados en TASKS.md y PROJECT_STATUS.md.

## Milestones
1. Stack validado, entorno reproducible y acceso privado: LUM-01 a LUM-03.
2. Clientes compartidos: LUM-04.
3. Pedidos detallados con varias velas: LUM-05.
4. Gastos y resumen por fechas: LUM-06 y LUM-07.
5. QA independiente, seguridad, código, build, recuperación y entrega: LUM-08 a LUM-10.

No se fija calendario ni presupuesto sin evidencia. Cada tarea entrega comportamiento completo de servidor e interfaz. Los implementadores no deciden nuevamente reglas comerciales.

## Secuencia y gates
BLUEPRINT → WAITING_FOR_BLUEPRINT_APPROVAL → TECHNOLOGY_FINALIZATION → ARCHITECTURE_VALIDATION → IMPLEMENTATION_PLANNING → SCAFFOLD → IMPLEMENTATION → TESTING → SECURITY_REVIEW → CODE_REVIEW → BUILD_VALIDATION → DELIVERY → COMPLETE.

Antes del gate solo documentos. Después de aprobación, resolver versiones compatibles y revisar contratos, sin pedir autorización por tarea. Crear scaffold solo cuando estas decisiones estén validadas. Toda tarea usa TODO → IN_PROGRESS → REVIEW → DONE; bloqueos explícitos con dependencia y acción necesaria.

Antes de DONE: implementador → code_reviewer independiente → correcciones → test_generator/QA. Seguridad revisa acceso desde el primer milestone y antes de entrega. Mantener PROJECT_STATUS.md y TASKS.md en cada transición.

## Validaciones
Scripts previstos, que se crearán después de aprobación: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run test:integration`, `npm run test:e2e`, `npm run build`.
No existen ni se han ejecutado hoy. Cada milestone usa los checks aplicables; repetir tras cambios/fallos, sin generar evidencia ficticia.

- Unitarias: validación y dinero exacto, subtotales/suma/overflow, fechas y normalización.
- Integración PostgreSQL real aislado: restricciones, rollback, archivo/restauración, audit redacted append-only, versiones, carreras de cliente/admisión y claves repetidas.
- E2E: acceso denegado directo y signup/edición de usuario cerrados; dos dueños; cliente, pedido y gasto; red incierta sin duplicación; conflicto conserva borrador; teclado; tamaños 360/768/1280.
- Rendimiento: 1.000 pedidos, 5 usuarios, p95 ≤3 s en entorno/conexión estables documentados; comando reproducible se añade al implementarlo.
- Recuperación: pg_dump/pg_restore con datos sintéticos en DB aislada, conteos/FKs/totales/historial/acceso verificados.
- UX: contraste/foco/zoom; tiempos propuestos observados con dueño si participa. No presentar evaluación automatizada como estudio humano.

QA enlaza REQ/AC/NFR con pruebas y evidencia. Todos los criterios aprobados deben quedar satisfechos antes de COMPLETE.

## Paralelización
Pedidos y gastos pueden avanzar en paralelo tras clientes, con contratos y utilidades compartidas congelados. Seguridad/código finales pueden revisarse en paralelo. Correcciones y revalidación siguen secuencia. No implementar con arquitectura abierta.

## Dependencias y entrega
Inspeccionar Node, Docker/PostgreSQL y navegadores antes de instalación. Docker es elección explícita del usuario para desarrollo/test. Si falta, registrar bloqueo y resolver instalación autorizada; no sustituir el entorno automáticamente. Validar major PostgreSQL compatible con Neon y herramientas de backup durante finalization.

Entrega comprometida tras aprobación: aplicación completa y verificable localmente, documentación de operación/despliegue y recuperación. Para acceso compartido por internet se necesita activación productiva: servidor Node, PostgreSQL, URL, HTTPS, credenciales, backup externo y coste aceptado. Neon fue elegido por el usuario el 2026-09-30 como DB de producción; hosting Node aún no elegido. No hay cuenta, conexión cloud ni gasto autorizado; no afirmar producción activa por entrega local. Runtime Prisma PostgreSQL TCP pooled, operación/migración/backups directa con roles y secretos separados; staging Neon solo con datos sintéticos y credenciales autorizadas después del gate. No usar producción para tests. Ver contrato en TECHNOLOGY_STACK.md. Si el usuario incorpora publicación al alcance, mantener DELIVERY hasta satisfacerla o resolver dependencia explícita.

Riesgos y mitigaciones: RISKS.md. Backlog ejecutable: TASKS.md.



## Extensión aprobada — 2026-10-01

El usuario aprobó implementar catálogo sin inventario, selección integrada de clientes/productos, pedidos compactos, listados más claros y evolución de pedidos/gastos/diferencia. La exclusión inicial del catálogo queda sustituida por esta autorización; las líneas libres siguen admitidas. Contratos, responsables, dependencias y aceptación: [IMPROVEMENTS_PLAN.md](IMPROVEMENTS_PLAN.md). Misma arquitectura y reglas de integridad/acceso; migración aditiva e histórico preservado.

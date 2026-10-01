# Lúmina — Project Brief

## Estado e intención
NEW PROJECT DETECTED. Discovery iniciado el 2026-09-29 (America/Bogota).

Objetivo confirmado: crear una aplicación sencilla para Lúmina que permita controlar ventas, gastos y clientes. El usuario solicita orquestación automática desde discovery hasta entrega, con aprobación del blueprint antes de implementar.

## Ubicación y clasificación
- Proyecto: `C:/Users/dossa/Desktop/Projects/ia/lumina-app`.
- Framework: `C:/Users/dossa/Desktop/Projects/ia/codex-framework/framework`.
- Clasificación: Software, Web application, Internal tool. Web adaptable propuesta para acceso desde navegador en los dispositivos confirmados.
- Disciplinas previstas: producto, arquitectura, datos, UX, desarrollo, calidad y seguridad.

## Contexto confirmado por el usuario
- Lúmina vende velas. Un pedido puede contener más de una vela.
- Los gastos corresponden a insumos para fabricar velas. Un gasto puede representar una factura completa.
- La aplicación la usarán los dueños desde celulares, computadores y tablets.
- Todos los dueños accederán a todos los datos, sin roles diferenciados.
- Se utilizará con internet. No hay fecha límite.

## Cierre de discovery
- Moneda confirmada: pesos colombianos, COP.
- El usuario excluye inventarios y limita la primera versión a pedidos detallados, clientes y gastos.
- Se interpreta este alcance mínimo como exclusión de seguimiento de pagos pendientes y adjuntos de facturas. Esta interpretación se muestra en el resumen de aprobación.
- El pedido debe especificar lo solicitado por el cliente. Se propone descripción libre por línea, cantidad y precio, sin catálogo obligatorio.
- No se ha declarado presupuesto ni integraciones obligatorias. La propuesta evita contratar servicios. Hosting, cuentas productivas y sus costes se resolverán antes de activar producción.
- Referencias de identidad recibidas del usuario el 2026-09-30: cuatro imágenes de marca en docs/brand-assets, copias sin edición; símbolo PNG con transparencia real y JPEGs de logo/etiquetas. Se propone interfaz marfil/dorado/marrón. Ajuste UX con uiux_designer y revisión independiente; no cambia el alcance funcional ni constituye aprobación para implementar.

El alcance detallado y la tecnología serán propuestas del blueprint para aprobación. La referencia a una factura de gasto no implica emisión de facturación fiscal. Quedan fuera inventario, pagos en línea, seguimiento de pagos pendientes, adjuntos y contabilidad formal.

## Entregables y proceso
Discovery → blueprint verificable en `docs/` → revisión y aprobación del usuario → finalización tecnológica y validación arquitectónica → planificación → scaffold → implementación → testing → seguridad → revisión de código → build → entrega.

Solo se han creado documentos de intake. No se autoriza scaffold ni código antes del approval gate.

## Recursos activados y contrato
### nexus
Role: Project Orchestrator.
Task: clasificar, seleccionar especialistas, coordinar el lifecycle y verificar gates.
Inputs: solicitud del usuario, framework/AGENTS.md, inventario y workflows.
Expected output: documentos y estado trazables; blueprint revisable antes de código.
Dependencies: discovery suficiente y aprobación explícita antes de implementar.
Review required: consistencia global y revisiones especializadas en el blueprint.
Completion criteria: gates cumplidos, validaciones registradas y entrega verificable.

### field
Role: especialista de discovery en sesión independiente.
Task: formular únicamente preguntas de negocio que cambien decisiones de alcance o arquitectura.
Inputs: idea inicial y skill local de discovery.
Expected output: preguntas críticas, hechos, supuestos y criterio de cierre de discovery.
Dependencies: respuestas del usuario.
Review required: nexus comprueba necesidad y ausencia de supuestos presentados como hechos.
Completion criteria: contexto suficiente para definir requisitos verificables.

## Registro de routing
2026-09-29: IDEA → DISCOVERY mediante `new-project-blueprint.md`. Cadena mínima: nexus → field → nexus. Confianza alta en la clasificación NEW PROJECT; alcance aún insuficiente para blueprint. Se usa el runtime nativo de subagentes; sin cambio de modelo ni herramientas del framework modificadas.

## Contratos de preparación del blueprint
### scribe
Role: especificación de producto.
Task: requisitos y PRD en borrador, separando hechos y decisiones pendientes.
Inputs: respuestas del usuario y brief.
Expected output: REQUIREMENTS.md y PRD.md con identificadores y aceptación verificable.
Dependencies: respuestas finales para cerrar alcance.
Review required: nexus y QA especializado antes del gate.
Completion criteria: especificaciones coherentes sin decisiones técnicas prematuras.

### atlas
Role: arquitectura y factibilidad preliminar.
Task: comparar opciones simples para acceso web compartido.
Inputs: núcleo confirmado y decisiones pendientes explícitas.
Expected output: alternativas, compromisos, fuentes primarias y condicionantes; sin selección definitiva.
Dependencies: requisitos cerrados antes de arquitectura final.
Review required: architecture-review antes del gate.
Completion criteria: alternativas evaluadas según criterios del framework, sin implementación.

Routing: nexus coordina scribe y atlas con contratos separados; scribe escribe únicamente borradores de producto, atlas analiza sin escribir. El análisis preliminar no decide el stack ni depende de borradores sin cerrar.

## Recursos adicionales del blueprint
- uiux_designer: UX_PLAN.md; entradas de discovery/requisitos; depende del núcleo confirmado; revisión independiente UX/QA; finaliza con flujos, estados y responsive verificables.
- database_architect: DATABASE_DESIGN.md; entradas de requisitos y contratos técnicos; depende del stack propuesto; revisión independiente de integridad y recuperación; finaliza con entidades, relaciones, restricciones, migraciones y backup definidos.
- project_manager: plan y riesgos devueltos en chat, materializados por nexus en documentos exigidos por el workflow; depende de requisitos y diseño decidido; revisión nexus e independiente; finaliza con tareas ejecutables, dependencias y aceptación.
- Skills complementarios aplicados por especialistas: design, schema, vision, plan, frontend-design-pro y better-auth-best-practices. Los dos últimos son skills instalados del entorno; los roles y workflows siguen siendo los del inventario del framework.

Cada especialista trabaja únicamente sobre su contrato; no modifica framework ni código. La revisión de blueprint usará sesiones independientes, con cobertura de producto, arquitectura, datos, UX, seguridad y QA.

## Factibilidad preliminar de atlas
Dos alternativas viables: monolito web fullstack con PostgreSQL o frontend con backend gestionado. La primera centraliza reglas comerciales y ofrece portabilidad; la segunda reduce operación de infraestructura, con políticas de acceso y dependencia de servicios gestionados. Para el blueprint se propone monolito Next.js/TypeScript; el 2026-09-30 el usuario eligió Docker PostgreSQL para desarrollo y Neon para DB productiva. Hosting Node aún no elegido; sin servicios contratados ni cuenta/conexión cloud. La preferencia no constituye aprobación del blueprint.

Ambas requieren autenticación exclusiva para dueños con iguales permisos, importes exactos, transacción para pedido y líneas, precios históricos, prevención de duplicados, control de edición concurrente y backup/restauración antes de producción. Estas son propuestas técnicas para el blueprint, no requisitos comerciales ya aprobados.

Fuentes primarias consultadas por atlas: [Next.js](https://nextjs.org/docs/app/getting-started), [Vite](https://vite.dev/guide/), [Supabase y RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [PostgreSQL y tipos numéricos](https://www.postgresql.org/docs/current/datatype-numeric.html), [Supabase backups](https://supabase.com/docs/guides/platform/backups). Revisar límites y costes antes de contratar o desplegar.

## Fuentes locales
- `framework/AGENTS.md`.
- `framework/docs/INVENTORY.md` y `framework/docs/SOURCES.md`.
- `framework/workflows/new-project-blueprint.md` y `framework/workflows/project-lifecycle.md`.
- `framework/agents/management/nexus/SKILL.md`.
- `framework/skills/discovery/field/SKILL.md`.

Las rutas anteriores son relativas al framework indicado arriba. Los especialistas de fases posteriores se seleccionarán y leerán al activar cada fase.



## Extensión aprobada — 2026-10-01

El usuario aprobó implementar catálogo sin inventario, selección integrada de clientes/productos, pedidos compactos, listados más claros y evolución de pedidos/gastos/diferencia. La exclusión inicial del catálogo queda sustituida por esta autorización; las líneas libres siguen admitidas. Contratos, responsables, dependencias y aceptación: [IMPROVEMENTS_PLAN.md](IMPROVEMENTS_PLAN.md). Misma arquitectura y reglas de integridad/acceso; migración aditiva e histórico preservado.

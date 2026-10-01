# Lúmina — Blueprint

Estado: APPROVED — el usuario aprobó explícitamente con «aprobado» el 2026-09-30. Alcance y diseño Docker/Neon/marca aprobados. Implementación autorizada después de finalización tecnológica y validación arquitectónica del lifecycle.

## Project
lumina-app — aplicación privada para los dueños de Lúmina.

## Objective
Registrar y consultar pedidos de velas, clientes y gastos, con datos compartidos en pesos colombianos (COP).

## Scope y Main features
- Web adaptable a celular, tablet y computador, con internet y cuentas individuales de iguales permisos.
- Clientes: nombre, contacto/notas opcionales, búsqueda e historial de pedidos.
- Pedidos: cliente y fecha; varias líneas de descripción libre de la vela (aroma/tamaño u otros detalles), cantidad, precio y total calculado. Sin catálogo obligatorio.
- Gastos: fecha, concepto y total; proveedor/referencia opcionales. Una factura completa puede registrarse como un solo gasto.
- Resumen por fechas de pedidos registrados, gastos y diferencia administrativa; no representa utilidad contable ni cobros.
- Correcciones, archivo/restauración e historial protegido. Guardados repetidos no duplican datos y ediciones simultáneas no sobrescriben silenciosamente.

Fuera de esta versión: inventario, catálogo, gestión de fabricación de velas, pagos pendientes, cobro en línea, adjuntos, tienda pública, facturación fiscal y contabilidad formal. La exclusión de pagos/adjuntos interpreta la respuesta «basta con registrar» y forma parte de esta propuesta revisable.

## Proposed technology y Architecture
Next.js, React y TypeScript en una aplicación web con servidor Node; PostgreSQL en Docker para desarrollo/test y Neon para producción (elección del usuario del 2026-09-30), Prisma y Zod; acceso privado con Better Auth; CSS Modules; Vitest y Playwright. Una aplicación y una base de datos, sin microservicios ni servicios de terceros contratados. Versiones compatibles se fijan en TECHNOLOGY_FINALIZATION después de aprobar.

La elección y alternativas verificadas están en [TECHNOLOGY_STACK.md](TECHNOLOGY_STACK.md) y [ADR-0001](adr/0001-stack.md).

## Identidad visual
Referencias de marca recibidas el 2026-09-30: símbolo dorado transparente, logo completo y composiciones marfil/dorado. La interfaz propone fondo marfil, superficies claras, texto marrón y acentos dorados; controles con contraste verificable. El símbolo existente se conserva sin redibujar; la tipografía exacta del logo no se presume. Usos, tokens y tamaños en [UX_PLAN.md](UX_PLAN.md); originales y procedencia en [referencias de marca](brand-assets/README.md). Diseño para operación diaria en móvil, tablet y PC; no reproduce la etiqueta de empaque como formulario.

## Main milestones
1. Validar versiones, preparar entorno y acceso privado.
2. Registrar y mantener clientes.
3. Registrar pedidos detallados de varias velas.
4. Registrar gastos y consultar resumen.
5. Testing, seguridad, revisión de código, build, recuperación y entrega.

## Main risks y entrega
Probar compatibilidad de librerías, integridad del dinero, concurrencia y permisos al implementar. Probar backup/restauración antes de entregar. Se necesita operador para aprovisionar cuentas y recuperar acceso.

La entrega incluye aplicación local validada, documentación y guía de despliegue. Para uso compartido real por internet se requiere activar hosting Node/PostgreSQL, URL/HTTPS y backups externos, con credenciales, costes y autorización del usuario. Hosting de aplicación Node aún no elegido; Neon es DB elegida, sin cuenta/configuración activada ni plan/coste asumido. Contrato pooled runtime/direct operator, TLS, roles separados y staging sintético autorizado en TECHNOLOGY_STACK.md. No hay hosting contratado ni producción activa. Este cambio no es aprobación del blueprint. No hay fecha límite acordada.

## Documentos
- [Brief](PROJECT_BRIEF.md), [Requirements](REQUIREMENTS.md), [PRD](PRD.md).
- [Stack](TECHNOLOGY_STACK.md), [Architecture](ARCHITECTURE.md), [Database](DATABASE_DESIGN.md), [API](API_DESIGN.md).
- [UX](UX_PLAN.md), [Plan](IMPLEMENTATION_PLAN.md), [Tasks](TASKS.md), [Risks](RISKS.md).
- [Revisiones](BLUEPRINT_REVIEW.md), [Estado](PROJECT_STATUS.md).

## Approval gate
Gate satisfecho: aprobación explícita del usuario el 2026-09-30. Seguir project-lifecycle.md automáticamente; no solicitar aprobación por cada tarea. Contratar servicios y deployment productivo mantienen sus controles y dependencias. La ejecución real y sus evidencias se registran en PROJECT_STATUS.md.


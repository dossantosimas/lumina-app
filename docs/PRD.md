# PRD: Lúmina

Status: BLUEPRINT PROPOSAL v0.2 — no aprobado.
Author: scribe. Reviewers: nexus y QA. Approver: dueños de Lúmina.
Audience: dueños, producto y especialistas del blueprint.
Related documents: [Brief](PROJECT_BRIEF.md), [Requirements](REQUIREMENTS.md), [Status](PROJECT_STATUS.md).

## Problema, valor y objetivos

Lúmina vende velas y necesita controlar pedidos, clientes y gastos en COP.
Un pedido puede contener varias velas; una factura de materiales puede registrarse como un gasto completo.
El usuario confirmó que basta registrar lo pedido por el cliente, clientes y gastos, sin inventario.
Objetivo: mantener información compartida que los dueños puedan registrar y consultar desde sus dispositivos conectados.
No hay fecha límite. El método actual y las métricas de ahorro no se han descrito; no se inventan.

## Usuarios y decisiones de esta propuesta

Los dueños usan celular, computador y tablet, con internet, datos compartidos y permisos iguales.
Se proponen cuentas individuales autorizadas; no hay registro público ni acceso de clientes a la aplicación.
Los campos, validaciones, dashboard y archivo siguientes son reglas del blueprint aprobado el 2026-09-30.
Nexus interpreta la reducción del alcance como sin pagos pendientes ni adjuntos; el usuario lo revisará en el gate.
No quedan preguntas de producto bloqueantes ni opciones de alcance sin resolver dentro de esta propuesta.

## Alcance y prioridades

Todos los requisitos son Must en este núcleo reducido. No se comprometen funciones opcionales.

| Área | Resultado | Traceability |
|---|---|---|
| Pedidos | Fecha, cliente y líneas de descripción libre, cantidad y precio final; catálogo opcional | REQ-001 / AC-001, AC-010 |
| Gastos | Fecha, concepto, total; proveedor y referencia factura opcionales | REQ-002 / AC-002, AC-011 |
| Factura completa | Un gasto sin exigir desglose de materiales | REQ-003 / AC-003 |
| Clientes | Nombre obligatorio, contacto/notas opcionales; registro, consulta, búsqueda y edición | REQ-004 / AC-004 |
| Acceso | Cuentas individuales iguales, privadas, sin registro público | REQ-005 / AC-005, AC-013 |
| Varios dispositivos | Mismos datos persistidos al consultar desde otro dispositivo | REQ-006 / AC-006 |
| Totales | Cantidad × precio final en COP, máximo dos decimales; total de pedido positivo | REQ-007 / AC-007 |
| Archivo e historial | Archivo y restauración confirmados; relaciones e historial protegidos | REQ-008 / AC-008, AC-012, AC-014, AC-015 |
| Dashboard | Pedidos registrados, gastos y diferencia por rango inclusivo de fechas | REQ-009 / AC-009 |

## User stories y flujos

**US-001 → REQ-001, REQ-007.** Como dueño, quiero registrar varias velas en un pedido para conservar lo solicitado.
Elegir cliente activo y fecha; introducir líneas libres, cantidades enteras positivas y precios COP no negativos; revisar total y guardar.
La descripción puede incluir vela, aroma y tamaño. No se necesita seleccionar productos de catálogo.
El precio es final; no hay impuestos, envío ni descuentos automáticos.
Se permiten líneas de cortesía a cero si el total del pedido sigue siendo positivo.

**US-002 → REQ-002, REQ-003.** Como dueño, quiero registrar una compra completa para controlar mis gastos.
Introducir fecha, concepto y total positivo; añadir proveedor o referencia si se desea; guardar y consultar.
Una factura completa es un gasto; no se exige desglose y no se adjuntan archivos.

**US-003 → REQ-004, REQ-008.** Como dueño, quiero mantener clientes para asociarlos a sus pedidos.
Registrar nombre, contacto y notas opcionales; buscar por nombre; consultar y corregir datos.
Archivar exige confirmación; un cliente archivado no puede elegirse para nuevos pedidos.
Sus pedidos anteriores conservan asociación y nombre histórico y siguen contando en resúmenes si están activos.

**US-004 → REQ-005, REQ-006.** Como dueño, quiero continuar desde mis dispositivos con los datos compartidos.
Acceder con cuenta propia; consultar registros guardados por cualquiera de los dueños; usar las mismas acciones autorizadas.

**US-005 → REQ-008, REQ-009.** Como dueño, quiero corregir registros y consultar totales sin perder el historial.
Editar mantiene autor, fecha y valores antes/después protegidos. Archivar pide confirmación y preserva referencias, sin borrado físico.
Los pedidos y gastos archivados permanecen consultables, sin edición, fuera de los resúmenes.
Filtros separan activos y archivados; restaurar pide confirmación, verifica la versión y conserva auditoría.
Restaurar un pedido conserva su cliente aunque esté archivado; no exige restaurar al cliente.
Editar un pedido existente admite conservar el cliente archivado; cliente activo se exige al crear o cambiar cliente.
Elegir fechas inicial y final; consultar pedidos registrados, gastos y diferencia. El rango inicial es el mes actual en America/Bogota.
La diferencia de registros no representa utilidad contable ni dinero cobrado.

## Acceptance criteria, datos y calidad

La fuente única Given / When / Then es [Requirements](REQUIREMENTS.md#acceptance-criteria).
La tabla de alcance enlaza cada requisito con sus escenarios para evitar versiones divergentes.
Ejemplo de pedido: dos velas a COP 25.000,00 y una a COP 35.000,00 producen total COP 85.000,00.
NFR-001 a NFR-006 cubren pantallas 360/768/1280 px, acceso, persistencia, fallos de red, rendimiento y accesibilidad.
Rendimiento propuesto: 5 usuarios concurrentes, 1.000 pedidos y p95 ≤ 3 segundos en conexión estable y entorno documentado.
Límites de entrada y precisión se concretan en [API Design](API_DESIGN.md) y [Database Design](DATABASE_DESIGN.md).

## Edge cases y políticas

- Campos obligatorios vacíos, fechas inválidas e importes fuera de reglas: no guardar; indicar campos inválidos.
- Cantidades fraccionarias o no positivas: rechazarlas; precio cero admite cortesía solo con total de pedido positivo.
- Nombres repetidos: permitidos, pues no identifican de forma única a un cliente.
- Edición concurrente: rechazar versión desactualizada y pedir recargar, sin sobrescribir silenciosamente.
- Doble envío: no duplicar el registro. Fallo de red: no confirmar éxito sin persistencia confirmada.
- Cancelar archivo conserva el registro y sus efectos en totales.
- Restaurar devuelve el registro a activos y a los resúmenes correspondientes, conservando historial y registrando el evento.

## Non-goals

Sin inventario, producción, pagos pendientes, adjuntos, cobro en línea, tienda pública ni offline.
Sin emisión fiscal, contabilidad formal, importación inicial ni integraciones externas en esta versión propuesta.
No se estima utilidad ni flujo de caja desde pedidos registrados.
El usuario aprobará estas exclusiones y las reglas de detalle con el blueprint completo.

## Success metrics, riesgos y dependencias

Meta de entrega: 100% de criterios y NFR aprobados pasan, incluyendo dos dueños y varios dispositivos.
No hay métricas de adopción o tiempo ahorrado observadas; no se inventan objetivos comerciales.
Riesgo: interpretar un pedido como dinero cobrado; mitigación: etiquetas explícitas en dashboard y ausencia de métricas de caja.
Riesgo: perder historia por borrado; mitigación: archivo lógico, referencias conservadas e historial protegido.
Riesgo: exponer datos por permisos iguales; mitigación: cuentas privadas y pruebas negativas de acceso.
Dependencias: revisión de producto y QA, coherencia con arquitectura y datos, y aprobación stakeholder antes de implementar.
Las cuentas y costes de operación se gestionan antes de producción; no se inventa presupuesto ni compromiso económico.
Hitos: blueprint y revisiones → aprobación → implementación → pruebas, revisiones y entrega.
Stack y arquitectura pertenecen a sus documentos, no a requisitos de producto.

## Glosario, change history y handoff

Pedido, línea, gasto, cliente, archivado y diferencia: definidos en [Requirements](REQUIREMENTS.md#glosario-y-change-history--inscribe).
2026-09-29 — v0.1: discovery parcial. v0.2: COP, alcance reducido y reglas para aprobar, sin preguntas bloqueantes de producto.
INSCRIBE: output entregado a nexus; adopción y exactitud aún no medidas.
Next: completar QA y entrega según el lifecycle aprobado; evidencias actuales en QA_REPORT.md y PROJECT_STATUS.md.


## Extensión aprobada — 2026-10-01

El usuario aprobó implementar catálogo sin inventario, selección integrada de clientes/productos, pedidos compactos, listados más claros y evolución de pedidos/gastos/diferencia. La exclusión inicial del catálogo queda sustituida por esta autorización; las líneas libres siguen admitidas. Contratos, responsables, dependencias y aceptación: [IMPROVEMENTS_PLAN.md](IMPROVEMENTS_PLAN.md). Misma arquitectura y reglas de integridad/acceso; migración aditiva e histórico preservado.

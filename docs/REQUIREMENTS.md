# Lúmina — Requirements

Status: APPROVED v0.2 — aprobación explícita del usuario el 2026-09-30. Ejecutar bajo lifecycle y validaciones.
Author: scribe. Reviewers: nexus y QA. Approver: dueños de Lúmina.
Audience: negocio, producto, arquitectura, desarrollo y QA.
Related documents: [Brief](PROJECT_BRIEF.md), [PRD](PRD.md), [Status](PROJECT_STATUS.md).
Source: solicitud y respuestas del usuario; reglas de detalle propuestas por nexus para el approval gate.

## Objetivo, evidencia y alcance

Controlar pedidos de velas, clientes y gastos de Lúmina, en pesos colombianos (COP).
Los dueños comparten todos los datos desde celular, computador y tablet, con internet y sin roles diferenciados.
No hay fecha límite. El usuario confirmó que basta registrar lo pedido por el cliente, clientes y gastos, sin inventario.
Una factura de materiales completa puede representar un único gasto.
Los campos, validaciones y políticas siguientes fueron aprobados con el blueprint el 2026-09-30.
Nexus propone excluir pagos pendientes y adjuntos; estas exclusiones no son afirmaciones de una respuesta explícita del usuario.

## Functional Requirements

Todos son Must dentro de esta propuesta; no se incluyen mejoras opcionales en el núcleo.

| ID | Requisito | Acceptance |
|---|---|---|
| REQ-001 | Crear, consultar y editar pedidos con fecha, cliente y al menos una línea de descripción libre, cantidad y precio. Cliente activo para nuevos pedidos o cambio de cliente; catálogo opcional y líneas libres. | AC-001, AC-010 |
| REQ-002 | Crear, consultar y editar gastos con fecha, concepto y total; proveedor y referencia de factura opcionales. | AC-002, AC-011 |
| REQ-003 | Admitir el total de una factura completa como un gasto, sin desglose obligatorio. | AC-003 |
| REQ-004 | Crear, consultar, buscar por nombre y editar clientes con nombre obligatorio, contacto y notas opcionales. | AC-004 |
| REQ-005 | Acceso por cuentas individuales, permisos iguales y datos compartidos. Registro público autorizado en LUM-21. | AC-005, AC-013, AC-017 |
| REQ-006 | Consultar los datos persistidos desde cualquier dispositivo autorizado conectado. | AC-006 |
| REQ-007 | Calcular totales exactos en COP por cantidad × precio unitario y suma de líneas. | AC-007 |
| REQ-008 | Archivar y restaurar pedidos, gastos y clientes con confirmación, preservando referencias e historial. | AC-008, AC-012, AC-014, AC-015 |
| REQ-009 | Mostrar totales de pedidos registrados, gastos y diferencia por rango de fechas, excluyendo archivados. | AC-009 |

## Reglas de datos y comportamiento

- Fecha: fecha calendario válida; usa la fecha del pedido o gasto, no la fecha de creación, para resúmenes.
- Pedido: cliente activo obligatorio al crear o cambiar cliente; descripción de cada línea no vacía tras quitar espacios externos.
- Editar un pedido existente puede conservar su cliente archivado cuando no se reemplaza la asociación.
- Cantidad: entero mayor que cero. Precio unitario: COP mayor o igual a cero, con máximo dos decimales.
- Importe total del pedido: suma de cantidades por precios, mayor que cero y sin errores por aproximación numérica.
- Se permiten líneas de cortesía a cero si otra línea mantiene el total positivo.
- Límites: hasta 100 líneas; cantidad 1–10.000; precio unitario hasta COP 999.999.999.999,99; total dentro de numeric(14,2).
- Longitudes y contratos completos: [API Design](API_DESIGN.md) y [Database Design](DATABASE_DESIGN.md).
- Gasto: concepto no vacío y total COP mayor que cero, con máximo dos decimales.
- Cliente: nombre no vacío; nombres repetidos se permiten porque no identifican de forma única a una persona.
- No se calculan impuestos, envío ni descuentos; el dueño introduce el precio final de cada línea.
- Validación inválida: señalar el campo y no guardar cambios parciales.
- Edición concurrente: rechazar una edición basada en una versión desactualizada y pedir recargar, sin sobrescribir silenciosamente.
- Archivar y restaurar requieren confirmar; cancelar no modifica el registro. No hay borrado físico desde la interfaz.
- Solo registros activos admiten edición. Restaurar un pedido puede conservar su cliente archivado, sin exigir restaurar al cliente.
- Clientes archivados conservan sus pedidos vinculados, pero no se ofrecen para nuevos pedidos.
- Editar un cliente no cambia el nombre conservado en pedidos anteriores; cada pedido guarda una referencia histórica.
- Archivar un cliente no archiva sus pedidos ni los excluye del dashboard.
- Pedidos y gastos archivados se consultan en vista de archivados, sin edición, y no participan en resúmenes.
- Correcciones, archivo y restauración conservan autor, fecha y valores comerciales antes/después; el historial no es editable por los dueños. Contactos y notas se registran solo como campos cambiados, sin conservar sus textos anteriores en auditoría; los valores actuales permanecen consultables en el registro.
- Los registros activos y archivados tienen filtros separados. Restauración valida la versión para prevenir conflictos concurrentes.
- Rango del dashboard: fecha inicial y final inclusivas; inicialmente mes calendario actual, usando America/Bogota.
- Diferencia: total de pedidos registrados menos total de gastos. No representa utilidad contable ni dinero cobrado.

## Acceptance Criteria

**AC-001 → REQ-001**
Given un cliente activo y un pedido con fecha válida y dos descripciones libres, cantidades y precios válidos.
When un dueño guarda el pedido.
Then consulta un único pedido con ambas líneas y su cliente, sin crear productos de catálogo.

**AC-002 → REQ-002**
Given un gasto con fecha válida, concepto y total COP 50.000,00, sin proveedor ni referencia.
When un dueño guarda el gasto.
Then recupera el gasto con esos datos y sus campos opcionales vacíos.

**AC-003 → REQ-003**
Given una factura contiene varios materiales y total COP 120.000,00.
When un dueño registra ese total como gasto.
Then se guarda un gasto por COP 120.000,00 sin exigir líneas de materiales ni archivo adjunto.

**AC-004 → REQ-004**
Given un cliente creado con nombre válido, contacto y notas vacíos.
When el dueño busca su nombre.
Then encuentra el cliente y puede consultar y editar su registro.

**AC-005 → REQ-005**
Given dos dueños tienen cuentas autorizadas del mismo negocio.
When el segundo consulta un pedido guardado por el primero.
Then ve todos sus datos y tiene las mismas acciones permitidas.

**AC-006 → REQ-006**
Given un pedido y un gasto se guardaron correctamente desde un celular.
When un dueño los consulta desde otro dispositivo conectado.
Then recupera los mismos datos persistidos.

**AC-007 → REQ-007**
Given líneas con cantidades 2 y 1 y precios COP 25.000,00 y 35.000,00.
When el dueño guarda el pedido.
Then su total es COP 85.000,00, sin cargos ni descuentos automáticos.

**AC-008 → REQ-008**
Given un cliente tiene pedidos previos y el dueño ha solicitado archivarlo.
When confirma el archivo.
Then el cliente deja de aparecer para nuevos pedidos y los anteriores conservan su asociación y nombre histórico.

**AC-009 → REQ-009**
Given un rango contiene pedidos activos por COP 100.000,00 y gastos activos por COP 30.000,00, además de registros archivados.
When un dueño consulta el dashboard para ese rango.
Then ve pedidos registrados 100.000,00, gastos 30.000,00 y diferencia 70.000,00, excluyendo archivados.
And la diferencia se identifica como diferencia de registros, sin presentarla como utilidad ni cobros.

**AC-010 → REQ-001, REQ-007**
Given un pedido sin cliente, sin líneas, con descripción vacía, cantidad inválida, precio inválido o total cero.
When el dueño intenta guardarlo.
Then el sistema señala cada campo inválido y no crea ni modifica un pedido.

**AC-011 → REQ-002**
Given un gasto sin fecha válida, concepto vacío, total cero o negativo, o total con más de dos decimales.
When el dueño intenta guardarlo.
Then el sistema señala los campos inválidos y no crea ni modifica un gasto.

**AC-012 → REQ-008**
Given un dueño ha solicitado archivar un pedido o gasto activo.
When cancela la confirmación.
Then el registro conserva sus datos y sigue incluido en los resúmenes correspondientes.

**AC-013 → REQ-005**
Given una persona sin cuenta autorizada de Lúmina.
When intenta consultar datos del negocio.
Then recibe cero datos privados mientras no inicia sesión. Puede crear su cuenta en /registro para obtener acceso, conforme a la ampliación LUM-21.

**AC-014 → REQ-008**
Given un pedido activo tiene cambios anteriores conservados y un dueño solicita archivarlo.
When confirma el archivo.
Then puede consultarlo en archivados, con historial intacto y sin edición, y queda excluido del dashboard.

**AC-015 → REQ-008**
Given un pedido archivado tiene un cliente activo o archivado, historial protegido y versión vigente.
When un dueño confirma su restauración.
Then el pedido vuelve a activos y al resumen de su fecha, conserva cliente e historial y registra el evento de restauración.

## Non-Functional Requirements

| ID | Criterio verificable | Verificación propuesta |
|---|---|---|
| NFR-001 | Completar los flujos principales en anchos de 360, 768 y 1280 px sin desplazamiento horizontal de página. | Recorridos en los tres tamaños |
| NFR-002 | Consultas sin autorización entregan cero datos privados; cada cuenta autorizada tiene permisos iguales. | Pruebas negativas y entre dos cuentas |
| NFR-003 | Guardados confirmados sobreviven al cierre y reapertura. No se sobrescriben ediciones desactualizadas. | Persistencia y conflicto entre dos sesiones |
| NFR-004 | Ante fallo de conexión no confirmar guardado; ante doble envío de la misma operación no crear duplicados. | Fallo de red y repetición de operación |
| NFR-005 | Con 5 usuarios concurrentes y 1.000 pedidos, consultas y guardados responden en p95 ≤ 3 segundos. | Prueba con conexión estable, entorno y carga documentados |
| NFR-006 | Flujos principales se completan con teclado; campos tienen etiquetas y errores textuales asociados. | Recorrido teclado y revisión accesible |

Estas métricas son propuestas del blueprint, no cifras declaradas por el usuario.

## Constraints, dependencias y non-goals

Uso conectado; no offline. Sin inventario, producción, pagos pendientes, adjuntos ni cobro en línea.
Sin tienda pública, emisión fiscal, contabilidad formal, importación inicial ni integraciones externas en esta versión propuesta.
No hay preguntas de producto bloqueantes; el approval gate quedó satisfecho el 2026-09-30.
Cuentas de dueños y presupuesto de operación se gestionarán antes de puesta en producción, sin inventar compromisos económicos.
Arquitectura y stack se describen fuera de este documento; no son requisitos de producto.
Implementación y tests de entrega dependen de aprobación explícita del blueprint.

## Success metrics, trazabilidad y revisión

Meta de entrega: 100% de criterios y NFR aprobados pasan, incluyendo dos dueños y varios dispositivos.
La matriz Functional Requirements conecta requisitos y escenarios; diseño y tests se vincularán durante el lifecycle.
Blueprint aprobado y revisado. La evidencia de ejecución y trazabilidad se mantiene en QA_REPORT.md y PROJECT_STATUS.md.

## Glosario y Change history / INSCRIBE

Pedido: registro de lo solicitado, no prueba de cobro. Línea: descripción libre, cantidad y precio final.
Gasto: desembolso registrado, incluyendo una factura completa. Cliente: persona o entidad que realiza pedidos.
Archivado: eliminación lógica que preserva relaciones e historial. Diferencia: pedidos registrados menos gastos, sin interpretación contable.
2026-09-29 — v0.1: discovery parcial. v0.2: COP, alcance reducido y reglas concretas para aprobación.
INSCRIBE: reglas aprobadas por el usuario; QA independiente valida la implementación.
Next: cerrar QA y delivery según el lifecycle autorizado.

## Delta aprobado — primera cuenta local desde navegador

REQ-010 / AC-016: usuario autoriza configuración inicial web para crear la primera cuenta sin terminal. En localhost, mientras no exista ninguna cuenta, login ofrece Crear primera cuenta → formulario nombre/correo/contraseña/confirmación → cuenta habilitada → login. La apertura se cierra permanentemente en una creación atómica; carreras no crean dos primeras cuentas y revocación/eliminación no reabren el flujo. Signup general continúa cerrado; otras cuentas mantienen operación CLI. No habilitar automáticamente setup en origen productivo externo. Error DB debe cerrar admisión, no permitir bootstrap sin verificación. Revisar seguridad y permisos DB del cambio antes de entregar.


## Extensión aprobada — 2026-10-01

El usuario aprobó implementar catálogo sin inventario, selección integrada de clientes/productos, pedidos compactos, listados más claros y evolución de pedidos/gastos/diferencia. La exclusión inicial del catálogo queda sustituida por esta autorización; las líneas libres siguen admitidas. Contratos, responsables, dependencias y aceptación: [IMPROVEMENTS_PLAN.md](IMPROVEMENTS_PLAN.md). Misma arquitectura y reglas de integridad/acceso; migración aditiva e histórico preservado.

### Requisitos nuevos de la extensión

| ID | Resultado requerido | Evidencia |
|---|---|---|
| REQ-010 | Catálogo por presentación, precio/descripcion, archivo/restauración; selección opcional con snapshots editables e histórico preservado | Integración products-analytics y E2E improvements |
| REQ-011 | Cliente en combobox buscable, alta dentro del flujo, pedido compacto3líneas1440x900, teclado/toque y borrador protegido | E2E improvements e improvements-qa, capturas QA |
| REQ-012 | Pedidos/clientes/gastos/productos con jerarquía, filtros y navegación responsive legibles | Regresión critical y QA visual |
| REQ-013 | Evolución tres series/colores, días/meses, ceros, negativos y tabla exacta que concuerda con KPIs | Integración y E2E, revisión analytics_reporter |
| REQ-014 | Incorporar recurso existente Analytics Reporter con commit/licencia/trazabilidad y alcance descriptivo | INVENTORY/SOURCES y agents/analytics/analytics_reporter/SOURCE.md |

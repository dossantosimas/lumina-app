# Lúmina: contratos internos propuestos

Status: APPROVED el 2026-09-30 e implementado. Autor atlas; revisiones independientes en CODE_REVIEW.md/SECURITY_REVIEW.md y pruebas en QA_REPORT.md.
Contrato de servicios internos y Server Actions, no API pública de negocio. Auth usa rutas de Better Auth `/api/auth`; no recrear sus contratos.

## Frontera y tipos

Queries server-only autentican y validan `AuthUser.activeAccess` antes de consultar, incluido audit. Server Actions mutables ejecutan mismo guard, validan Zod y servicio transaccional vuelve a comprobar activeAccess con lock compartido de dueño. CLI de revocación bloquea esa fila en exclusivo y revoca sesiones; orden de locks dueño → clave → entidad → cliente. `activeAccess` default false y Better Auth `input:false`, sin acción web de administración. No aceptar `userId`, admisión, total, snapshot, timestamps o versión resultante como autoridad del navegador. UUID identifican registros y claves; fechas date ISO; dinero string decimal canónico con dos posiciones en salida. No exponer datos de cuenta/session ni objetos ORM completos.

La ruta web de auth valida allowlist antes de Better Auth: POST sign-in/email y sign-out, GET get-session. Negar demás paths/métodos, incluso signup, request/reset/change-password, cambio email/user y link accounts. Instancia CLI separada y ausente del bundle web.

Resultado lógico: `{ok:true,data,requestId}` o `{ok:false,error:{code,message,fieldErrors?},requestId}`. Auth nativo conserva contrato Better Auth. Acciones consumen errores esperados y no stacktrace; queries usan el mismo contrato lógico para estados de error. `fieldErrors` es mapa campo → mensajes, incluyendo `lines.0.quantity`.

Todas las mutaciones retornan acuse mínimo `data:{id,version,archived,total?}`; total solo en pedidos/gastos. No nombre, contacto, notas ni líneas en acuse ni respuesta persistida de idempotencia. Tabla siguiente identifica recurso resultante, pero su detalle se obtiene con query guardada inmediatamente después de éxito/replay. Si esa query falla, el acuse mantiene certeza de guardado sin fingir detalle actualizado.

| Código | Comportamiento |
|---|---|
| UNAUTHENTICATED | No datos; conservar formulario local y pedir login |
| FORBIDDEN | Cuenta no admitida/activa; no datos |
| VALIDATION | Corregir campos, sin escritura |
| NOT_FOUND | Registro inexistente o fuera de la vista activa solicitada; recargar lista |
| CONFLICT | Versión vieja o cliente archivado concurrentemente; conservar formulario y revisar dato actual |
| IDEMPOTENCY_MISMATCH | Clave reutilizada con payload distinto; corregir flujo, no retry automático |
| RATE_LIMITED | Auth limitado; esperar ventana antes de repetir |
| UNAVAILABLE | DB/conexión/timeout; no confirmar éxito, repetir payload y clave originales |
| INTERNAL | Error inesperado con requestId; sin información interna ni retry automático nuevo |

## Operaciones

| Servicio | Entrada | Salida segura |
|---|---|---|
| clients.list | búsqueda, archived=false, page, pageSize | cliente id/nombre/contactos/archived/version y paginación |
| clients.get | id | cliente activo o archivado, con archived/version, o NOT_FOUND |
| clients.create | nombre, contacto/notas opcionales, idempotencyKey | acuse mínimo cliente |
| clients.update | id, expectedVersion, campos, key | acuse mínimo cliente |
| clients.archive | id, expectedVersion, key | id, archived=true, nueva versión |
| clients.restore | id, expectedVersion, key | id, archived=false, nueva versión |
| orders.list | fechas opcionales, cliente opcional, búsqueda, archived=false/true/all, page/pageSize | id/fecha/snapshot cliente/total/archived/version y resumen de líneas |
| orders.get | id | cabecera, líneas ordenadas, archived y customerArchived actuales |
| orders.create | clienteId, fecha, líneas, notas opcionales, key | acuse mínimo pedido, total calculado |
| orders.update | id, expectedVersion, clienteId, fecha, líneas completas, notas opcionales, key | acuse mínimo pedido, total calculado |
| orders.archive/restore | id, expectedVersion, key | id, archived=true/false, nueva versión |
| expenses.list/get | filtros fechas/búsqueda/paginación o id | fecha/concepto/total/proveedor/referencia/version |
| expenses.create | fecha, concepto, total, proveedor/ref opcionales, key | acuse mínimo gasto |
| expenses.update | id, expectedVersion, campos completos, key | acuse mínimo gasto |
| expenses.archive/restore | id, expectedVersion, key | id, archived=true/false, nueva versión |
| audit.list | entidad/tipo opcionales, page/pageSize | actor/nombre snapshot, fecha UTC, operación, entidad, before/after comercial permitido y flags contactChanged/notesChanged, sin contacto/notas literales |
| audit.forEntity | tipo, entidadId, page/pageSize | historial paginado de entidad activa o archivada, mismo DTO audit |
| dashboard.summary | desde, hasta | totalPedidosCOP, totalGastosCOP, diferenciaCOP, cantidadPedidos, cantidadGastos |

`key` abrevia `idempotencyKey`; `expectedVersion` entero ≥1. Listas admiten filtro archived=false/true/all, por defecto false; all se usa explícitamente en historial asociado de cliente. Get por ID consulta ambos estados, protegido por el mismo guard, y retorna archived; no convierte un registro histórico en NOT_FOUND solo por estar archivado. orders.get agrega customerArchived actual y clientId para abrir clients.get desde un pedido activo o archivado. El detalle de cliente solicita orders.list con su id y archived=all, paginado, mostrando estado de cada pedido. Orders/expenses list también admiten búsqueda por snapshot/descripción/notas o concepto/proveedor/ref respectivamente; clients list busca nombre/contacto/notas. Archivados tienen vista separada y son de solo lectura hasta restore; modificar uno devuelve CONFLICT. Archive exige activo, restore exige archivado, ambos confirman estado esperado/version y conservan datos. Clientes archivados disponibles en histórico, no seleccionables para nuevo pedido. Un update de pedido con el mismo cliente ahora archivado conserva asociación/snapshot; cambiar a otro cliente requiere activo. Restaurar un pedido preserva asociación con cliente archivado. No hard delete ni batch masivo. Los DTO exactos se alinean al diseño de datos.

Dashboard calcula agregados de pedidos/gastos activos en intervalo de fechas de negocio inclusivo. Lectura en una transacción con snapshot consistente; totales y diferencia son strings decimal exactos, diferencia admite negativo. Sumas agregadas pueden superar límite por registro, usar numeric sin estrechar a numeric(14,2). No representa utilidad contable ni flujo de caja, porque no controla pagos. Interfaz suministra fechas del mes actual según America/Bogota y puede elegir otro periodo; el servidor valida intervalo.

dashboard.summary incluye recentOrders/recentExpenses: últimos cinco activos de cada tipo dentro del mismo rango, orden fecha descendente e id estable, consultados en el mismo snapshot que los agregados. No cargar recientes fuera del rango ni contar archivados.

Límites canónicos propuestos: nombre 1..120 caracteres, contacto opcional ≤120, descripción línea 1..200, concepto gasto 1..300, proveedor/ref opcionales ≤120, notas opcionales de cliente/pedido ≤2000. Trim en servidor; vacíos opcionales se normalizan a null. Contacto es texto libre, sin asumir formato país. Pedido 1..100 líneas, cantidades 1..10000, precio 0..999999999999.99; subtotal también debe caber y total >0 hasta ese máximo. Gasto >0 hasta ese máximo. API acepta únicamente decimal canónico con punto, sin exponentes, separadores de miles, NaN, más de dos decimales ni negativos. UI monetaria acepta coma decimal sin miles y transforma por texto a canónico con punto; muestra ejemplo y no usa parseFloat. Date ISO existente; no imponer fecha pasada sin requisito. Búsqueda ≤120, page≥1, pageSize 1..50 por defecto 20; orden fecha descendente+id estable. La lista de clientes usa nombre+id; audit usa timestamp descendente+id. Filtros desde≤hasta; archivados nunca aparecen en consultas normales.

## Edición, idempotencia y retry

La UI crea UUID por intención de guardar. Deshabilitar botón durante envío es UX, no garantía de integridad. Con fallo incierto conservar payload congelado y clave para retry; si se cambia formulario, iniciar intención nueva. Clave única persistida `(actorUserId,operation,key)` con hash SHA-256 de payload canónico normalizado, incluida versión esperada/target, excluyendo clave y requestId. Guard se ejecuta antes de devolver replay; no permitir replay de usuario desactivado.

En transacción: lock compartido dueño y recheck activeAccess; reclamar clave mediante restricción única; mutar cabecera/líneas o registro con condición de versión; agregar AuditEvent con actor del guard, timestamp DB y before/after comerciales permitidos; persistir acuse mínimo y hash; commit conjunto. Audit excluye contacto/notas literales y conserva solo flags de cambio; payload sí los incluye en hash para detectar reuso diferente. Replay no genera otro evento y también revalida admisión. Un competidor espera resolución de unicidad y lee resultado confirmado en una nueva transacción con mismo guard. No existe estado de éxito sin mutación ni fila pendiente visible sin commit. Errores de validación/conflicto no se memoizan como éxito. Registro idempotente se conserva durante MVP, sin expiración que permita duplicar reintentos tardíos (supera mínimo 24 horas); revisar volumen en mantenimiento. No guardar payload completo ni duplicar contacto/notas/nombre en idempotencia. Replays retornan acuse original; consultar detalle con query guardada después para ver cambios posteriores.

Update/archive/restore ya aplicado con misma clave retorna éxito previo aunque la versión haya cambiado por esa operación; distinta clave y versión vieja retorna CONFLICT. Cliente activo se verifica y bloquea coherentemente durante create/cambio de cliente, para impedir carrera con archivo. Dos propietarios que actualizan simultáneamente mismo registro no pueden ganar con la misma versión. Retries DB internos limitados a 3; timeout al usuario requiere mismo key, nunca una inserción nueva automática.

## Prueba del contrato

Integration DB para unicidad simultánea, rollback de líneas/audit, límites numeric, update vs archive, restore con cliente archivado, cliente archive vs pedido y replay tras versión cambiada. Comprobar before/after permitidos exactos, ausencia literal de contacto/notas en audit/idempotencia y denegar modificación de AuditEvent con rol DB de aplicación. Revocación vs escritura y replay respetan activeAccess; probar rechazo de campo adicional cliente escribible y rutas auth fuera de allowlist. Playwright para validación por campo, login expirado, red interrumpida, historial, confirmaciones de archive/restore y conflicto conservando formulario. Prueba negativa invocando acción directamente, sin depender de botones ocultos.


## Extensión aprobada — 2026-10-01

El usuario aprobó implementar catálogo sin inventario, selección integrada de clientes/productos, pedidos compactos, listados más claros y evolución de pedidos/gastos/diferencia. La exclusión inicial del catálogo queda sustituida por esta autorización; las líneas libres siguen admitidas. Contratos, responsables, dependencias y aceptación: [IMPROVEMENTS_PLAN.md](IMPROVEMENTS_PLAN.md). Misma arquitectura y reglas de integridad/acceso; migración aditiva e histórico preservado.

Contratos de la extensión: ProductDTO {id,name,price,description,archived,version}; ProductInput {name,price,description?}. QueryOperation incorpora products.list/get; MutationOperation incorpora products.create/update/archive/restore; EntityType incorpora PRODUCT. OrderLineDTO incluye productId:string|null; OrderInput admite productId nullable/opcional (omisión normalizada a null). DashboardDTO agrega granularity:day|month y series:[{period,orders,expenses,difference}] con importes exactos string fijo2. Los demás envelopes/metadata de operaciones se conservan.

## LUM-21 — registerAccount

Acción pública dedicada: registerAccount({name,email,password,passwordConfirmation}). Retorna {ok,message,code?}; INVALID para validación/duplicado, UNAVAILABLE para origen/cuota/error. Requiere origin/host/proxy canónicos; HTTPS o HTTP loopback exacto. No acepta activeAccess ni userId. Reserva cuota persistente antes del hash Better Auth y llama register_owner_account; cuenta activa inmediata por autorización del usuario. No modifica la allowlist de /api/auth ni los guards de negocio.

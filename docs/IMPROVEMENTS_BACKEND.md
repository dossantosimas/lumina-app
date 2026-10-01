# Backend — mejoras aprobadas

Fecha: 2026-10-01. Implementación preparada; requiere revisión independiente.

Catálogo `products` con precio COP positivo, descripción opcional, nombres repetibles, paginación/búsqueda, archivo/restauración y versiones. Todas las escrituras comparten autorización, bloqueo, auditoría PRODUCT e idempotencia del dominio. Runtime conserva acceso SELECT/INSERT/UPDATE; sin DELETE/TRUNCATE.

Pedido mantiene descripción y precio históricos. La referencia opcional `productId` usa FK RESTRICT y no cambia snapshots al editar el catálogo. Nuevas referencias requieren producto activo; un producto archivado puede conservarse únicamente hasta la cantidad de referencias ya presentes en el pedido. Locks de producto por UUID ascendente después de dueño/clave/entidad/cliente evitan carreras con archivo.

Dashboard produce serie exacta y completa en el mismo snapshot RepeatableRead que totales/recientes. Hasta 31 días inclusivos agrupa por día; períodos mayores por mes. Filtra fechas antes de agrupar, completa ceros y permite diferencias negativas/agregados superiores al límite por registro. El rango admite hasta 36.600 días, con error explícito; año 0000 se rechaza por incompatibilidad PostgreSQL.

Migración aditiva `202610010005_products`: tabla nueva, columna nullable en líneas históricas, FK y ampliación de constraint audit. Transacción con timeouts; no modifica/elimina registros históricos. Revertir sobre datos reales requiere backup y autorización: no se ha ejecutado rollback/reset/restore productivo.

Verificación ejecutada: Prisma generate, deploy migraciones y grants en bases Docker `lumina` y `lumina_test` PASS. Datos reales nunca impresos. 37 unitarias PASS; 29 integración PostgreSQL/Auth PASS (incluye siete nuevas pruebas catalog/analytics). Lint backend y typecheck ejecutados; estado detallado entregado al orquestador. QA solo usa `lumina_test`, con guard de conexión local; no se reinició servidor ni navegador.

Cobertura nueva: validación/límites, versión concurrente, replay/mismatch, archivo/restauración con audit, referencias archivadas/extra/rechazadas y rollback, carrera archivo vs nueva referencia, snapshots preservados, 31/32 días, febrero bisiesto, meses parciales, ceros, negativos y agregados grandes.

Impacto verificado: callers (contrato comunicado a frontend/root), tests (unit/integración), tipos (DTO+Prisma), configuración (migraciones/grants), docs (este reporte; documentación general responsabilidad root). CODE_QUALITY_GATE: SLD/SEC/RDB/MNT/TST/PRF/SCL revisados por implementador; aprobación final exclusivamente reviewers independientes.

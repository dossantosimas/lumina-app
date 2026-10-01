# Mejoras aprobadas — 2026-10-01

Autorización: petición explícita «PLEASE IMPLEMENT THIS PLAN». Extensión del alcance entregado, no reinicio del proyecto. El blueprint inicial excluía catálogo; esta aprobación lo incorpora sin inventario.

## Contratos y decisiones

- Producto: nombre hasta120 caracteres, precio COP positivo y descripción opcional hasta2000; cada presentación independiente. Búsqueda, creación/edición y archivo/restauración; mismos guards, versión, idempotencia y audit PRODUCT.
- Línea: productId nullable, descripción y precio copiados al elegir. Ajustes particulares y líneas libres permitidos. Referencias nuevas requieren producto activo; referencias históricas se conservan aunque se archive. Cambiar catálogo nunca recalcula histórico. Migración aditiva sin inferir catálogo de registros existentes.
- Resumen: series period/orders/expenses/difference y granularity day/month. Hasta31 días inclusivos diario; demás mensual. Filtrar rango antes de agrupar, incluir ceros, agregar exacto en mismo snapshot RepeatableRead. Límite explícito36600 días para rangos extraordinarios; sin truncamiento silencioso.
- Gráfica descriptiva con cero/negativos, trazos distintos y tabla exacta. Verde pedidos #285a3d, rojo gastos #9a2828, neutro diferencia #71634f. No interpretar como utilidad, cobros o caja. No pronósticos ni ranking.
- Pedido: combobox único cliente y buscador producto por línea. Debounce, descarte respuestas obsoletas, teclado/toque, etiquetas/estados y selección inequívoca. Cliente creado dentro del flujo queda seleccionado.
- Desktop: editor hasta1120px, filas compactas, cliente/fecha juntos, notas plegables, total/guardar visibles para3 líneas en1440x900. Mobile controles44px y ninguna superposición/desbordamiento; cuatro destinos principales y Más para secundarios.
- Listados: jerarquía clara, números alineados, bordes suaves, descripciones resumidas y detalle completo. Preservar filtros/paginación/regreso/archivo e historial.

## Equipo, dependencias y gates

1. analytics_reporter importado existente y fijado a commit con licencia/trazabilidad; validación descriptiva sin inferencias estadísticamente inventadas. Entrega: contrato analítico y edge cases; revisión backend/QA. Cumplido cuando métricas/series coinciden.
2. uiux_designer: validación layout/accesibilidad con recursos UX/palette; entrega restricciones responsive. Depende plan aprobado; revisión visual final independiente.
3. backend_developer: catálogo/migración/grants/contratos/series y pruebas aisladas; depende contratos validados. Revisión code_reviewer/security y QA.
4. frontend_developer: páginas/listas/selectores/formulario/gráfica y recorridos; depende contratos compartidos. Revisión uiux y code_reviewer; QA visual/funcional.
5. nexus: integración/docs, revisión independiente, correcciones, QA y build; actualizar TASKS/PROJECT_STATUS con resultados reales.

## Aceptación

Clientes buscados/creados/seleccionados por teclado/toque; catálogo CRUD/archive/restore/audit/replay/concurrencia; pedidos mixtos/ajustes/histórico; gráfica31/32d, meses parciales, año bisiesto, ceros, negativos, grandes agregados; UI360/768/1440x900 y1440+ con teclado/foco/contraste; regresión auth/recovery; typecheck/lint/unit/integration/E2E/build. QA sintética aislada, sin cambios de datos reales. Sin despliegue productivo.

Validaciones previas analytics_reporter y uiux_designer: favorables; su revisión de diseño no sustituye QA del resultado implementado.

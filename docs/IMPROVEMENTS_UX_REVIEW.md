# Mejoras — revisión UX independiente

Fecha: 2026-10-01, America/Bogota. Reviewer: uiux_designer; no implementó las mejoras. Recursos leídos: framework/AGENTS.md, agents/design/uiux_designer.toml y frontend-design-pro/SKILL.md. Alcance: incremento aprobado en IMPROVEMENTS_PLAN.md.

**Veredicto: APPROVE.** Sin hallazgos materiales pendientes en el alcance inspeccionado.

## Evidencia inspeccionada

Inspección visual mediante view_image de las seis capturas viewport existentes: `qa-visual/improvements-order-viewport-{1440,360,768}.png` y `qa-visual/improvements-chart-viewport-{1440,360,768}.png`. Las capturas fullPage no se usan para acreditar barras fijas o elementos visibles. Lectura de globals.css, record-form.tsx, resource-list.tsx, search-combobox.tsx, shell.tsx y evolution-chart.tsx; contraste con IMPROVEMENTS_PLAN.md e IMPROVEMENTS_QA.md.

| Restricción | Resultado |
|---|---|
| Pedido compacto desktop | Captura 1440 muestra cliente, fecha, tres líneas, notas plegadas, total COP 3.299,70 y guardar en un viewport de 900 px. QA acredita sus bounding boxes después de enfocar; captura superior ligeramente desplazada por foco, sin recortar controles esenciales. |
| Mobile y tablet | Capturas 360/768 muestran campos dentro del ancho, orden de lectura coherente, foco visible y total/guardar accesibles. Móvil usa scroll vertical y barra de guardado sobre navegación inferior. QA acredita ausencia de overflow y taps reales emulados con targets ≥44 px. |
| Cliente/producto integrados | Source muestra combobox único con labels, estado de carga/error/vacío, opción activa, flechas/Enter/Escape y invalidación de respuestas anteriores. Catálogo copia valores al borrador y permite línea personalizada; errores conservan campos. QA acredita selección por teclado/toque y cantidad/precio preservados. |
| Listados | Source de pedidos/clientes/gastos/productos comparte tabla semántica con encabezados, importes alineados, separadores suaves y detalle accesible. Descripción resumida evita filas extensas; búsqueda/archivo/paginación conservados. Evaluación de listas basada en source, no se aportaron capturas nuevas de esas cuatro listas en este conjunto. |
| Identidad/navegación | Capturas mantienen crema, tinta y acento dorado; semantic colors se reservan para estados y series aprobadas. Desktop expone Productos; móvil muestra cuatro destinos más Más; source implementa diálogo con acceso a Productos. |
| Gráfica y exactitud visible | Las tres capturas muestran pedidos COP 0,20, gastos COP 0,30, diferencia −COP 0,10 y meses posteriores en cero. Línea negativa se ubica bajo el eje cero, series tienen trazos distintos y tabla legible de valores exactos. SVG tiene título/descripción; tabla tiene caption y encabezados. La tabla proporciona alternativa operable con teclado a la selección pointer del gráfico. |

## Límites y cierre

QA independiente registra 23 escenarios en suite completa más una prueba táctil y una negativa acotadas, sin afirmar una sola ejecución de 25. Esos resultados son evidencia de QA consultada, no pruebas reejecutadas por este reviewer. No se afirma certificación WCAG, auditoría completa con lectores de pantalla, prueba de dispositivos físicos ni estudio de usabilidad con dueños. La revisión visual cubre las capturas indicadas y no acredita estados ausentes de ellas por mera apariencia.

El incremento cumple las restricciones de layout e interacción revisadas. Revisiones de código/seguridad, build y cierre del lifecycle pertenecen a sus responsables y deben conservar su propia evidencia.

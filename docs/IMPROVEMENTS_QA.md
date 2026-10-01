# Mejoras — QA independiente

Fecha: 2026-10-01. Recurso existente `framework/agents/quality/test_generator.toml`, trazado en INVENTORY/SOURCES. QA no implementó la aplicación. Productores backend/frontend y revisores independientes conservan sus responsabilidades.

**Veredicto: PASS.** Ninguna cuenta ni registro sintético creado en `lumina`; servidor3000 reservado al usuario. Aplicación congelada y build final validado por el orquestador antes de Chromium.

| Verificación | Resultado real de QA |
|---|---|
| `npm.cmd run test` | 37/37 PASS, 2 archivos, 0,312 s. |
| `npm.cmd run test:integration` | 29/29 PASS, 4 archivos, 7,81 s; PostgreSQL/Auth reales aislados. |
| `$env:QA_E2E_BUILT='1'; $env:CI='1'; npm.cmd run test:e2e` | 23/23 PASS, 44,0 s; Next **start** localhost3001 y `lumina_test`, implementación final. |
| Prueba táctil añadida posteriormente | 1/1 PASS, 8,4 s; Chromium `hasTouch:true` en360/768, acciones `.tap()`. |
| Prueba de gráfica negativa añadida posteriormente | 1/1 PASS, 5,1 s; métricas/tabla exactas, SVG firmado y capturas360/768/1440. |
| Typecheck/lint incluyendo nuevos tests | Ambos exit0; repetidos después de la prueba táctil. Typecheck de prueba de gráfica también exit0 antes de ejecutarla. |

**25 escenarios E2E distintos aprobados**:23 en suite completa más táctil1 y gráfica1 en ejecuciones acotadas. No se afirma una sola ejecución completa de25. Las pruebas adicionales no cambiaron código de aplicación ni necesitaron otra compilación.

## Aceptación verificada

- Catálogo crear/editar, archivo/restauración e historial; autorización, versión, idempotencia/mismatch, ediciones concurrentes y permisos DELETE/TRUNCATE denegados.
- Pedidos conservan precio/descripción históricos al editar/archivar catálogo. Nuevas referencias archivadas/desconocidas fallan atómicamente; referencias existentes se conservan, incluido archivo/restauración. Race de archivo ganador bloquea una nueva referencia. UI elige cliente creado dentro del flujo, producto por teclado/toque, personaliza precio/descripción y permite línea libre conservando valores.
- Analítica real: diario31d/mensual32d, leapday, ceros, negativos, meses parciales y agregados grandes, filtrados antes de agrupar. UI de2090vacío muestra buckets diarios/mensuales y tabla cero. Nueva fixture2077-01-15→2077-03-15 produce métricas y primera fila exactas0,20pedidos/0,30gastos/−0,10diferencia, siguientes meses cero y SVG con coordenadas finitas. Fixture de gráfica eliminada mediante sus ids al terminar.
- Combobox independiente: opciones anteriores desaparecen antes del debounce; respuesta/fallo anteriores no reponen opciones ni selección después de cambiar texto. Precio999,90 de opción nueva conserva cantidad3 y no toma precio anterior500,50; búsqueda en otra línea no elimina metadata elegida.
- POST real de guardado pausado: botón «Guardando…» deshabilitado, comboboxes deshabilitados y popup cerrado; al liberar guarda total exacto3.299,70.
- Toque real emulado360/768: error de cliente asociado mediante `aria-describedby`, selección de cliente/producto por `.tap()`, precio500,50 preservado al convertir a línea libre; personalización/guardar con altura≥44px en entorno coarse.
- Layout360/768/1440×900 sin desbordamiento horizontal. Tres líneas completas: cliente, fecha, total y guardar dentro de900px en escritorio, comprobado con bounding boxes. Capturas viewport son preferibles a fullPage por las barras fijas móviles. Inspección visual móvil/escritorio: controles alineados, foco legible, filas compactas y valores exactos de gráfica legibles.
- Regresión de acceso privado, datos compartidos, recuperación/revocación, signup deshabilitado, primera cuenta, multiline, archivo/historial, offline/reintento idempotente, conflictos y filtros aprobada en suites existentes.

Capturas de pedido: [móvil](qa-visual/improvements-order-viewport-360.png), [tablet](qa-visual/improvements-order-viewport-768.png), [escritorio](qa-visual/improvements-order-viewport-1440.png).

Capturas de gráfica negativa y tabla exacta: [móvil](qa-visual/improvements-chart-viewport-360.png), [tablet](qa-visual/improvements-chart-viewport-768.png), [escritorio](qa-visual/improvements-chart-viewport-1440.png).

## Correcciones del harness y límites

Primera corrida diagnóstica20PASS/3FAIL: tests nuevos retenían una Server Action mientras esperaban otra posterior. Next16 las despacha secuencialmente por cliente, confirmado en documentación instalada `server-actions.md` y `backend-for-frontend.md`. Se corrigió el harness para comprobar estado pendiente, liberar la anterior y verificar la nueva; suite final23PASS. No se simula que B llegue antes de A cuando ese transporte no lo permite.

La prueba táctil exigía un nombre accesible exacto de precio que su mensaje de error amplía; selector del test corregido al id. Fixture de gráfica inicialmente usó posición0 (SQL exige1..100); corregida. Assertion de negativos adaptada al signo menos tipográfico y formato COP real. Todas se repitieron desde fixture válida sin cambios de aplicación.

Datos/identidades sintéticos únicamente en bases locales protegidas por guards. Consultas de fixtures parametrizadas con ids aleatorios. No se imprimieron contraseñas, cookies ni URLs privadas. Servidores de prueba administrados por Playwright cierran al finalizar; nunca Nextdev ni escritura concurrente de `.next`.

Límites: emulación táctil Chromium, no dispositivos físicos; no auditoría completa de tecnologías asistivas ni usabilidad con dueños reales. No se validaron Neon ni hosting externo. Restauración/migraciones locales, reviews y build finales están registrados por sus responsables en documentos de entrega.
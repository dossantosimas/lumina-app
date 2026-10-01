# Independent review — mejoras Lúmina

Fecha: 2026-10-01. Reviewer: code_reviewer, distinto de productores backend_developer y frontend_developer_improvements. Fuente: IMPROVEMENTS_PLAN aprobado, contratos y código real. Revisión de fuente readonly; este archivo contiene evidencia, no implementación.

Estado final de revisión de fuente: **APPROVE** después del aviso writers ready de nexus y relectura independiente. La liberación local sigue pendiente de QA/build/validación visual del orquestador; esta revisión no los sustituye ni atribuye pruebas ejecutadas al reviewer.

## Primera revisión de contratos/datos

Migración catálogo aditiva, productId nullable con FK RESTRICT, preserva líneas existentes. Productos reutilizan owner guard, validación estricta COP positivo, entity lock/version, audit PRODUCT y clave/hash/acuse transaccionales. Grants incorporan productos sin dar DELETE al runtime. Dashboard agrupa después de filtrar rango, rellena periodos con generate_series y conserva totales/series/recientes en RepeatableRead. Rango extraordinario se valida explícitamente; no truncamiento silencioso.

La interpretación de referencia histórica archivada fue aclarada por nexus: por línea, máximo de referencias previas por producto; ajustes de precio/cantidad/descripción admitidos. Contador y prueba están presentes en la versión final y fueron revisados.

## Hallazgos preliminares transmitidos (histórico; cierres abajo)

| ID | Prioridad/severidad | Evidencia y trigger | Acción/cierre |
|---|---|---|---|
| IMP-R01 | Should fix / Medium / OPEN | SearchCombobox onChange conserva items previos; tras escribir nueva búsqueda, ArrowDown/Enter puede seleccionar resultado viejo durante debounce/red | Invalidar opciones visibles/selectables al cambiar consulta; probar respuesta retardada y selección por teclado sin elegir resultado viejo |
| IMP-R02 | Should fix / Medium / OPEN | Popup usa li/onClick sin estado disabled; fieldset disabled no deshabilita esos nodos. Popup abierto durante busy permite cambiar borrador pese a payload enviado | Propagar disabled/busy/uncertain/conflict y cerrar/invalidate popup; impedir onSelect en estado bloqueado; probar solicitud pendiente y guardado incierto |
| IMP-R03 | Should fix / Medium / OPEN | Filas compactas nuevas eliminan IDs/describedby de errores de descripción/cantidad/precio | Restaurar asociación campo/error de NFR006; probar IDs/lectura/teclado con validación |
| IMP-R04 | Should fix / Medium / TO_VERIFY | Lectura actual de record-form contiene textos nuevos con sustitución U+FFFD (Descripci�n/vela �) | Verificar bytes UTF8 y corregir strings si corrupción literal; no atribuirlo a interfaz final antes verificar |
| IMP-R05 | Should fix / Medium / OPEN | RecordForm search actualiza productOptions/customerOptions antes de que SearchCombobox descarte una respuesta vieja. A antigua y B nueva para mismo ID: B muestra nuevo precio, A tardía sobrescribe cache, onSelect copia precio anterior | Descartar también efectos sobre cache de búsquedas obsoletas o copiar datos del Choice aceptado; probar respuestas fuera de orden con mismo producto y precios distintos |

## Cierre independiente — versión final 2026-10-01

Los hallazgos anteriores describen la primera versión, no defectos abiertos. Todos están **CLOSED** en la fuente final:

| ID | Evidencia de cierre |
|---|---|
| IMP-R01 | search-combobox.tsx resetSearch invalida secuencia/items/active antes de consultar; cleanup cancela resultados obsoletos. Campo diferencia query de selected: limpiar referencia externa no conserva etiqueta de producto anterior. |
| IMP-R02 | disabled impide búsquedas/selección y oculta popup; RecordForm lo pasa para busy, uncertain y latest. Acuse incierto conserva pending con contenido/clave original para reintento. |
| IMP-R03 | Inputs de descripción/cantidad/precio y ambos selectores tienen IDs, aria-invalid y aria-describedby hacia mensaje de campo. |
| IMP-R04 | Decodificación UTF8 estricta de record-form/search-combobox/evolution-chart/resource-list/shell: válida, cero U+FFFD. |
| IMP-R05 | Búsqueda no modifica caches; selección aceptada copia Choice.label/price de la opción mostrada. customerOptions se actualiza solo al elegir resultado aceptado o crear cliente. |

Catálogo: actions allowlist/regex y requireOwner cubren consultas/mutaciones; guard transaccional revalida acceso. Validación estricta y dinero exacto siguen en servidor. Producto usa entity lock/version y transacción única para registro, audit PRODUCT y acuse/hash idempotente. Pedidos preservan productId opcional, precio/descripción propios y cliente histórico; productos se bloquean por UUID ordenado. Multiset impide incrementar referencias a producto archivado respecto de la versión anterior, admite ajustes a referencias existentes; desconocidos/nuevos archivados fallan antes de escritura comercial. FK RESTRICT y migración aditiva no crean catálogo inferido ni recalculan pedidos. Grants conceden productos SELECT/INSERT/UPDATE al runtime, sin DELETE; operador de cuentas permanece separado.

Analítica: filtro inclusivo precede agrupación SQL, generate_series incluye ceros, cambio día/mes usa 31 días inclusivos, valores/recientes/totales se leen dentro de RepeatableRead. Decimal/BigInt conserva centavos, negativos y agregados por encima del límite por registro; solo coordenadas visuales acotadas usan Number. Gráfica distingue trazos y ofrece tabla con encabezados/cantidades exactas accesible desde details. Navegación, listas/paginación y detalle/historial cubren productos manteniendo retorno con filtros. Restore incorpora conteo/FK de productos y aplica script exacto de grants, con comprobación de ausencia de permisos comerciales para operador y de DELETE de productos para runtime.

Pruebas leídas, no ejecutadas por este reviewer: products-analytics unit/integration verifican validación, lifecycle/replay/version/audit/permisos, referencias desconocidas/archivadas y rollback, carrera con archivo bloqueado, 31/32 días, bisiesto, meses parciales, negativos/ceros/agregados grandes. Nexus/QA debe aportar ejecución actual y caso navegador de respuestas fuera de orden, contexto bloqueado y precio copiado; no se infiere PASS de leer los tests. No se mutó base ni ejecutó suite concurrente.

Sin hallazgos Must/Should fix abiertos en la versión revisada. Aprobación de código/seguridad del delta local, no certificación de producción/hosting/Neon, WCAG completa o backup externo.

Último delta del productor revisado después del congelamiento: search-combobox agrega useEffect incondicional para scrollIntoView block nearest de la opción activa cuando el popup está expandido. No altera selección, contenido, permisos ni cancelación de búsquedas. Guard expanded/active y búsqueda opcional del nodo evitan actuar sobre popup cerrado. Aprobación de fuente **APPROVE** ratificada; restantes hashes principales coinciden con revisión anterior. QA/build sobre esta versión siguen a cargo de nexus/QA.

SHA256 de referencias finales principales:

```text
search-combobox.tsx C997D470FA3304E97233AA0CC114E2C5E2E469908CC9E8C935C47E8653A2C62F
record-form.tsx CB850CDE4254930AFCD9693EF1B5C20669A9B5915DF424BD78265281E164799E
evolution-chart.tsx 44A9D28FF61EE23CC6BD4C6A27611D5E80EB4EA5C53B167DCA229DCEE1C9D8F8
domain.ts D5F60B04726FBFF9DFFE9FC0DD7E8F9FA41148D458482DED5F8B630BB94C0390
queries.ts B8541E90184611B275E32A1D7D02112A95A519334B8CE9D633B77E1E9840BB6E
actions.ts EB27C2315B8D18A10FD49A723685FB63AC7A079E69C08647625A1C0B2814AEF2
202610010005_products/migration.sql 29AFE466DA8E1884CB6D903F97E923B6DFFA043D951DB7846FA75358FA40F196
grants.ts 070C63AA7160CDD6ABD85DA16379E2D655A6B5C0F85953EE72AFFA681A1AF192
qa-restore.mjs BB4A7FD9914F965223C76740B197185D2A4E291CAF309BCEE9BE410C1B82CFAA
tests/support/restore-auth.ts B639FF71B2C6135A8C68F056C7B20A227A303F8F555F0EC4CB095BCB040CD7ED
```

## Delta final de harness de restore

Revisado independientemente después del congelamiento de aplicación: qa-restore pasa conteos originales de pedidos/productos, obtenidos de inspect de lumina_test antes de pg_dump, a la prueba de autenticación mediante variables QA_RESTORE_*. restore-auth valida enteros seguros (pedidos positivos, productos no negativos), verifica sesión real del dueño restaurado y compara orders.list/products.list con archived all contra ambos conteos originales. Esto sustituye el supuesto de 1000 pedidos de qa:load y permite usar fixtures sintéticos posteriores a integración/E2E sin disminuir la comprobación: conserva igualdad de conteos comerciales/FK/totales/history previa al acceso, grants exactos y límites auth/audit/setup. Comandos siguen fijados a lumina_test/lumina_restore_test locales y no imprimen secretos.

**APPROVE** de este delta de fuente de pruebas, sin hallazgos materiales. El PASS de restore actual depende de la ejecución de nexus; este reviewer no ejecutó ni modificó bases.

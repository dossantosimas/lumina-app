# Code review — Lúmina

Fecha: 2026-09-30. Reviewer: code_reviewer, independiente de los implementadores.
Método: review del framework; revisión directa, sin editar implementación ni ejecutar suites DB mientras QA trabaja. Judge leído como referencia; no se afirma revisión multiengine.
Verdict vigente: **Approve** — CR-01..05 cerrados con revisión de fuente y evidencia QA final. Intent alignment: **PASS**. Los estados OPEN/Request changes que siguen documentan las rondas históricas, no el gate actual.

## Alcance y evidencia

Inspeccionados servicios domain/queries/actions/auth/db/errors, contratos/validación/dinero, schema y SQL inicial, grants y operador, bootstrap/env y scripts de QA, configuración de Next/Prisma/tests y componentes principales con páginas representativas de cada patrón. Generated Prisma deriva del schema; no se atribuye revisión manual de cada línea generada. Requisitos, API, DB y UX aprobados proporcionan los contratos.

El cálculo usa BigInt/céntimos y numeric, entradas strict, fecha DATE UTC sin desplazamiento; update/archive/restore bloquean entidad y comparan versión. Owner lock y recheck preceden datos y replay. ON CONFLICT bajo ReadCommitted serializa claves, hash normalizado diferencia payload, y mutación/líneas/audit/acuse confirman juntas. Dashboard RepeatableRead mantiene agregados y recientes consistentes. No se detectó un defecto material en estas reglas durante lectura.

Pruebas inspeccionadas: unit de límites/precisión/fechas/autoridad; integración real de rollback, replay simultáneo, hash diferente, versión, cliente archivado, locks de archivo/revocación y audit. Nexus reporta suites/build/carga/restore pasando; no se presentan como ejecuciones propias. QA E2E sigue ampliando/ejecutando evidencia. Security review es independiente; SEC-04 no se duplica aquí y SEC-05 conserva su seguimiento operativo.

## Hallazgos

### CR-01 — MEDIUM / Should fix / OPEN / blocking yes

Confianza: 5. Owner: frontend_developer.
Dónde: `src/components/resource-list.tsx:29`, `src/components/record-detail.tsx:61`.
Condición: abrir detalle desde lista con búsqueda, archivo, rango o página distinta de 1 y pulsar «Volver».
Efecto: el enlace va a la ruta base, perdiendo filtros/página; el estado persistido en la URL de lista no viaja al detalle. Incumple UX_PLAN §3.
Acción: preservar destino de regreso validado localmente entre lista/detalle/edición, o mecanismo equivalente que reconstruya filtros.
Cierre: E2E filtra/pagina, abre detalle y vuelve conservando URL, controles y registros; validar destino para evitar navegación externa.

### CR-02 — MEDIUM / Should fix / OPEN / blocking yes

Confianza: 5. Owner: frontend_developer.
Dónde: `src/components/record-form.tsx:73`, `src/components/record-form.tsx:151`.
Condición: importe de gasto inválido o error de cliente/descripción/cantidad/precio de pedido.
Efecto: input monetario describe solo la ayuda; errores de líneas/select carecen de IDs/describedby. Un lector puede conocer invalid=true sin el mensaje asociado, incumpliendo NFR-006 y UX_PLAN §5/7.
Acción: IDs estables de ayuda y error y describedby compuesto; asociar cada error textual al control correspondiente, conservar resumen y foco.
Cierre: QA comprueba IDs/relaciones y recorrido teclado de validación; un mensaje de error anunciado o visible globalmente no sustituye asociación de campo.

### CR-03 — MEDIUM / Should fix / OPEN / blocking yes

Confianza: 5. Owner: frontend_developer.
Dónde: `src/components/record-detail.tsx:36`.
Condición: otro dueño edita/archiva/restaura un registro después de abrir detalle; el primer dueño intenta archivo/restauración.
Efecto: CONFLICT limpia intención pero conserva row/version obsoletos sin ofrecer carga vigente. Cerrar y repetir crea otra clave con misma versión antigua y vuelve a fallar; recuperación requiere abandonar o recargar navegador manualmente.
Acción: ofrecer consultar versión actual ante CONFLICT, comunicar cambio de estado y pedir una nueva confirmación antes de una intención basada en versión vigente; no retry automático destructivo.
Cierre: dos sesiones cambian registro; primera recibe conflicto, carga actual y puede confirmar acción válida sin sobrescribir.

### CR-04 — MEDIUM / Should fix / OPEN / blocking yes

Confianza: 5. Owner: frontend_developer.
Dónde: `src/components/record-form.tsx:114`, `src/components/record-form.tsx:148`.
Condición: crear cliente desde formulario principal con nombre/contacto ya existente.
Efecto: guarda inmediatamente sin aviso de posibles coincidencias. InlineClient tiene aviso, pero el flujo principal no cumple UX_PLAN §4 Clientes.
Acción: revisar posibles coincidencias antes de guardar en ambos caminos y permitir continuar explícitamente sin imponer unicidad.
Cierre: QA verifica aviso y continuación permitida desde formulario principal y creación inline, sin perder borrador ni duplicar operaciones por reintento.

### CR-05 — MEDIUM / Should fix / OPEN / blocking yes

Confianza: 5. Owner: cicd_expert.
Dónde: `scripts/qa-restore.mjs:24`, comparado con `scripts/grants.ts:12`.
Condición: restore de dump con --no-owner/--no-acl reconstruye permisos mediante GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES y revoca solo audit.
Efecto: runtime restaurado gana UPDATE de user/activeAccess/account y borrado de negocio; función lock_active_owner queda con EXECUTE PUBLIC por default tras omitir ACL. Login/query pasan con permisos más amplios que implementación original. El ensayo no demuestra recuperación con las fronteras reales.
Acción: reconstruir ownership/grants equivalentes a la operación aprobada, revocar EXECUTE público de función y concederlo explícitamente al runtime; mantener usuario operador separado.
Cierre: rerun restore aislado con login/query y tests de permisos negativos activeAccess/account/borrado de negocio/audit y function grants. No ejecutar restore productivo ni exponer dumps/secretos.

## Proof pendiente y decisión

QA final debe cubrir respuesta perdida después de commit y reintento sin duplicación, conflicto UI con borrador conservado, teclados/errores accesibles y tamaños de formularios/detalles, además de flujos de lista. Revisar resultados reales tras correcciones; no inferir cobertura completa de NFR a partir de nombres de tests. Tipo/lint/build/suites pertinentes deben pasar sobre la versión final.

Las limitaciones cloud y proxy permanecen fuera de validación local. Ninguna revisión autoriza deployment ni afirma producción activa.

## Revalidación de correcciones — estado vigente

CR-01: **CLOSED en revisión de fuente**. Los enlaces de lista transmiten filtros/página en volver; las tres páginas de detalle lo reciben y RecordDetail valida destino de la misma ruta de recurso. Proof E2E queda en QA final.

CR-02: **CLOSED en revisión de fuente**. Campo monetario compone ayuda/error; select y campos de línea referencian IDs de sus mensajes. Proof accesible final sigue en QA.

CR-03: **OPEN por regresión del parche**. Botón Actualizar registro consulta versión vigente y limpia intención, resolviendo el mecanismo original. Sin embargo refresh también borra message: toggle establece «Registro restaurado» y llama refresh, que lo elimina antes de render final. El E2E existente exige esa confirmación. Conservar mensaje de éxito o establecerlo tras refresh; limpiar mensaje específicamente al recuperar conflicto.

CR-04: **OPEN por carrera introducida en preflight**. El aviso principal está implementado, pero submit espera consulta de coincidencias antes de marcar busy/reservar intención. Dos clics mientras la consulta espera inician dos handlers; con resultados vacíos, cada handler genera una clave nueva y guarda un cliente. Reservar una intención o un guard síncrono ref antes del primer await y mantener botón/formulario bloqueados durante preflight; liberar para la confirmación explícita cuando hay coincidencias. Añadir prueba de dos envíos mientras la consulta de coincidencias está retardada y exigir un cliente/una intención.

CR-05: **CORREGIDO EN FUENTE, proof pendiente**. Restore reasigna ownership, revoca EXECUTE PUBLIC de función, ejecuta scripts/grants.ts y comprueba permisos negativos de user/account/borrado de negocio. La evidencia qa-restore-result.json leída todavía corresponde al ensayo anterior y no incluye authAndBusinessLeastPrivilege/functionPublicExecute. Cerrar solo con nuevo resultado de ejecución sobre este script.

Verdict vigente: **Request changes** hasta CR-03/04 corregidos y CR-05 demostrado. QA amplió la suite E2E para teclado real, respuesta perdida después de commit y conflicto de edición; los tests leídos existen, sus resultados finales no se anticipan.

### Segunda revalidación

CR-03: **CLOSED en fuente**. refresh limpia mensaje solo al recuperar conflict; éxito de archive/restore conserva confirmación. La nueva intención se crea tras consulta vigente y exige confirmación.

CR-04: **CLOSED en fuente**. submitting ref se activa síncronamente antes de cualquier await; busy protege inputs durante preflight y finally libera guard incluso al mostrar coincidencias/validación. Un segundo submit concurrente termina antes de consultar/generar otra clave. La confirmación posterior de coincidencias permanece permitida.

Verdict provisional: **Request changes únicamente por proof CR-05 pendiente**. No quedan correcciones de producción conocidas de CR-01..04. Suite final/QA accesible y restore actualizado determinan el cierre; typecheck pasando fue reportado por nexus, no ejecutado por este revisor.

## Revisión final independiente — 2026-09-30

Reviewer: code_reviewer (review_delivery), distinto de frontend_finalize, backend y nexus. Se revisaron directamente el delta Dialog, el script de restore, grants, prueba restored-auth, resultados JSON locales y QA_REPORT final; sin modificar código de producción ni ejecutar DB concurrentemente con QA.

CR-01..04: **CLOSED**. La fuente conserva destino de lista validado, asociaciones de mensajes por campo, recuperación de versión con nueva confirmación y guard síncrono antes de preflight. QA final declara Chromium14/14 en49,4s; `.last-run.json` confirma passed sin fallidos. Los casos inspeccionados ejercen regreso con búsqueda/archived, archive/restore e histórico, envíos rápidos sin cliente extra, conflicto con borrador/comparación conservados, Escape y retorno de foco. Esta evidencia confirma los flujos probados; no equivale a certificar todos los lectores de pantalla o navegadores.

Delta de accesibilidad: Dialog captura el nodo nativo y el opener al montar; cleanup llama close antes de focus, liberando el fondo inert, y verifica isConnected. El ciclo extra de StrictMode vuelve a cerrar/restaurar y abrir sin conservar un modal huérfano. La prueba de conflicto exige explícitamente foco en Comparar cambios tras Escape; pasa sobre el parche final.

CR-05: **CLOSED con proof actualizado**. `.runtime/qa-restore-result.json`, timestamp2026-09-30T19:17:16.834Z, verifica restore aislado en7,80s (7801ms):1000 pedidos/2000 líneas/100 gastos/1101 eventos/1101 claves, cero referencias rotas o totales incorrectos. `auditPrivileges=true`, `authAndBusinessLeastPrivilege=true`, `functionPublicExecute=false`, `restoredLoginAndQuery=true`. Script reasigna ownership al migrador, revoca EXECUTE PUBLIC y aplica el mismo grants.ts que operación normal; pruebas negativas inspeccionadas niegan UPDATE user, INSERT account, DELETE sales_orders y modificación audit. Login, sesión y query se ejecutan realmente contra el destino restaurado con rol runtime; no se afirma validación productiva ni de toda combinación posible de grants.

Arquitectura: la reparación de ARCHITECTURE.md es coherente con REQUIREMENTS, API_DESIGN, DATABASE_DESIGN y ADR0001 en alcance, rutas actuales, admisión con locks, COP exacto, snapshots, archivo, auditoría mínima, idempotencia y recuperación. No introduce catálogo, inventario, roles UI, pagos o despliegue cloud; mantiene Neon/hosting/HTTPS/costes como gate posterior. No se detectó corrupción textual ni deriva material en el delta inspeccionado.

Evidencia final de QA reportada independientemente:29 unitarias y16 integración;14 browser; carga1000 pedidos/5 dueños con p95 local41,85ms consulta/29,69ms guardado; restore exacto anterior. Este revisor inspeccionó resultados y pruebas, no atribuye estas ejecuciones como propias. Typecheck/lint/build finales y comprobación visual corresponden al gate de entrega de nexus; deben constar antes de COMPLETE.

Decisión: **Approve para implementación y arquitectura local revisadas**, sin hallazgos de código bloqueantes abiertos. La revisión no autoriza despliegue productivo ni certifica Neon, proxy/IP, internet o backups externos. SECURITY_REVIEW conserva sus límites operativos independientes. Judge se usó como referencia de criterios; no se declara una ejecución multiengine inexistente.
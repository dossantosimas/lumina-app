# Lúmina — QA evidence

Independent owner: test_generator. Synthetic data only; local Docker `lumina_test`. Never Neon/production. Updated 2026-09-30.

## Scope and execution

Approved REQ-001..009, AC-001..015 and NFR-001..006 traced below. Vitest domain unit tests, PostgreSQL integration, actual Better Auth sessions/Server Actions, Playwright browser flows, service-load proof and isolated backup restoration are distinct evidence levels. Mocking is restricted to Next request headers and server-only packaging in Node tests; database, password verification, sessions, transactions, locks and privilege checks are real.

Current final-run evidence (2026-09-30): unit29 passed; PostgreSQL/auth integration16 passed, including actual operator provisioning, password reset with old sessions revoked, replacement-password admission and access revocation. Final Chromium browser run:14/14 passed in49.4s after producer corrected native-dialog closure/focus return. QA corrected a unit-price locator whose accessible name includes its help text, and awaited saved-detail navigation before capturing its URL. Fresh local load and exact-grant restore both passed.

Fresh load:1000 orders,5 concurrent owners,100 queries and100 saves; query p95 41.85ms and save p95 29.69ms. Environment:Windows,Node22.22.0,Docker PostgreSQL17.11,1CPU/512MiB,local service boundary. Fresh restore:1000 orders/2000 lines/100 expenses/1101 audit events,zero broken references or wrong totals; restored real login/session/query passed. Runtime denied auth-admission updates, identity insertion and commercial-header deletion; audit UPDATE/DELETE/TRUNCATE denied; owner-lock function has no PUBLIC EXECUTE. Recovery completed in7.80s locally, without certifying production RTO.

Browser regression evidence passing: HTTP security headers on login and authenticated summary, two-owner shared data/keyboard form, multiline candle order with85,000 total/customer archival/order archive/restore/history, whole invoice/cancel archive, offline draft protection, real commit plus lost-response retry with DB count1, duplicate-name rapid-submit count2, retained search/archive filter, real login, concurrent-edit conflict with retained draft/comparison/Escape focus return, four main pages at360/768/1280. Windows sandbox prevented clean child-server teardown on the first run; only the exact Next children created by that suite were stopped after all cases ended. The final browser command used approved unrestricted local process handling and exited cleanly with status0.

## Traceability

| Requirements / criteria | Executable evidence |
|---|---|
| REQ-001 AC-001/010 | unit domain input cases; integration multiline order/invalid input/forced-line-failure rollback; E2E multiline candle order |
| REQ-002 AC-002/011 | unit invalid expense; integration entire invoice with optional fields null and invalid expense no rows |
| REQ-003 AC-003 | integration invoice 120000; E2E whole invoice expense |
| REQ-004 AC-004 | integration create/update/query clients; E2E shared client creation and keyboard submit |
| REQ-005 AC-005/013 | auth integration direct anonymous query/action and actual sessions; domain other-owner query; E2E anonymous/private route and two owners |
| REQ-006 AC-006 | independent PostgreSQL retrieval; E2E second browser context retrieves first owner's saved client |
| REQ-007 AC-007 | exact 85000 example, fractional cent arithmetic, multiplication/addition overflow, courtesy and aggregate range unit tests; persisted DB total; E2E displayed/confirmed total |
| REQ-008 AC-008 | integration historical name, archive customer and archived customer queries; E2E customer/order historical links |
| REQ-008 AC-012 | E2E expense archive-dialog cancellation with unchanged amount/active state |
| REQ-008 AC-014/015 | integration archived editing denied, archive/restore history and archived customer retained; E2E archive/restore and history |
| REQ-009 AC-009 | integration inclusive range100000−30000=70000, excludes archived order/out-of-range expense, archived customer does not hide active order |
| NFR-001 | E2E four main pages at360/768/1280 and horizontal overflow assertions; manual root visual review supplements tests |
| NFR-002 | actual anonymous/owner/revoked session queries; disallowed auth endpoints/methods; input:false admission; app audit privileges; owner-lock revocation race |
| NFR-003 | concurrent DB edits one winner/conflict, same-key replay unchanged version; browser two-owner edit conflict preserves draft/comparison |
| NFR-004 | simultaneous idempotency/mismatch; rollback header/lines/audit/idempotency; browser offline draft preservation and aborted response after real commit→same-key retry→DB count1 |
| NFR-005 | `npm run qa:load`:1000 multiline orders,5 concurrent owners,100 query +100 save measurements; local service boundary explicitly excludes internet/browser/network latency |
| NFR-006 | browser real Tab through labeled fields, Enter submit, Escape conflict comparison and focus return; UI review needed for all keyboard paths/contrast/zoom/assistive tools |

## Recovery and reproducibility

Commands: `npm run test`, `npm run test:integration`, `npm run test:e2e`, `npm run qa:load`, `npm run qa:restore`; all package scripts exist and were executed. Integration/load use validated local database name; no QA command accepts production implicitly. Load clears only synthetic domain tables in lumina_test and retains1000 orders for restore. Run integration before load; do not run suites concurrently against the same test database.

Restore dumps into memory, creates a separate `lumina_restore_test`, applies migrations' exact least-privilege grant script and explicit function ownership/PUBLIC revocation, then verifies counts, references, totals, audit retention, role privileges and actual restored Better Auth login/session/domain query. Temporary database is dropped after proof. No dump or credential is logged. Results remain in ignored `.runtime/qa-load-result.json` and `.runtime/qa-restore-result.json`.

## Limits

No production hosting, Neon compatibility, public internet response time, external backup storage, contractual RPO/RTO or human usability study is certified by local tests. UX targets≤2min/≤30s remain proposed until observation with an owner. Automated browser execution supplements root's interactive visual QA. Source/app modifications belong to implementers; QA reports failures for correction and reruns applicable checks.

## Independent verdict

AC-001..015: PASS for the local behavior mapped above. AC-002's optional-field partition uses a120000 invoice rather than its50000 illustrative amount; exact money and optional-null persistence are independently asserted. NFR-002..004: PASS. NFR-005: PASS at the measured local service boundary. NFR-001 and NFR-006: automated cases PASS; complete visual/form-detail/keyboard-path assessment belongs to nexus's separate browser review and is not inferred from these14 cases. No automated functional failure remains. Local release verdict: CONDITIONAL on that visual review and final independent source/security/build closure. Production verification remains outside this delivery.

Expected-value provenance: approved REQUIREMENTS acceptance examples provide85000 and70000 totals; PostgreSQL independently checks restored sums/references/privileges; replay/version and archive/restore are state-transition invariants, including concurrent writes and revocation races. No coverage percentage or mutation score is claimed. CODE_QUALITY_GATE for QA changes: focused tests and synthetic fixtures, secrets withheld, DB target guarded, readable contract assertions, runtime cases reproducible; SEC:pass for these QA changes.

## Cierre de gates por nexus — 2026-09-30

Revisión visual interactiva final de login, resumen, cliente/pedido/gasto y detalle en anchos360/768/1280; reflujo de pedido320 sin overflow. Tab mueve foco Nombre→Contacto; errores de pedido/gasto/cliente tienen mensaje asociado; Escape en Crear cliente cierra modal y devuelve foco al disparador. Capturas verificadas en qa-visual. Las capturas full-page con artefactos del capturador se recapturaron como viewport visible y se contrastaron con geometría DOM. Zoom nativo200% y lectores de pantalla adicionales UNVERIFIED, sin certificación WCAG completa.

Code/security reviews independientes Approve; npm ci/typecheck/lint/test29/build final PASS después del parche Dialog. Docker recuperado reversiblemente; PostgreSQL Healthy y datos sintéticos sobreviven al reinicio (1002pedidos/2004líneas/103gastos). Base comercial vacía. Gates locales cerrados; la condición del veredicto QA anterior queda satisfecha con esta evidencia separada del orquestador. Producción y estudio con dueños no certificados. Ver DELIVERY.md.

## Delta LUM-11 — evidencia final

REQ-010 / AC-016 verified: primera cuenta desde navegador en localhost y cierre permanente; nueva UI1/1, integración completa22/22 y regresión navegador14/14 PASS sobre app compilada. Typecheck/lint finales incluyen nuevos archivosQA; build appPASS. Bases temporales guardadas por nombre/origen y eliminadas al terminar; servidoresQA3001/3002 cerrados, app real3000 conserva acceso inicial sin cuentas ficticias. Responsive360/768/1280, errores/foco/contraseña/espera, creación y login real PASS. Security/Code Approve y cierre QA en INITIAL_SETUP_REVIEW.md. Evidencias y comandos reproducibles en INITIAL_SETUP_QA.md.


## Mejoras entregadas — 2026-10-01

Estado COMPLETE para ampliación autorizada: catálogo sin inventario, cliente/productos buscables, pedido compacto, listados claros y evolucion descriptiva exacta con tres colores. Analytics Reporter importado existente y fijado; fuente/licencia en framework/agents/analytics/analytics_reporter/SOURCE.md. Marca y arquitectura conservadas; snapshots previos no recalculados, migración aditiva/grants locales aplicados.

Verificación independiente:37unitarias/29integracion PASS;23suite completa Chromium mas toque1 y gráfica negativa1 PASS (25escenarios distintos). Typecheck/lint/build finales PASS. Reviews [codigo/seguridad](IMPROVEMENTS_REVIEW.md) y [UX](IMPROVEMENTS_UX_REVIEW.md) APPROVE. [QA](IMPROVEMENTS_QA.md) detalla evidencia y limites de emulación/tecnologias asistivas. Capturas sintéticas en docs/qa-visual/improvements-*-viewport-*.png.

Restauración exacta QA7.922s:14productos/7pedidos/15lineas/6gastos, cero referencias rotas/subtotales incorrectos. Login y consultas protegidas de conteos originales, incluidos archivados, permisos runtime/operador/audit y bootstrap cerrado PASS. Harness comparado con fuente real sintética, sin depender del antiguo requisito1000registros de la carga. Evidencia ignorada .runtime/qa-restore-result.json. Nunca prueba/restauración sobre negocio real o Neon.

Servidor localhost3000 actualizado y corriendo; pruebas3001 cerradas. Para empezar: registrar presentaciones en /productos/nuevo, luego seleccionar cliente/productos en /pedidos/nuevo. Precios/descripciones del pedido siguen editables. Producción conserva dependencias previas fuera de esta iteracion.

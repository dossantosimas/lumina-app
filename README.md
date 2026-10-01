# Lúmina

Aplicación privada para registrar clientes, productos, pedidos de varias velas y gastos completos en COP. Los dueños comparten datos y permisos desde un navegador en celular, tablet o computador, con internet.

Instala las dependencias fijadas con `npm.cmd ci`. La preparación completa está abajo; los resultados de validación se mantienen en [QA_REPORT](docs/QA_REPORT.md) y [PROJECT_STATUS](docs/PROJECT_STATUS.md).

## Preparación local en Windows

Necesitas Node.js 22.22.x, npm ≥10.9.4 y Docker Desktop con motor iniciado. PostgreSQL 17.11 corre en Docker; producción utiliza Neon y Vercel.

Desde PowerShell:

```powershell
Set-Location 'C:\Users\dossa\Desktop\Projects\ia\lumina-app'
npm.cmd ci
npm.cmd run env:init
npm.cmd run db:up
npm.cmd run db:bootstrap
npm.cmd run db:generate
npm.cmd run db:migrate
npm.cmd run db:grants
npm.cmd run db:migrate:test
npm.cmd run db:grants:test
```

`env:init` genera credenciales aleatorias en archivos locales ignorados por Git. Una segunda ejecución conserva un conjunto completo existente; si faltan archivos se detiene para evitar sobrescribir credenciales. `db:bootstrap` prepara las bases `lumina` y `lumina_test` y sus roles separados. Docker publica PostgreSQL exclusivamente en `127.0.0.1:55432` por defecto.

Inicia la aplicación con `npm.cmd run dev`. Para la primera cuenta local, abre [Crear primera cuenta](http://localhost:3000/configuracion-inicial), también disponible desde login. Introduce nombre, correo y contraseña con confirmación. Tras la creación, inicia sesión; la configuración se cierra permanentemente. Funciona solo con origen local, no se habilita automáticamente en producción externa. Validación LUM-11 en PROJECT_STATUS.md.

Para crear otras cuentas autorizadas desde terminal interactiva:

```powershell
npm.cmd run auth:operator -- provision
```

El operador pide verificar identidad, nombre/correo y contraseña oculta con confirmación. No pases contraseñas por argumentos. También puedes crear tu cuenta sin invitación desde [Registro local](http://localhost:3000/registro) o [Registro en producción](https://lumina-app-sepia.vercel.app/registro). Todas las cuentas nuevas reciben acceso a los datos compartidos. No hay cuenta predeterminada ni credenciales reales incluidas.

Si el launcher `npm.ps1` falla, usa `npm.cmd` como arriba. Si no está en PATH, invócalo con `& 'C:\Program Files\nodejs\npm.cmd'` y los mismos argumentos.

## Uso

- **Clientes:** registrar nombre, contacto/notas opcionales, buscar, editar, archivar y restaurar. Nombres repetidos están permitidos.
- **Productos:** registrar cada presentación con nombre y precio COP; descripción opcional, búsqueda, edición y archivo/restauración. En celular se encuentra en Más. No administra existencias.
- **Pedidos:** buscar y seleccionar cliente en un campo, elegir productos o escribir líneas personalizadas, ajustar cantidad/descripción/precio para ese pedido. El total se calcula exactamente; cambiar catálogo no altera el histórico.
- **Gastos:** registrar fecha, concepto y total de una compra/factura; proveedor y referencia son opcionales. No necesita desglose ni adjunto.
- **Resumen:** consultar pedidos registrados, gastos y diferencia por rango inclusivo, con gráfica diaria/mensual y tabla exacta. Verde pedidos, rojo gastos, marrón diferencia. La diferencia no representa utilidad contable ni dinero cobrado.

Los importes de entrada usan dígitos y coma decimal, sin puntos de miles: `25000,50`. Archivar conserva relaciones/historial y permite restaurar; los pedidos/gastos archivados salen de los resúmenes. Ante un guardado incierto, comprueba/reintenta la misma operación antes de crear otra. Los borradores viven en la pestaña y desaparecen al cerrar sesión o la pestaña.

## Validación y operación

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test
npm.cmd run test:integration
npx.cmd playwright install chromium
npm.cmd run test:e2e
npm.cmd run qa:load
npm.cmd run qa:restore
npm.cmd run build
```

Ejecuta los comandos con base de pruebas preparada y en este orden; integración/carga/E2E modifican datos sintéticos de `lumina_test`, así que no se ejecutan simultáneamente. E2E usa puerto 3001; `qa:load` deja 1.000 pedidos sintéticos para la restauración aislada. No se prueban cuentas/datos productivos. Consulta la evidencia real y sus límites en [QA_REPORT](docs/QA_REPORT.md).

Para arrancar el build local usa `npm.cmd run start`. Para detener la DB conservando su volumen usa `npm.cmd run db:stop`. La recuperación, acceso de operador y condiciones productivas están en [RUNBOOK](docs/RUNBOOK.md).

## Arquitectura y límites

Next.js/React/TypeScript en Node → servicios privados → Prisma/PostgreSQL. Better Auth administra sesiones; todas las queries/actions comprueban admisión activa. Pedidos/líneas, total, versión, auditoría e idempotencia confirman en una transacción. [Stack](docs/TECHNOLOGY_STACK.md), [arquitectura](docs/ARCHITECTURE.md), [datos](docs/DATABASE_DESIGN.md) y [contratos](docs/API_DESIGN.md) documentan las decisiones.

Sin inventario, pagos pendientes, cobro en línea, adjuntos, emisión fiscal, tienda pública ni modo offline. El servidor local no permite uso compartido por internet. Producción necesita hosting Node, HTTPS/URL, Neon configurado y credenciales/costes/backups acordados; no se ha desplegado ni contratado un servicio.

Documentación elaborada mediante doc_generator/quill del framework. Revisión independiente y gates de entrega se registran en PROJECT_STATUS; este README no certifica por sí mismo que todos los checks hayan pasado.



Mejoras autorizadas 2026-10-01: [plan](docs/IMPROVEMENTS_PLAN.md), [review independiente](docs/IMPROVEMENTS_REVIEW.md) y [QA independiente](docs/IMPROVEMENTS_QA.md). Para empezar, abre http://localhost:3000/productos/nuevo y registra tus presentaciones antes de seleccionarlas en pedidos. El catálogo inicial queda vacío: no se inventan productos a partir de pedidos antiguos.

# LUM-11 — revisión independiente de primera cuenta local

Reviewer: instancia independiente `initial_access_review`, recursos existentes `quality/security_auditor.toml`, `quality/code_reviewer.toml` y skills `review`/`sentinel` del inventario. No produjo ni modificó implementación. Alcance: delta LUM-11 autorizado por el usuario; revisión estática de frontend, actions, servicio, migración, grants, restauración y pruebas.

## Security review

Verdict: Approve — fuente final revisada y ambos hallazgos cerrados. Gate QA independiente cerrado con evidencia leída en INITIAL_SETUP_QA.md.

| ID | Severidad / confianza | Evidencia y efecto | Acción / criterio de cierre | Estado |
|---|---|---|---|---|
| IS-01 | High / 5 | La primera versión de `src/server/initial-setup.ts` comprobaba Origin pero omitía Host. El wrapper público no cumplía el gate exacto requerido para acceso local. | Comprobar Host exacto del origen configurado, X-Forwarded-Host si existe y protocolo; pruebas negativas del wrapper. | CLOSED. Gate estricto y prueba Server Action para host ausente/externo, forwarded-host discrepante y forwarded-proto https. Productor reporta seis pruebas nuevas PASS; fuente revalidada por reviewer. |
| IS-02 | High / 5 | `scripts/qa-restore.mjs` restauraba sin ACL/owner y solo reparaba `lock_active_owner`. Nuevas funciones bootstrap podían recuperar EXECUTE PUBLIC y propietario postgres. | Reasignar las cuatro funciones bootstrap al migrador, revocar PUBLIC y reaplicar whitelist; demostrar ensayo restore nuevo con cierre persistente y permisos. | CLOSED. Bucle explícito de cinco funciones y asserts de PUBLIC, propietario migrador, latch cerrado, runtime sin SELECT/UPDATE marker y operador sin UPDATE. Evidencia restore actualizada leída: todos flags correctos. |

Controles leídos: origen configurado HTTP loopback exacto; no modo productivo externo; Origin obligatorio; Host/X-Forwarded-Host/protocolo fail closed. Schema estricto sin campos de admisión, contraseña12..128 y confirmación. Import oficial `better-auth/crypto.hashPassword`; formato comprobado contra paquete instalado `@better-auth/utils/dist/password.node.mjs`, sin nuevo algoritmo ni dependencia. Reserva SQL global5/min antes del hashing. Errores sanitizados sin cuerpos/secretos.

Migración: singleton privado con cierre durable, bootstrap inicialmente cerrado ante cualquier user/account existente; triggers BEFORE INSERT para CLI; lock de fila antes de crear user/credential y cerrar dentro de una única sentencia/transacción. Borrado/revocación no abre el marker. Funciones SECURITY DEFINER con search_path fijo y relaciones public explícitas; EXECUTE PUBLIC revocado. Runtime conserva user/account SELECT únicamente, recibe tres EXECUTE limitados y ningún permiso del marker. Signup Better Auth permanece disableSignUp/allowlist.

No cuentas reales, secretos o bases productivas usados por el reviewer. La funcionalidad permite a la primera persona con acceso al servidor local registrar la cuenta; el servidor npm dev/start está ligado a127.0.0.1. No se considera un onboarding productivo ni protege frente a procesos hostiles ya ejecutados en la misma máquina.

## Code review

Verdict: Approve — sin defectos bloqueantes conocidos en la fuente final. QA independiente PASS; esta aprobación no acredita despliegue productivo.

Frontend: página force-dynamic y redirect al login si no disponible; enlace contextual del login. Formulario con etiquetas, errores asociados por aria-describedby, foco al primer campo inválido, contraseñas ocultas/new-password, confirmación, guard ref síncrono y disabledbusy. Éxito limpia formulario y navega a `/login?cuenta=creada` sin PII/contraseñas en URL; CLOSED limpia borrador y no permite repetir. Transporte incierto explica probar login antes de repetir; servidor decide el único ganador.

Prueba integración leída: DB temporal aislada que rehúsa sobrescribir una existente y solo elimina una base creada por su propia ejecución; concurrencia web con una identidad/credential; login real Better Auth y signup denegado; revocación/eliminación permanecen cerradas; identidad CLI inactiva cierra; runtime no puede escribir user/account/marker; PUBLIC sin EXECUTE; fallo account revierte user/marker; CLI compite bajo trigger/lock; bucket5/min. Tests del wrapper leen Host/forwarded headers inválidos y evitan tocar identidades. La carrera permite cuenta adicional por CLI autorizada si web gana primero, comportamiento válido: CLI sigue disponible para otros dueños, bootstrap solo concede una primera cuenta.

## Proof y límites de la aprobación

- Orquestador reporta typecheck/lint/build y29 pruebas unitarias PASS sobre fuente final. QA independiente, reporte leído INITIAL_SETUP_QA.md:22/22 integración PASS,14/14 regresión navegador PASS,1/1 primera cuenta UI real PASS, typecheck/lint exit0. Este reviewer no ejecutó las pruebas; revisó su fuente y evidencia aportada.
- Fuente wrapper negativa y flujo real positivo revisados; DB indisponible devuelve available=false o error sanitizado por catch. QA prueba creación mediante POST real y login bajo build Next start en puerto3002 con DB temporal exclusiva.
- Archivo `.runtime/qa-restore-result.json` leído: 2026-09-30T20:21:56.704Z, duración7533ms, initialSetupClosed=true, functionOwnershipMigrator=true, functionPublicExecute=false, auditPrivileges=true, authAndBusinessLeastPrivilege=true, restoredLoginAndQuery=true; relaciones/totales sin errores. Implementación de cada assert revisada.
- QA independiente PASS: enlace inicial, registro atómico de una identidad, login hasta/resumen, desaparición del enlace y redirect de URL setup anónima tras alta; contraseña/error/foco/teclado y anchos360/768/1280 sin overflow. POST pausado comprueba botón disabled, aria-busy y ausencia de éxito anticipado. Base temporal eliminada, ninguna cuenta creada en lumina real. Límites de accesibilidad y producción documentados en INITIAL_SETUP_QA.md.
- README/RUNBOOK describen la primera cuenta local, cierre permanente y CLI para cuentas posteriores. Allowlist y disableSignUp intactos; imports web usan solo db runtime y Better Auth crypto, sin instancia operador ni credenciales migrador.

Revisión independiente final sobre la fuente corregida. No quedan Must fix/Should fix abiertos. Gate QA incorporado y cerrado; el orquestador puede actualizar estado y entrega. Una regresión o cambio de fuente posterior obliga a revisar el delta.


Production bootstrap extension 2026-10-01: independent code_reviewer/security_auditor APPROVE (production_signup_review). Server-only INITIAL_SETUP_TOKEN64hex gates exactHTTPS origin; constant-time hashed comparison, strict payload, unchanged DB latch/rate/concurrency and generic signup disabled. No elevated runtime grant. Scope first owner only. Header valid path/invalid token tested without writes; fixture registration/login only isolatedDocker.

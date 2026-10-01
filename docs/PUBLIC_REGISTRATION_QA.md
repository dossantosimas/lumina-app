# Registro libre — LUM-21

Autorización: el usuario pide registro sin invitación y confirma explícitamente «si todas las cuentas tienen acceso a todo». Sustituye las restricciones anteriores de primera cuenta exclusiva. No hay aprobación manual ni roles diferenciados.

Implementación: /registro y enlace Crear cuenta en login; nombre/correo/password12..128/confirmación. Origen HTTPS canónico o HTTP loopback exacto, comprobación host/proxy/origin, esquema estricto sin admisión controlada por navegador. Alias redirige al dominio canónico. Better Auth calcula y verifica contraseñas; signup genérico sigue cerrado. Dos funciones SECURITY DEFINER con search_path fijo, PUBLIC EXECUTE revocado y permisos runtime estrechos. La creación user/account es atómica, correo normalizado único, activeAccess verdadero. Tabla del límite sin permisos runtime: cinco intentos válidos por minuto global, antes del hash. Esta cuota puede retrasar otras altas si se consume; esperar un minuto.

Revisión independiente production_signup_review usando recursos code_reviewer/security_auditor del framework: APPROVE sin bloqueantes dentro del alcance autorizado. Imports sobrantes identificados y corregidos antes de lint final.

Validación 2026-10-01: typecheck y lint limpios; 37 unitarias y 35 integración PostgreSQL PASS; build optimizado PASS. Integración dedicada en lumina_registration_test aislada: dos cuentas activas y login Better Auth, origen/payload/host denegados, carrera de correo duplicado, fallo inducido con rollback completo, privilegios mínimos y PUBLIC ACL, cuota persistente. Base eliminada al terminar.

Navegador Chromium en lumina_initial_setup_e2e aislada: primera cuenta local, cierre durable, enlace /registro, segunda cuenta sin código ni invitación, login y Resumen, dos dueños activos PASS. Formulario sin overflow en360/768/1280; capturas docs/qa-visual/registro-*.png. 1 escenario compuesto PASS, 4.7s de assertions; teardown Windows requirió cerrar solo servidor QA3002 identificado, limpieza de base completada. No se crearon cuentas sintéticas en lumina ni Neon.

Publicación y smoke HTTPS: pendientes. No se reutilizan contraseñas de prueba ni se transfieren cuentas locales.

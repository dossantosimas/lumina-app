# Lúmina — Risks

Registro del blueprint aprobado el 2026-09-30. Autor: project_manager; integración: nexus y security review. Código local auditado en SECURITY_REVIEW.md/CODE_REVIEW.md; validación vigente en QA_REPORT.md. Producción y servicios externos sin activar.

| ID | Categoría | Riesgo | Impacto | Probabilidad | Mitigación / criterio de cierre |
|---|---|---|---|---|---|
| R-01 | Technical | Versiones Next/Prisma/Auth incompatibles | Alto | Media | LUM-01 verifica conjunto soportado; lockfile, instalación, tests y build reproducibles |
| R-02 | Technical | Reintentos o carreras duplican registros o alteran totales | Alto | Media | Transacción, clave persistida, versión y locks; tests simultáneos/fallo parcial/replay |
| R-03 | Security | Identidad Auth se admite sola o acceso revocado sigue escribiendo | Alto | Media | activeAccess false/input:false, allowlist web, CLI aislada y lock/recheck admisión; pruebas negativas/concurrentes |
| R-04 | Security | Secretos/datos privados quedan en Git/logs/audit redundante | Alto | Media | Prompt oculto, logs mínimos, audit sin contacto/notas, resultados idempotentes mínimos, backups cifrados y credenciales separadas |
| R-05 | Dependency | Docker/runtime/navegadores no disponibles | Medio | Media | Inspección temprana; Docker es entorno elegido por usuario, registrar bloqueo y resolver instalación autorizada si falta, sin sustitución automática |
| R-06 | Operational | Pérdida DB sin copia recuperable | Alto | Media | Dump custom y restore aislado antes entrega; copia externa cifrada diaria/7 días antes producción; objetivo RPO24h/RTO4h propuesto |
| R-07 | Operational | Entrega local no proporciona acceso compartido por internet | Alto | Alta sin hosting | Guía de deploy y dependencia explícita Node/DB/HTTPS/URL/cuentas/backup; no presentar localhost como servicio productivo |
| R-08 | Business | Diferencia registrada se interpreta como utilidad o dinero cobrado | Medio | Media | Etiqueta y explicación junto valor; sin pagos/contabilidad; verificar copia UX |
| R-09 | Business | Historial/conflictos añaden fricción | Medio | Media | Acciones secundarias, mensajes breves, conservar borrador; recorrido observado cuando dueño participe |
| R-10 | Cost | Hosting y backups exceden presupuesto no declarado | Medio | Desconocida | No contratar ni asumir gratuidad; comparar costes antes activar producción y resolver decisión comercial necesaria |
| R-11 | Security | Historia conserva datos privados indefinidamente | Medio | Media | Registro mínimo protegido; no contacto/notas históricos; misma admisión; no purga automática que rompa replay; revisar retención al cambiar alcance |

Hallazgos de revisión y resolución se registran en BLUEPRINT_REVIEW.md. Los controles aquí son compromisos de diseño; requieren pruebas posteriores a aprobación. No se afirma cumplimiento fiscal/legal ni seguridad certificada.

## Neon seleccionado, sin activación (2026-09-30)
Riesgos técnicos: DB cloud/latencia y autosuspensión, agotamiento de pool, URL privilegiada expuesta, diferencias de versión/grants y restore window insuficiente. Mitigación: contrato TECHNOLOGY_STACK con Prisma PG TCP pooled runtime, direct operador/migración/backups, roles separados, TLS, misma major compatible Docker/Neon y staging sintético autorizado tras gate. Nunca pruebas en producción. Cuenta/plan/backup externo y hosting Node requieren autorización; no asumir gratuidad, backup de siete días ni SLA. Esta preferencia no aprueba blueprint.


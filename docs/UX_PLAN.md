# Lúmina — UX Plan

Estado: APPROVED — diseño y blueprint aprobados explícitamente el 2026-09-30; implementación mediante lifecycle.
Fecha: 2026-09-30, America/Bogota. Autor: uiux_designer. Revisión: nexus y QA/producto independientes.

## 1. Usuarios, alcance y evidencia

Los dueños registran pedidos de velas, clientes y gastos de materiales. Comparten los mismos permisos y trabajan con internet en celular, tablet y computador. Moneda: COP. Las decisiones de pantalla y campos siguientes concretan ese núcleo para el blueprint; no son respuestas adicionales del usuario.

No hay inventario, pagos pendientes, cobros, adjuntos ni facturación fiscal. Cada línea describe libremente lo que pidió el cliente. Una factura completa se registra como un gasto con su total, sin desglosar materiales. El resumen muestra importes registrados, no utilidad contable ni saldo de caja.

Base: intake del proyecto, brief y requisitos en cierre por nexus. Se aplican uiux_designer, vision en modo NEW_PRODUCT y frontend-design-pro. Se consultó el buscador local de frontend-design-pro: la búsqueda inicial orientó densidad operativa y filtros; la búsqueda de marca del 2026-09-30 sugirió hero, animación abundante, negro/blanco y tipografía lúdica. Esas recomendaciones genéricas no se adoptan porque las referencias reales y el registro cotidiano exigen marfil/oro, lectura estable y formularios breves. No se realizó investigación con usuarios; los objetivos de usabilidad son criterios de validación propuestos, no resultados medidos.

## 2. Dirección visual y alternativas

Actualización 2026-09-30: el usuario entregó cuatro referencias de la marca Lúmina. Se conserva el símbolo de llama, el nombre con tilde y la identidad marfil/dorado/marrón existente; no se redibuja, recolorea ni genera un logo. Los HEX de interfaz son una interpretación funcional de esas referencias, no colores oficiales extraídos ni una nueva identidad. Esta propuesta sigue dentro del blueprint pendiente de aprobación.

### Vision Design Direction: Lúmina

Resumen: una herramienta de registro con superficies marfil, texto marrón y pequeños acentos dorados. La marca aparece en la navegación y el acceso; pedidos, clientes e importes mantienen la jerarquía principal durante el trabajo.

Principios: preservar la marca suministrada; facilitar registros repetidos con controles estables y poco adorno; separar el oro decorativo de los colores funcionales para conservar contraste. Las referencias muestran serif en LÚMINA, llama dorada y soportes marfil o blancos: esa es la evidencia visual, sin atribuir una fuente exacta o resultados de investigación.

| Dirección | Concepto, ventaja y compromiso | Criterio propuesto |
|---|---|---|
| Registro mínimo | Blanco cálido, nombre pequeño y oro limitado al símbolo. Máxima densidad, menor presencia de marca. Para consultas frecuentes. | Localizar un pedido por cliente en ≤ 30 segundos. |
| Cuaderno equilibrado, recomendada | Marfil, símbolo dorado, nombre serif y controles marrón/dorado oscuro. Une las referencias artesanales con filas y formularios legibles; tiene algo más de espacio que el registro mínimo. Para el trabajo cotidiano de los dueños. | Registrar un pedido de dos líneas en ≤ 2 minutos, sin ayuda, con cliente existente. |
| Taller editorial | Marfil amplio, titulares serif más destacados y logo completo en acceso. Refuerza la presentación de marca, pero muestra menos registros y alarga formularios móviles. Para una presencia visual más expresiva. | Encontrar «Nuevo pedido» en ≤ 5 segundos. |

Las tres alternativas conservan exactamente las mismas funciones y exigen texto normal ≥ 4,5:1, controles ≥ 3:1 y foco visible. Se recomienda **Cuaderno equilibrado** porque representa la marca recibida sin restar espacio a las líneas de un pedido ni a los controles cotidianos. Los tiempos son objetivos para validar, no resultados medidos.

| Composición | Decisión y motivo |
|---|---|
| Primer viewport operativo | Nombre, destino actual, acción y consulta visibles; sin hero, fotografía de etiqueta ni gran logo encima de los datos. |
| Acceso | Símbolo y nombre sobre el formulario; el logo completo es alternativa opcional en una superficie blanca compatible. |
| Contenedores | Separar secciones con espacio y líneas; no envolver cada fila en tarjetas anidadas. |
| Detalle distintivo | Llama real y pequeño acento dorado decorativo, sin texturas metálicas en campos o fondos. |
| Movimiento | Solo cambios de estado breves; sin parallax, brillo animado o transiciones que demoren el registro. |

### Referencias y uso de archivos

Las copias documentales preservan íntegramente los originales y su proporción. Los enlaces siguientes son relativos a este documento; el traslado a recursos de la aplicación se hará después del approval gate. No se han producido derivados, recortes ni vectores.

| Archivo | Fuente aportada | Uso y límite |
|---|---|---|
| [Símbolo PNG](brand-assets/lumina-symbol.png) | «Imagen de ChatGPT 28 sept 2026, 12_53_24 p.m..png», Downloads | Recurso principal para navegación y acceso. PNG 1262 × 1246 con canal alfa real. Caja de 40 × 40 CSS px en encabezado móvil/tablet, 48 × 48 en barra lateral, 88 × 88 en acceso; imagen contenida y proporción intacta. El área táctil del enlace de marca debe ser al menos 44 × 44, aunque la imagen mida 40. |
| [Logo completo](brand-assets/lumina-logo-full.jpeg) | «WhatsApp Image 2026-09-04 at 5.11.20 PM.jpeg», carpeta 01 Imagenes | Llama, LÚMINA y CANDLE STUDIO sobre blanco, JPEG 1078 × 1460. Opcional solo en acceso con fondo blanco compatible y proporción contenida; su margen amplio impide usarlo como logo pequeño de encabezado. No transparencia ni SVG. Usarlo como alternativa al conjunto símbolo/nombre, sin duplicar ambos. |
| [Etiqueta de referencia](brand-assets/lumina-label-reference.jpeg) | «WhatsApp Image 2026-09-03 at 2.45.54 PM.jpeg», carpeta 01 Imagenes | Referencia de marfil, oro y tipografía de empaque. JPEG 896 × 1199; la cuadrícula gris forma parte de los píxeles, no representa transparencia. No usar como logo, fondo ni contenido de la app. |
| [Wordmark de referencia](brand-assets/lumina-wordmark-reference.jpg) | «logo-rectangulo-titulo.jpg», carpeta 01 Imagenes | Referencia de nombre serif y combinación marfil/dorado/marrón. JPEG original 2048 × 2048, fotografiado con margen y sombra. No tratar como wordmark vectorial ni estirar o colocar la foto completa en navegación. |

Encabezado: símbolo junto al nombre textual «Lúmina», con serif similar en carácter y tamaño legible. Esa composición no reemplaza ni pretende reproducir el wordmark original. Para lectores de pantalla, el enlace de marca tiene nombre «Lúmina» y el símbolo junto al texto es decorativo con alternativa vacía; el logo completo usado solo lleva alternativa «Lúmina Candle Studio». La llama no sustituye las etiquetas de navegación o acciones. No es necesario pedir una nueva imagen para continuar el blueprint; si después se entrega un SVG auténtico se evaluará como sustituto del recurso sin inventarlo.

### Tokens propuestos

| Token semántico | Valor / uso |
|---|---|
| fondo | #F7F2E8, página marfil |
| superficie | #FFFCF6, formularios y listas |
| superficie-logo | #FFFFFF, solo cuando se use el logo JPEG blanco |
| superficie-suave | #EFE5D2, seleccionados y agrupaciones |
| texto | #34291F, texto principal |
| texto-secundario | #71634F, fechas, ayudas y metadatos |
| oro-decorativo | #C79A43, acentos de marca sin significado funcional |
| primario | #75541D, acción principal y enlaces subrayados |
| primario-hover | #614516, hover y pressed de acción principal |
| sobre-primario | #FFFFFF |
| borde-control | #93826A, contorno visible de inputs |
| separador | #DDD2C6, divisiones no interactivas |
| foco | #1E5A74, anillo exterior de 3 px con separación de 2 px |
| éxito | #285A3D, texto más icono de confirmación |
| error | #9A2828, texto más icono y campo asociado |
| aviso | #75541D, texto más icono sobre superficie clara |

Una fuente única de tokens para todo el frontend; si se exportan como JSON, usar estructura DTCG con tipos y referencias. Oro decorativo no se usa para texto de ayuda, borde de control, foco, estado ni fondo de botón con texto blanco. Los HEX de UI no recolorean el PNG original.

Contraste calculado el 2026-09-30 mediante luminancia relativa sRGB: convertir canales a rango 0..1, linealizar con umbral 0,04045, aplicar pesos 0,2126/0,7152/0,0722 y dividir (L más clara + 0,05)/(L más oscura + 0,05). Resultados a dos decimales calculados con PowerShell; comparaciones contra umbrales del objetivo WCAG, no certificación de la interfaz ni evaluación de las imágenes con degradados.

| Combinación | Ratio | Uso permitido en esta propuesta |
|---|---|---|
| texto / fondo; texto / superficie | 12,69:1; 13,83:1 | Texto normal |
| texto-secundario / fondo; / superficie | 5,23:1; 5,70:1 | Ayudas y metadatos normales |
| sobre-primario / primario | 6,90:1 | Texto normal del botón principal |
| sobre-primario / primario-hover | 8,86:1 | Texto normal en hover/pressed |
| primario / fondo; / superficie | 6,19:1; 6,74:1 | Enlaces y texto de aviso, con señal adicional |
| primario / superficie-suave | 5,53:1 | Etiquetas de navegación seleccionada |
| borde-control / fondo; / superficie | 3,34:1; 3,63:1 | Contornos de control; no texto normal |
| foco / fondo; / superficie | 6,79:1; 7,40:1 | Anillo exterior con separación clara |
| éxito / superficie; error / superficie | 7,83:1; 7,57:1 | Mensajes normales más icono/texto |
| oro-decorativo / fondo | 2,31:1 | Solo decoración, no señal necesaria para operar |
| blanco / oro-decorativo | 2,58:1 | No permitido para texto de botón |

Verificar en implementación cada combinación efectiva normal, hover, pressed, selected, error, focus y disabled, incluidas superficies distintas a las calculadas. Disabled conserva una señal textual y nunca sirve como único indicador de error. Los separadores decorativos no se usan para delimitar controles.

- Tipografía de marca/títulos: pila serif local `Georgia, Cambria, serif`, elegida por afinidad formal con las referencias, sin afirmar que sea la fuente original. Nombre 24/30 px en encabezado; h1 28/34 px. Formularios, botones, listas y números usan `system-ui, Segoe UI, sans-serif`; sección 20/28, cuerpo y controles 16/24, metadatos 14/20. Precios, totales y datos alineados con cifras tabulares. No descarga de fuentes requerida.
- Espacios: 4, 8, 12, 16, 24 y 32 px. Márgenes móviles 16 px, desktop 24–32 px. Radios de 8 px en controles y 12 px en contenedores; elevación solo en menús/diálogos.
- Iconos: una misma familia de trazos, 20 px, siempre acompañados por nombre cuando la acción sea importante. Ninguna acción depende de emoji.
- Movimiento: cambio de estado 120–180 ms, sin animación decorativa; respetar preferencia de movimiento reducido. La interacción no espera una animación.
- Voz: directa, cálida, breve, precisa y cotidiana. Evitar grandilocuencia, jerga técnica, tutoría permanente, humor en errores y afirmaciones contables.

Prioridad después de aprobación: frontend_developer implementa primero tokens, composición de marca y navegación, luego controles monetarios y formularios con todos sus estados. uiux_designer revisa proporción del logo y lectura en tamaños reales; code_reviewer y test_generator aportan revisión independiente y QA. Esta adaptación no añade pantallas, campos, permisos ni flujos.

## 3. Navegación y composición adaptable

Cuatro destinos: **Resumen**, **Pedidos**, **Clientes**, **Gastos**. Se conserva filtro, búsqueda y página al volver de un detalle. La cuenta y «Cerrar sesión» viven en el encabezado; no hay selector de roles, configuración avanzada ni registro público.

| Ancho de validación | Comportamiento |
|---|---|
| 360 px | Encabezado compacto y navegación inferior con cuatro iconos y nombres; listas como filas apiladas; formulario en una columna. Reservar área inferior y safe-area para no tapar acciones. |
| 768 px | Navegación superior con texto; filtros pueden ocupar dos filas; formularios con dos columnas solo en pares cortos, como fecha y referencia. |
| 1280 px | Barra lateral de 208 px; contenido hasta 1120 px; tablas semánticas para listas; edición y resumen lateral de total cuando exista ancho suficiente. |

No hay scroll horizontal de página. Las descripciones se ajustan en varias líneas; el detalle muestra el texto completo. En móvil, precio y cantidad quedan juntos debajo de la descripción, sin tablas desbordadas. Botones de formulario en flujo normal; si se fijan abajo, deben dejar espacio equivalente y retirarse cuando estorben al teclado virtual.

Wireframe lógico para móvil; la distribución final debe respetar la jerarquía, no los caracteres:

```text
Lúmina                         Cuenta
Pedidos                    Nuevo pedido
Buscar cliente o descripción [       ]
Fecha desde [      ] hasta [      ]
Mostrar [Activos v]
--------------------------------------
Ana Pérez                  COP 85.000
29/09/2026 · 2 líneas        Ver pedido
--------------------------------------
[Anterior]  Página 1 de 3  [Siguiente]
Resumen | Pedidos | Clientes | Gastos
```

## 4. Pantallas y flujos

### Acceso

Pantalla con nombre Lúmina, correo, contraseña con control de visibilidad y «Entrar». Solo cuentas individuales autorizadas de los dueños; todos tienen iguales permisos. No signup público. Mensaje inválido: «No pudimos iniciar sesión. Revisa el correo y la contraseña». Para recuperar acceso, ayuda «Contacta a quien administra el acceso de Lúmina»; la provisión y recuperación operativa se documentan fuera de este flujo.

Entrar lleva a Resumen; si una sesión expira en un formulario, pedir acceso de nuevo y conservar el borrador en la pestaña mientras permanece abierta. Tras cerrar sesión explícitamente se vacían datos privados y borradores de esa sesión.

### Resumen

Filtro visible «Desde / Hasta», por defecto mes calendario actual en America/Bogota. Rango inclusivo según fecha del registro. Tres valores: «Pedidos registrados», «Gastos registrados», «Diferencia registrada». El primero suma totales de pedidos activos; el segundo, gastos activos; diferencia = primero − segundo. Nota junto a diferencia: «No representa utilidad contable ni saldo de caja». No sumar registros archivados.

Acción principal «Nuevo pedido» y secundaria «Registrar gasto». Debajo, últimos cinco pedidos y últimos cinco gastos con enlaces a sus listas. Al cambiar fechas se recalculan tanto valores como registros recientes dentro del rango. Sin gráficos necesarios para la primera versión.

### Pedidos: lista, creación, detalle y edición

- Lista: cliente, fecha, resumen de líneas y total COP; búsqueda por nombre del cliente o descripción del pedido; filtro por fechas y activos/archivados. El estado inicial es activos, fecha descendente; paginación de 20 registros.
- «Nuevo pedido»: cliente obligatorio con búsqueda de clientes activos; «Crear cliente» abre un formulario breve y, tras guardar, selecciona ese cliente sin perder líneas ya escritas. Fecha inicial hoy en Bogotá y editable. Notas del pedido opcionales.
- Cada línea: **Descripción de la vela**, **Cantidad**, **Precio unitario (COP)** y subtotal calculado. Descripción incluye aroma, tamaño o cualquier detalle que el dueño escriba; no desplegable de inventario. Cantidad entera entre 1 y 10.000; precio entre COP 0 y COP 999.999.999.999,99, máximo dos decimales. Entre 1 y 100 líneas; «Añadir vela» enfoca su descripción y al llegar al límite explica «El pedido permite hasta 100 líneas». «Quitar vela» elimina solo esa línea; preservar la última y explicar «El pedido necesita al menos una vela».
- Total visible antes de guardar, calculado como suma de cantidad × precio; debe ser mayor que cero y no superar COP 999.999.999.999,99. Si excede el límite o todas las líneas tienen precio cero, mostrar error junto al total y bloquear guardado sin perder datos. No campo manual de total, descuentos, impuestos ni envío. Ejemplo de descripción: «Vela de vainilla, frasco mediano».
- Guardar exige validaciones visibles; durante solicitud «Guardando…», acción deshabilitada para doble clic y borrador conservado. Confirmación solo con respuesta del servidor; ir al detalle con «Pedido guardado». Si el estado de envío es incierto, consultar el resultado de la misma operación antes de permitir un nuevo intento.
- Detalle: cliente enlazado, fecha, descripciones completas, cantidades, precios históricos, subtotales y total. «Editar» abre los datos existentes. Menú secundario «Archivar»; restaurar visible en registro archivado, incluso si su cliente está archivado. Sección secundaria «Historial de cambios» con actor, fecha/hora en Bogotá y tipo de cambio, datos recibidos del servidor; no editable.
- Volver con cambios muestra «¿Salir sin guardar?» con «Seguir editando» y «Descartar cambios». No existe autosave ni aprobación implícita al navegar.

### Clientes

Lista con búsqueda por nombre/contacto, nombre, contacto resumido y detalle; acción «Nuevo cliente». Nombre obligatorio; contacto y notas opcionales. Contacto es texto libre para teléfono, correo u otro dato; no imponer correo válido ni número internacional. Mostrar posible coincidencia de nombre/contacto antes de crear, permitiendo continuar porque dos personas pueden compartir nombre.

Detalle con datos, historial de cambios y pedidos asociados activos o archivados, mostrando estado. «Editar» conserva el identificador y los vínculos. Archivar retira el cliente de nuevas selecciones; pedidos históricos mantienen su asociación y nombre consultable, y no se archivan por esa acción. En edición de un pedido cuyo cliente está archivado, conservar ese cliente mientras no se cambie, mostrar su estado y permitir cambiar por uno activo. Restaurar cliente vuelve a habilitar su selección. No hay fusión de duplicados en esta versión.

### Gastos

Lista con fecha, concepto y total COP; filtros por concepto/proveedor, fecha y activos/archivados. «Registrar gasto» abre fecha (hoy por defecto), concepto obligatorio, total positivo COP, proveedor opcional y referencia de factura opcional. Ayuda puntual: «Puedes registrar el total de una factura como un gasto». Sin líneas de materiales ni adjuntos.

Guardar → detalle → editar; archivar/restaurar e historial de cambios con el mismo patrón de pedidos. Ni la referencia ni el proveedor modifican el importe o producen una factura.

## 5. Datos visibles y validación

- Mostrar importes con formato `es-CO`, separadores de miles y etiqueta COP inequívoca, hasta dos decimales cuando existan. Ejemplo: «COP 85.000». Inputs monetarios aceptan dígitos y coma decimal, máximo dos decimales y sin miles; ayuda breve «Sin separadores de miles. Ejemplo: 25000,50». Rechazar puntos o separadores de miles con un error claro, sin reinterpretar un importe ambiguo. Presentar debajo el importe normalizado antes de guardar. El frontend convierte este valor al decimal canónico del contrato API sin aritmética monetaria binaria.
- Fechas visibles dd/mm/aaaa; selección nativa con etiqueta, almacenada como fecha de negocio, sin cambiar de día por timezone. «Desde» posterior a «Hasta» muestra error y no consulta un rango inválido.
- Campos obligatorios llevan texto «Obligatorio» o leyenda accesible; los opcionales, «Opcional». Trim de texto; espacios solos no satisfacen campos requeridos. Límites de longitud se toman del contrato de datos y se validan sin cortar información silenciosamente.
- Error junto al campo, resumen al inicio del formulario con enlaces y foco en primer campo inválido. Ejemplos: «Describe la vela», «Escribe una cantidad entera mayor que cero», «Selecciona un cliente».
- No aceptar valores monetarios negativos; el precio de una línea puede ser cero, pero el total del pedido y del gasto debe ser positivo y no superar COP 999.999.999.999,99. No presentar discrepancia entre total mostrado y total confirmado. El servidor valida la operación y devuelve el total definitivo antes de afirmar éxito.

## 6. Estados, conservación y cambios simultáneos

| Estado | Presentación y recuperación |
|---|---|
| Primera lista vacía | «Todavía no hay pedidos» / clientes / gastos y acción de crear correspondiente. |
| Sin coincidencias | «No encontramos registros con estos filtros» y «Limpiar filtros»; no reemplazar filtros silenciosamente. |
| Cargando | Indicador y texto «Cargando…»; mantener geometría; controles de consulta deshabilitados solo mientras corresponda. |
| Fallo de consulta | «No pudimos cargar los datos» y «Reintentar»; conservar filtros. No mostrar cero como si fuera un resultado verdadero. |
| Sin internet | Aviso persistente «Sin conexión. Tus cambios aún no se han guardado»; conservar borrador y permitir editar; guardar bloqueado hasta recuperar conexión. No es modo offline ni sincronización automática. |
| Fallo al guardar | Error accionable en formulario, borrador intacto; nunca toast de éxito. Ante incertidumbre de respuesta, conservar la clave de la operación y reintentar con la misma; no generar una nueva operación equivalente. Aplicar el mismo principio a archivo y restauración. |
| Archivo | Diálogo «¿Archivar este pedido?» y explicación «Dejará de aparecer en las listas activas y el resumen. Puedes restaurarlo después». Acciones «Cancelar» y «Archivar». Mismo patrón para gasto; cliente informa que sigue visible en pedidos históricos. |
| Restauración | Confirmación breve de resultado y devolución a activo; errores conservan el estado previo. |
| Edición concurrente | «Este registro cambió mientras lo editabas». Bloquear guardado; conservar borrador; ofrecer «Comparar cambios» y «Cargar versión actual». Mostrar valores del borrador frente a actuales, incluyendo líneas añadidas/eliminadas. Cargar actual pide confirmar descarte; el usuario reaplica cambios sobre la versión vigente. Nunca sobrescribir automáticamente. |
| Archivo concurrente | Mostrar que el registro está archivado, conservar borrador, ofrecer abrir detalle/restaurar según permiso común. No resucitar el registro mediante edición. |
| Registro ausente | «Este registro no está disponible» y regreso a lista. No mostrar detalles privados en fallos de sesión. |

Borradores viven en memoria de la pestaña, no persisten en un equipo compartido después de cerrar sesión. Avisar al abandonar la página con cambios cuando el navegador lo permita. No prometer recuperación después de cerrar la pestaña o dispositivo.

## 7. Accesibilidad y validación posterior a aprobación

Objetivo WCAG 2.2 AA: texto normal ≥ 4,5:1, texto grande y elementos de control ≥ 3:1; revisar contraste real en cada estado. Foco visible nunca oculto por barra inferior. Objetivos táctiles ≥ 44 × 44 CSS px y espacio suficiente; etiquetas visibles, instrucciones asociadas y estado comunicado con texto además de color.

HTML semántico, un h1 por pantalla, landmarks, enlace de salto al contenido, tablas con encabezados en escritorio y listas semánticas en móvil. Teclado alcanza navegación, filtros, cliente buscable, añadir/quitar línea y todos los diálogos; Escape cierra diálogo no destructivo, foco queda contenido y regresa al disparador. Mensajes de guardado anunciados con región live sin mover foco innecesariamente. Soportar zoom 200 % y reflow equivalente a 320 px, lectura de descripciones largas y reduced motion.

Criterios para QA y revisión UX una vez implementado:

1. En 360, 768 y 1280 px crear cliente, pedido de dos líneas y gasto de factura completa; consultarlos desde otro dispositivo. Cero pérdida de campos o overflow horizontal.
2. Dos líneas con cantidades 2 y 1 y precios COP 25.000 y COP 35.000 muestran y guardan COP 85.000; resumen por fechas coincide con registros activos.
3. Crear pedido con cliente nuevo desde el formulario conserva las líneas previas; archivar cliente no rompe el detalle histórico.
4. Error de red nunca confirma guardado; reintento de una operación incierta no duplica el registro.
5. Dos sesiones editan el mismo registro: la segunda conserva su borrador, ve conflicto y no pisa el cambio anterior.
6. Archive/restaurar cambia listas y resumen; cancelación del diálogo mantiene datos y foco.
7. Completar flujo principal con teclado y lector de pantalla; comprobar contraste, foco, targets, zoom y formatos COP/fechas.
8. Recorrido observado con dueño: pedido de dos líneas ≤ 2 minutos y búsqueda por cliente ≤ 30 segundos, sin ayuda. Si no se logra, revisar fricción; estos tiempos no son una garantía de rendimiento.

## 8. Handoff y límites de este entregable

Nexus integra este plan con REQUIREMENTS, PRD, datos y arquitectura antes del approval gate. Tras aprobación, el implementador frontend debe usar tokens semánticos compartidos y cubrir estados; QA y el revisor UX comprueban los criterios anteriores con el flujo real y screenshots. No se crean componentes, prototipos, imágenes ni dependencias en esta fase.

Referencia faltante: `vision/_common/ASCII_PREVIEW.md` no existe en la copia local. El wireframe de este documento es una especificación propia textual; no se atribuye a ese recurso ni se simula su contenido. La falta no afecta las reglas verificadas de UI/UX y no autoriza saltarse la revisión.


## Extensión aprobada — 2026-10-01

El usuario aprobó implementar catálogo sin inventario, selección integrada de clientes/productos, pedidos compactos, listados más claros y evolución de pedidos/gastos/diferencia. La exclusión inicial del catálogo queda sustituida por esta autorización; las líneas libres siguen admitidas. Contratos, responsables, dependencias y aceptación: [IMPROVEMENTS_PLAN.md](IMPROVEMENTS_PLAN.md). Misma arquitectura y reglas de integridad/acceso; migración aditiva e histórico preservado.

Revisión previa independiente uiux_designer favorable. Tokens funcionales frente a superficie #fffcf6: verde #285a3d contraste7.83:1, rojo #9a2828 7.57:1, neutro #71634f 5.70:1 (cálculo WCAG sRGB). Las gráficas complementan color con trazos, leyenda y tabla de importes exactos; contraste computado no sustituye inspección visual y teclado del resultado final.

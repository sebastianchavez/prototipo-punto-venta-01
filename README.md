# prototipo punto ventas

Template funcional para un local de pizzas, galletones, bebidas, café, empanadas y snacks. Construido con HTML, Tailwind CSS compilado y JavaScript nativo, sin framework ni backend.

## Abrir el prototipo

Requiere Node.js 22 o posterior para utilizar el servidor incluido. Desde esta carpeta:

```sh
npm start
```

Abrir **http://127.0.0.1:4173**. No hace falta ejecutar `npm install` para utilizarlo: el servidor usa exclusivamente módulos nativos de Node, y el CSS y las imágenes ya están incluidos. También puede servirse la carpeta con cualquier servidor estático. No abrir `index.html` con `file://`, porque los módulos JavaScript necesitan HTTP.

El servidor escucha únicamente en el equipo local. Para cambiar el puerto en PowerShell:

```powershell
$env:PORT = '4180'
npm start
```

La aplicación comienza directamente en la caja con Catalina Pérez, administradora demo, y un turno abierto. El botón del usuario en la esquina superior derecha abre `acceso.html` para seleccionar otro administrador o cajero sin contraseña. Esta elección no representa autenticación ni permisos de seguridad reales.

## Recorrido de demostración

1. En **Punto de venta**, agregar una pizza y un galletón. El galletón tiene una promoción inicial del 10 %. Buscar también por código, por ejemplo `PIZ-001`.
2. Cambiar cantidades, agregar un cliente o un descuento manual. Seleccionar **Delivery** para ingresar destinatario, dirección y costo del envío.
3. Pulsar **Cobrar venta**, distribuir el pago entre efectivo, transferencia, tarjeta y Junaeb. Un excedente solo se permite si está cubierto por efectivo; la diferencia se entrega como vuelto.
4. Dejar sin marcar la impresión para cerrar la venta sin abrir el diálogo de impresión. El comprobante se puede imprimir después desde el historial.
5. Revisar la venta en **Historial de ventas**. La anulación completa requiere motivo y turno abierto; devuelve el stock y registra la devolución por los medios de pago originales. No existen devoluciones parciales.
6. En **Caja y turnos**, registrar ingresos o retiros y cerrar indicando el efectivo contado. La diferencia queda guardada. Seleccionar otro usuario demo y abrir un nuevo turno para simular un relevo.
7. Con un administrador, registrar una **Compra**. Se puede pagar y recibir inmediatamente o realizar esos pasos posteriormente. La recepción suma unidades y reemplaza el costo unitario por el último costo recibido. Cada paso solo puede realizarse una vez.
8. En **Inventario**, probar una entrada, una merma y un ajuste por conteo. El ajuste establece la existencia final; la merma no permite dejar stock negativo.
9. Revisar **Reportes** y exportar un resumen CSV. En **Configuración**, descargar un respaldo JSON, restaurarlo o reiniciar los datos de ejemplo.

## Pantallas

Cada pantalla está en un archivo HTML independiente y la navegación usa enlaces normales:

| Archivo              | Pantalla                  |
| -------------------- | ------------------------- |
| `acceso.html`        | Selección de usuario demo |
| `inicio.html`        | Resumen del local         |
| `venta.html`         | Punto de venta y carrito  |
| `ventas.html`        | Historial de ventas       |
| `caja.html`          | Caja y turnos             |
| `productos.html`     | Catálogo de productos     |
| `inventario.html`    | Existencias y movimientos |
| `recetas.html`       | Recetario                 |
| `promociones.html`   | Promociones               |
| `clientes.html`      | Clientes                  |
| `proveedores.html`   | Proveedores               |
| `compras.html`       | Compras y recepciones     |
| `gastos.html`        | Gastos operacionales      |
| `reportes.html`      | Reportes de gestión       |
| `usuarios.html`      | Usuarios demo             |
| `configuracion.html` | Configuración y respaldos |

`index.html` es únicamente el acceso inicial: redirige a `venta.html` y conserva la compatibilidad
con favoritos anteriores como `index.html#inventario`.

### Editar el HTML de una pantalla

El marcado de cada pantalla, sus encabezados y sus bloques repetidos se encuentra en su propio
archivo `.html`, dentro de bloques `<script type="text/html">`. Estos bloques son plantillas de
texto, no scripts ejecutables. Se pueden editar directamente sin regenerar archivos HTML.

Los marcadores `{{ nombre }}` se completan con los valores que preparan `js/views.js` o
`js/admin.js`. `js/templates.js` realiza únicamente sustituciones de texto; no utiliza `eval`,
un compilador ni un framework. Los formularios y diálogos compartidos se mantienen en módulos
JavaScript reutilizables y comentados.

La estructura común y el menú están identificados como `layout-*` en cada documento. La lista
de destinos y los permisos demo se definen en `js/app.js`; las rutas de archivo y el borrador
de la pestaña se gestionan en `js/navigation.js`. Los cambios visuales comunes deben aplicarse
a los bloques `layout-*` de los documentos correspondientes.

### Funcionalidades

| Área                     | Funciones                                                                                          |
| ------------------------ | -------------------------------------------------------------------------------------------------- |
| Inicio                   | Indicadores del día, evolución semanal, productos más vendidos y alertas                           |
| Punto de venta           | Fotos, categorías, búsqueda, carrito, precios mayoristas, promociones, delivery y pagos combinados |
| Historial                | Filtros por fecha, canal, usuario y pago; detalle, anulación y reimpresión                         |
| Caja y turnos            | Fondo inicial, movimientos, arqueo, diferencias y cierres                                          |
| Productos y categorías   | Crear, editar y activar o desactivar; imágenes locales o cargadas, SKU y precios                   |
| Inventario               | Existencias y registro de entradas, ventas, anulaciones, mermas, ajustes y recepciones             |
| Recetario                | Ingredientes, rendimiento e instrucciones informativas                                             |
| Promociones              | Porcentaje o monto por unidad, productos, vigencia y activación                                    |
| Clientes                 | Contactos, dirección, condición mayorista e historial                                              |
| Proveedores y compras    | Contactos, compras de varios productos, recepción y pagos pendientes                               |
| Gastos                   | Categoría, importe, descripción y medio de pago                                                    |
| Reportes                 | Ventas, canales, pagos, costos, margen, resultados mensuales y balance estimado                    |
| Usuarios y configuración | Perfiles demo, comprobante, saldos iniciales, respaldo, restauración y reinicio                    |

Los cajeros acceden a ventas, historial, caja y clientes. Los administradores acceden a todos los módulos. Siempre debe existir un administrador activo.

## Reglas de operación

- Moneda CLP, importes enteros y fechas mostradas en `America/Santiago`.
- El stock representa productos terminados. El recetario no consume ingredientes ni calcula costos de elaboración. El café tiene un costo unitario configurable y la electricidad se puede registrar como gasto.
- La modalidad mayorista aplica el precio especial cuando la cantidad del producto alcanza su mínimo. Por debajo del mínimo se usa el precio minorista. En modalidad mayorista no se aplican promociones, incluso por debajo del mínimo.
- En modalidad minorista se elige la promoción vigente con mayor descuento por producto. Un descuento fijo es por unidad y se limita al precio de esa unidad. Las promociones no se acumulan. El descuento manual se resta del valor de productos ya promocionado, antes de sumar el envío.
- Un turno abierto es obligatorio para vender, anular ventas y realizar movimientos en efectivo. Las compras y gastos en efectivo requieren suficiente dinero en el turno.
- Los cobros guardan los pagos netos del vuelto. Los pagos no efectivos no alteran el efectivo esperado de caja.
- Una venta conserva precios y costos históricos. Los cambios del catálogo y las compras posteriores no recalculan sus resultados.
- Las categorías desactivadas ocultan sus productos en el punto de venta sin eliminar inventario ni historial. Si un cambio administrativo reduce la disponibilidad de un carrito pendiente, se ajusta y se muestra un aviso.
- Las anulaciones afectan los reportes en la fecha de devolución. Los productos más vendidos se muestran antes del descuento manual y del envío.
- El fondo inicial de cada turno es una asignación del efectivo existente, no un ingreso nuevo. El balance suma saldos iniciales globales y movimientos. Incluye un ajuste de apertura explícito para conciliar inventario, capital y registros históricos de demostración. Los arqueos conservan efectivo esperado, contado y diferencia; no generan un gasto contable automático.

## Datos locales y respaldo

La clave `prototipo-punto-ventas:v1` almacena un documento JSON versionado en `localStorage`. Se genera una sola vez con 12 productos, usuarios y contactos ficticios, un turno abierto e historial de aproximadamente dos meses. Las imágenes de productos son ilustrativas; las fotografías están almacenadas en `assets/` y proceden de Unsplash. Los SVG del template son locales.

Cada operación trabaja sobre una copia del estado, valida los datos y guarda el documento completo antes de actualizar la interfaz. Un fallo de cuota o bloqueo de almacenamiento no confirma la operación. La aplicación detecta revisiones distintas entre pestañas y pide recargar para evitar sobrescrituras; no está diseñada para uso concurrente.

El respaldo incluye catálogo, usuarios demo, configuración, ventas, compras, turnos y movimientos. La restauración valida versión, estructura, campos, referencias principales y totales antes de reemplazar datos, y solicita confirmación. Las imágenes cargadas se guardan como data URL y tienen un límite de 1 MB por imagen; se recomienda usar imágenes pequeñas por el límite de `localStorage` del navegador.

Usar el mismo origen y puerto para conservar la demostración: `localhost`, `127.0.0.1` y distintos puertos tienen almacenamientos separados. Limpiar datos del navegador elimina la demo. El carrito y los filtros se conservan en `sessionStorage` durante la navegación entre archivos HTML y las recargas de la misma pestaña. El carrito se vacía al confirmar una venta o cambiar de usuario. Las ventas confirmadas permanecen en `localStorage`, independientemente del borrador.

Si los datos existentes están dañados, la aplicación los conserva y muestra un aviso. Guardar una copia antes de eliminar manualmente la clave desde las herramientas del navegador; al recargar se generará una nueva demostración.

## Personalización y desarrollo

```sh
npm ci
npm run build
npm run format
npm run format:check
npm test
```

`npm run build` regenera `css/styles.css` desde `css/input.css`, leyendo las clases usadas en HTML y JavaScript. Las herramientas de desarrollo son Tailwind CSS con su CLI y Prettier; ninguna biblioteca JavaScript se carga en la aplicación. El CSS generado se entrega sin minificar. Prettier formatea HTML, JavaScript, CSS fuente, JSON y documentación; el CSS generado queda a cargo de Tailwind.

| Archivo               | Responsabilidad                                                  |
| --------------------- | ---------------------------------------------------------------- |
| `index.html`          | Entrada y compatibilidad con enlaces anteriores                  |
| `*.html`              | Marcado editable de cada pantalla y sus bloques dinámicos        |
| `css/input.css`       | Fuentes Tailwind, componentes, responsive y estilos de impresión |
| `css/styles.css`      | CSS compilado listo para distribuir                              |
| `js/seed.js`          | Catálogo, configuración y datos de ejemplo                       |
| `js/store.js`         | Persistencia, validación, transacciones, operaciones y cálculos  |
| `js/ui.js`            | Componentes HTML, iconos, formularios, diálogos y comprobantes   |
| `js/views.js`         | Venta, inicio, historial, caja y reportes                        |
| `js/admin.js`         | Administración y formularios de registros                        |
| `js/app.js`           | Eventos y coordinación de la pantalla HTML actual                |
| `js/navigation.js`    | Rutas de archivo y conservación del borrador por pestaña         |
| `js/templates.js`     | Sustitución de marcadores HTML sin evaluar código                |
| `scripts/serve.mjs`   | Servidor estático local sin dependencias                         |
| `tests/store.test.js` | Pruebas de los flujos y reglas de negocio                        |
| `tests/pages.test.js` | Pruebas de pantallas, enlaces, plantillas y borradores           |

Para cambiar los datos iniciales, editar `js/seed.js` y luego reiniciar la demostración desde Configuración. Cambiar el archivo no reemplaza datos ya guardados. Al modificar clases o estilos, regenerar el CSS y recargar el navegador.

## Límites del template

Entrega local, sin publicación. Sin facturación, documentos tributarios, pagos reales, integración Junaeb, seguimiento de reparto, cocina, pedidos pendientes, sincronización, autenticación segura o impresión directa en hardware. La impresión usa el diálogo normal del navegador. Los reportes son estimaciones de gestión para la demostración y no estados contables certificados.

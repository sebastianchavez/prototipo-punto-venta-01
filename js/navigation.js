/** Archivos de las pantallas. Todos comparten el mismo almacenamiento local. */
export const PAGES = {
  acceso: 'acceso.html',
  inicio: 'inicio.html',
  venta: 'venta.html',
  ventas: 'ventas.html',
  caja: 'caja.html',
  productos: 'productos.html',
  inventario: 'inventario.html',
  recetas: 'recetas.html',
  promociones: 'promociones.html',
  clientes: 'clientes.html',
  proveedores: 'proveedores.html',
  compras: 'compras.html',
  gastos: 'gastos.html',
  reportes: 'reportes.html',
  usuarios: 'usuarios.html',
  configuracion: 'configuracion.html',
};

const UI_KEY = 'prototipo-punto-ventas:interfaz:v1';

export function pageHref(page) {
  return PAGES[page] || PAGES.venta;
}

/** El atributo del documento determina la pantalla; ya no se usa un router hash. */
export function currentPage() {
  return document.body.dataset.page || 'venta';
}

/**
 * Conserva el borrador y filtros en esta pestaña durante la navegación entre HTML.
 * Las operaciones confirmadas siguen guardándose en localStorage mediante Store.
 */
export function saveInterface(state) {
  try {
    sessionStorage.setItem(UI_KEY, JSON.stringify(state));
  } catch {
    // La venta confirmada no depende de que se pueda conservar este borrador.
  }
}

export function restoreInterface(defaults) {
  try {
    const saved = JSON.parse(sessionStorage.getItem(UI_KEY));
    if (!saved || !Array.isArray(saved.cart?.items)) return defaults;
    if (
      !saved.cart.items.every(
        (item) =>
          typeof item.productId === 'string' && Number.isSafeInteger(item.qty) && item.qty > 0,
      )
    )
      return defaults;

    return {
      ...defaults,
      search: typeof saved.search === 'string' ? saved.search : '',
      category: typeof saved.category === 'string' ? saved.category : 'Todas',
      cart: { ...defaults.cart, ...saved.cart },
      salesFilters: { ...defaults.salesFilters, ...saved.salesFilters },
      reportFilters: { ...defaults.reportFilters, ...saved.reportFilters },
    };
  } catch {
    // Un borrador incompatible se descarta sin modificar los datos del negocio.
    return defaults;
  }
}

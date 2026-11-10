import { PAGES, pageHref } from './navigation.js';

// Conserva la compatibilidad con favoritos antiguos como index.html#inventario.
const requestedPage = window.location.hash.slice(1);
window.location.replace(pageHref(Object.hasOwn(PAGES, requestedPage) ? requestedPage : 'venta'));

/**
 * Regresiones de la separación en documentos HTML: archivos, enlaces, plantillas
 * y conservación del borrador durante una navegación completa entre páginas.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PAGES, restoreInterface, saveInterface } from '../js/navigation.js';
import { createSeed } from '../js/seed.js';

let pageTemplates = new Map();

// Estos controladores solo necesitan leer las plantillas; no requieren un navegador.
globalThis.document = {
  addEventListener() {},
  getElementById(id) {
    return pageTemplates.has(id) ? { textContent: pageTemplates.get(id) } : null;
  },
};

const { renderTemplate } = await import('../js/templates.js');
const { renderPOS, renderDashboard, renderSales, renderCash, renderReports } =
  await import('../js/views.js');
const { renderAdmin } = await import('../js/admin.js');

async function loadPage(filename) {
  const html = await readFile(new URL(`../${filename}`, import.meta.url), 'utf8');
  const scripts = html.matchAll(
    /<script\b(?=[^>]*type="text\/html")(?=[^>]*id="([^"]+)")[^>]*>([\s\S]*?)<\/script>/g,
  );
  pageTemplates = new Map([...scripts].map((match) => [match[1], match[2]]));
  return html;
}

for (const [page, filename] of Object.entries(PAGES)) {
  test(`${filename} contains and renders its own screen`, async () => {
    const html = await loadPage(filename);
    assert.match(html, new RegExp(`data-page="${page}"`));
    assert.ok(pageTemplates.size >= 2, 'Each HTML must contain real screen markup.');
    assert.match(html, /<h1[\s>]/);
    assert.doesNotMatch(html, /href="#/);

    const state = createSeed();
    const ui = {
      search: '',
      category: 'Todas',
      cart: {
        items: [{ productId: 'p1', qty: 1 }],
        mode: 'retail',
        channel: 'Al paso',
        manualDiscount: 0,
        delivery: 0,
      },
    };
    let rendered;
    switch (page) {
      case 'acceso':
        rendered = renderTemplate('acceso-page', {
          users: renderTemplate('acceso-user', {
            id: 'u1',
            name: 'Usuario demo',
            initials: 'UD',
            role: 'Administrador',
          }),
        });
        break;
      case 'venta':
        rendered = renderPOS(state, ui);
        break;
      case 'inicio':
        rendered = renderDashboard(state);
        break;
      case 'ventas':
        rendered = renderSales(state, {});
        break;
      case 'caja':
        rendered = renderCash(state);
        break;
      case 'reportes':
        rendered = renderReports(state, { start: '', end: '' });
        break;
      default:
        rendered = renderAdmin(page, state);
    }

    assert.match(rendered, /<h1/);
    assert.doesNotMatch(rendered, /\{\{\s*[\w-]+\s*\}\}/, 'All HTML markers must resolve.');
    assert.doesNotMatch(rendered, /undefined|NaN/);

    // Todos los enlaces de pantalla deben apuntar a documentos reales.
    const links = [...html.matchAll(/href="([\w-]+\.html)"/g)].map((match) => match[1]);
    for (const target of links) {
      assert.ok(Object.values(PAGES).includes(target), `Invalid page link: ${target}`);
    }
  });
}

test('draft cart and filters survive full page navigation without touching business data', () => {
  const memory = new Map();
  globalThis.sessionStorage = {
    setItem: (key, value) => memory.set(key, value),
    getItem: (key) => memory.get(key) ?? null,
  };
  const defaults = {
    cart: { items: [], channel: 'Al paso', delivery: 0 },
    salesFilters: { start: '', end: '' },
    reportFilters: { start: '', end: '' },
  };
  const previousPage = {
    ...defaults,
    category: 'Pizzas',
    cart: {
      items: [{ productId: 'p1', qty: 2 }],
      channel: 'Delivery',
      recipient: 'Destinatario demo',
      address: 'Dirección de ejemplo',
      delivery: 1500,
    },
    salesFilters: { start: '2026-11-01', end: '2026-11-10' },
  };
  saveInterface(previousPage);
  const nextPage = restoreInterface(defaults);
  assert.deepEqual(nextPage.cart, previousPage.cart);
  assert.deepEqual(nextPage.salesFilters, previousPage.salesFilters);
  assert.equal(nextPage.category, 'Pizzas');
});

test('corrupt draft storage falls back without affecting confirmed sales', () => {
  globalThis.sessionStorage = { getItem: () => '{invalid' };
  const defaults = { cart: { items: [] } };
  assert.equal(restoreInterface(defaults), defaults);
});

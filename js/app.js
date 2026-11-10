/**
 * Controlador compartido de las páginas HTML. Coordina eventos, operaciones y diálogos; el marcado de cada pantalla está en su archivo .html.
 */
import { currentPage, pageHref, restoreInterface, saveInterface } from './navigation.js';
import { renderTemplate } from './templates.js';
import {
  Store,
  uid,
  money,
  dateTime,
  localDay,
  integer,
  assert,
  currentUser,
  activeShift,
  expectedCash,
  quote,
  completeSale,
  voidSale,
  openShift,
  closeShift,
  cashMovement,
  receivePurchase,
  payPurchase,
  report,
} from './store.js';
import { METHODS } from './seed.js';
import {
  esc,
  icon,
  badge,
  btn,
  actionBtn,
  table,
  field,
  select,
  formFooter,
  showModal,
  closeModal,
  toast,
  confirmModal,
  receipt,
  printReceipt,
} from './ui.js';
import { renderPOS, renderDashboard, renderSales, renderCash, renderReports } from './views.js';
import {
  renderAdmin,
  entityModal,
  categoriesModal,
  editCategory,
  stockModal,
  purchaseModal,
  purchaseLine,
  expenseModal,
} from './admin.js';

const store = new Store();
const freshCart = () => ({
  items: [],
  customerId: '',
  mode: 'retail',
  channel: 'Al paso',
  manualDiscount: 0,
  delivery: 0,
  recipient: '',
  address: '',
});
const monthStart = () => `${localDay().slice(0, 7)}-01`;
const ui = restoreInterface({
  route: 'venta',
  search: '',
  category: 'Todas',
  adminSearch: '',
  cart: freshCart(),
  salesFilters: { start: '', end: '', channel: '', user: '', method: '' },
  reportFilters: { start: monthStart(), end: localDay() },
});
const nav = [
  {
    group: 'PRINCIPAL',
    items: [
      ['inicio', 'Inicio', 'home', true],
      ['venta', 'Punto de venta', 'store'],
      ['ventas', 'Historial de ventas', 'receipt'],
      ['caja', 'Caja y turnos', 'wallet'],
    ],
  },
  {
    group: 'GESTIÓN DEL LOCAL',
    items: [
      ['productos', 'Productos', 'box', true],
      ['inventario', 'Inventario', 'layers', true],
      ['recetas', 'Recetario', 'book', true],
      ['promociones', 'Promociones', 'tag', true],
      ['clientes', 'Clientes', 'users'],
      ['proveedores', 'Proveedores', 'truck', true],
      ['compras', 'Compras', 'bag', true],
      ['gastos', 'Gastos', 'dollar', true],
      ['reportes', 'Reportes', 'chart', true],
    ],
  },
];
const adminRoutes = new Set([
  'inicio',
  'productos',
  'inventario',
  'recetas',
  'promociones',
  'proveedores',
  'compras',
  'gastos',
  'reportes',
  'usuarios',
  'configuracion',
]);
const titles = Object.fromEntries(nav.flatMap((g) => g.items.map((x) => [x[0], x[1]])));
Object.assign(titles, { usuarios: 'Usuarios', configuracion: 'Configuración' });
const initials = (name) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((x) => x[0])
    .join('');
function route() {
  return currentPage();
}
/** Actualiza la pantalla actual con los datos locales y aplica los accesos del perfil demo. */
function render() {
  if (!store.state) {
    document.getElementById('app').innerHTML = /* HTML */ `
      <main class="min-h-screen flex items-center justify-center p-8">
        <section class="panel p-8 max-w-lg">
          <img src="assets/favicon.svg" width="45" height="45" alt="" />
          <h1 class="text-xl font-semibold mt-5 mb-3">No se pueden cargar los datos</h1>
          <p class="text-sm text-slate-500 leading-7">${esc(store.error)}</p>
          <p class="note mt-5">
            Habilita el almacenamiento del navegador y recarga. Si existe un respaldo dañado,
            conserva una copia antes de eliminar la clave
            <strong>prototipo-punto-ventas:v1</strong>
            desde las herramientas del navegador.
          </p>
          <button class="btn mt-5" onclick="location.reload()">Reintentar</button>
        </section>
      </main>
    `;
    return;
  }
  const s = store.state;
  ui.route = route();
  if (ui.route === 'acceso') {
    renderAccess(s);
    return;
  }
  const user = currentUser(s);
  if (!user) {
    location.replace(pageHref('acceso'));
    return;
  }
  if (!s.categories.includes(ui.category) || s.disabledCategories?.includes(ui.category))
    ui.category = 'Todas';
  if (adminRoutes.has(ui.route) && user.role !== 'Administrador') {
    location.replace(pageHref('venta'));
    return;
  }
  if (ui.route === 'venta') {
    const revised = ui.cart.items.flatMap((line) => {
      const p = s.products.find(
        (p) => p.id === line.productId && p.active && !s.disabledCategories?.includes(p.category),
      );
      return p?.stock > 0 ? [{ productId: line.productId, qty: Math.min(line.qty, p.stock) }] : [];
    });
    if (JSON.stringify(revised) !== JSON.stringify(ui.cart.items)) {
      ui.cart.items = revised;
      toast('La venta se ajustó según la disponibilidad actual de los productos.');
    }
    ensureCart();
  }
  const sh = activeShift(s),
    admin = user.role === 'Administrador';
  const content =
    ui.route === 'venta'
      ? renderPOS(s, ui)
      : ui.route === 'inicio'
        ? renderDashboard(s)
        : ui.route === 'ventas'
          ? renderSales(s, ui.salesFilters)
          : ui.route === 'caja'
            ? renderCash(s)
            : ui.route === 'reportes'
              ? renderReports(s, ui.reportFilters)
              : renderAdmin(ui.route, s, ui.adminSearch);
  document.getElementById('app').innerHTML = renderTemplate('layout-page', {
    nav: nav
      .map((group) => {
        const items = group.items.filter((x) => !x[3] || admin);
        return items.length
          ? renderTemplate('layout-fragment-1', {
              group: group.group,
              items: items
                .map(([id, label, ico]) =>
                  renderTemplate('layout-fragment-2', {
                    id: pageHref(id),
                    content: ui.route === id ? 'active' : '',
                    content2: ui.route === id ? 'aria-current="page"' : '',
                    symbolIcon: icon(ico),
                    label: label,
                    content3:
                      id === 'inventario'
                        ? renderTemplate('layout-fragment-3', {
                            length: s.products.filter((p) => p.active && p.stock <= p.minStock)
                              .length,
                          })
                        : '',
                  }),
                )
                .join(''),
            })
          : '';
      })
      .join(''),
    content: admin
      ? renderTemplate('layout-fragment-4', {
          content: ui.route === 'usuarios' ? 'active' : '',
          usersIcon: icon('users'),
          content2: ui.route === 'configuracion' ? 'active' : '',
          settingsIcon: icon('settings'),
        })
      : '',
    helpIcon: icon('help'),
    btn: btn('', 'mobile-menu', 'mobile-menu !px-2', 'menu', 'aria-label="Abrir menú"'),
    homeIcon: icon('home', '!w-3.5 !h-3.5'),
    chevronIcon: icon('chevron', '!w-3 !h-3'),
    value: titles[ui.route],
    content2: new Date().toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'America/Santiago',
    }),
    content3: sh ? '' : 'orange',
    content4: sh ? 'Caja abierta' : 'Caja cerrada',
    bellIcon: icon('bell', '!w-[18px] !h-[18px]'),
    content5: s.products.some((p) => p.active && p.stock <= p.minStock)
      ? '<span class="absolute right-0 top-0 w-1.5 h-1.5 bg-orange-400 rounded-full border border-white"></span>'
      : '',
    initials: esc(initials(user.name)),
    name: esc(user.name),
    role: user.role,
    downIcon: icon('down', '!w-3 !h-3 text-slate-400'),
    content6: content,
  });
}
/** Completa las tarjetas de usuarios en acceso.html. */
function renderAccess(s) {
  document.getElementById('app').innerHTML = renderTemplate('acceso-page', {
    users: s.users
      .filter((user) => user.active)
      .map((user) =>
        renderTemplate('acceso-user', {
          id: esc(user.id),
          initials: esc(initials(user.name)),
          name: esc(user.name),
          role: esc(user.role),
        }),
      )
      .join(''),
  });
}
/** Recalcula los resultados sin perder el foco ni el cursor de la búsqueda. */
function refreshPreservingFocus() {
  const el = document.activeElement,
    id = el?.id,
    pos = el?.selectionStart;
  render();
  if (id) {
    const next = document.getElementById(id);
    next?.focus();
    if (pos !== null && next?.setSelectionRange)
      try {
        next.setSelectionRange(pos, pos);
      } catch {}
  }
}
/** Confirma el guardado antes de actualizar la interfaz y mostrar el aviso de éxito. */
function transaction(fn, message, admin = false) {
  const result = store.transaction(fn, { admin });
  render();
  if (message) toast(message);
  return result;
}
/** Limita el descuento al valor disponible de los productos. */
function ensureCart() {
  const q = quote(store.state, { ...ui.cart, manualDiscount: 0 });
  ui.cart.manualDiscount = Math.min(ui.cart.manualDiscount, q.subtotal - q.promotionDiscount);
}
/** Controla cantidades y stock al agregar o quitar unidades. */
function addCart(id, delta = 1) {
  const p = store.state.products.find((p) => p.id === id);
  assert(p && p.active, 'Este producto no está disponible.');
  const line = ui.cart.items.find((x) => x.productId === id),
    qty = (line?.qty || 0) + delta;
  assert(qty <= p.stock, `Solo hay ${p.stock} unidades de ${p.name}.`);
  if (qty <= 0) ui.cart.items = ui.cart.items.filter((x) => x.productId !== id);
  else if (line) line.qty = qty;
  else ui.cart.items.push({ productId: id, qty });
  ensureCart();
  render();
}
/** Navega a la pantalla de selección conservando el borrador de esta pestaña. */
function navigateToAccess() {
  saveInterface(ui);
  location.href = pageHref('acceso');
}
/** Prepara el cobro; el token impide registrar dos veces la misma venta. */
function checkout() {
  const s = store.state;
  assert(activeShift(s), 'Abre un turno desde Caja y turnos antes de cobrar.');
  const q = quote(s, ui.cart);
  assert(q.items.length, 'Agrega productos antes de cobrar.');
  if (ui.cart.channel === 'Delivery')
    assert(
      ui.cart.recipient.trim() && ui.cart.address.trim(),
      'Completa el destinatario y la dirección de entrega.',
    );
  const token = uid('checkout');
  showModal(
    'Cobrar venta',
    /* HTML */ `
      <div class="bg-orange-50 rounded-xl p-5 flex items-center justify-between mb-6">
        <span class="text-xs text-orange-500">Total a pagar</span>
        <strong class="text-[29px] tracking-tight text-orange-500">${money(q.total)}</strong>
      </div>
      <p class="text-xs text-slate-500 mb-4">Distribuye el pago entre uno o varios medios.</p>
      <div class="grid gap-3">
        ${METHODS.map(
          (m) => /* HTML */ `
            <label class="!flex !flex-row items-center justify-between !font-normal">
              <span class="flex items-center gap-2 text-xs">
                ${icon(m === 'Efectivo' ? 'wallet' : m === 'Transferencia' ? 'arrow' : m === 'Junaeb' ? 'book' : 'card', '!w-4 !h-4 text-slate-400')}${m}
              </span>
              <input
                type="number"
                class="!w-40 !text-right"
                name="${m}"
                min="0"
                step="1"
                value="${m === 'Efectivo' ? q.total : 0}"
                aria-label="Pago ${m}"
                data-payment
              />
            </label>
          `,
        ).join('')}
      </div>
      <div id="payment-summary" class="mt-5"></div>
      <label class="!flex !flex-row gap-2 items-center mt-5">
        <input type="checkbox" name="print" />
        Imprimir comprobante al finalizar
      </label>
      ${formFooter('Confirmar pago')}
    `,
    {
      onSubmit: (fd) => {
        const id = store.transaction((next) =>
          completeSale(
            next,
            ui.cart,
            Object.fromEntries(METHODS.map((m) => [m, fd.get(m)])),
            token,
          ),
        );
        ui.cart = freshCart();
        closeModal();
        render();
        toast('Venta registrada correctamente.');
        saleSuccess(id);
        if (fd.get('print'))
          printReceipt(
            store.state,
            store.state.sales.find((x) => x.id === id),
          );
      },
    },
  );
  updatePaymentSummary();
}
/** Muestra el importe recibido y el vuelto mientras se distribuyen los pagos. */
function updatePaymentSummary() {
  const root = document.getElementById('payment-summary');
  if (!root) return;
  const total = quote(store.state, ui.cart).total,
    inputs = [...document.querySelectorAll('[data-payment]')],
    paid = inputs.reduce((n, x) => n + Number(x.value || 0), 0),
    cash = Number(inputs.find((x) => x.name === 'Efectivo').value || 0),
    change = paid - total,
    valid = change >= 0 && change <= cash;
  root.innerHTML = /* HTML */ `
    <div class="money-line">
      <span class="text-slate-500">Recibido</span>
      <strong>${money(paid)}</strong>
    </div>
    <div class="money-line">
      <span class="text-slate-500">${change < 0 ? 'Falta por pagar' : 'Vuelto en efectivo'}</span>
      <strong class="${valid ? 'text-emerald-600' : 'text-orange-500'}">
        ${money(Math.abs(change))}
      </strong>
    </div>
    ${change > cash ? '<p class="text-xs text-red-500 mt-2">El excedente debe estar cubierto por efectivo.</p>' : ''}
  `;
}
/** Muestra el comprobante solo después de guardar una venta. */
function saleSuccess(id) {
  const sale = store.state.sales.find((x) => x.id === id);
  showModal(
    '¡Venta completada!',
    /* HTML */ `
      <div class="text-center mb-6">
        <div
          class="w-14 h-14 rounded-full bg-green-50 text-green-500 grid place-items-center mx-auto mb-4"
        >
          ${icon('check')}
        </div>
        <p class="text-slate-500 text-xs">
          Venta #${sale.number} guardada · Vuelto ${money(sale.change)}
        </p>
      </div>
      ${receipt(store.state, sale)}
      <div class="modal-footer">
        ${btn('Imprimir', 'print-sale', '', 'printer', `data-id="${id}"`)}${btn('Nueva venta', 'close-modal', 'btn-primary', 'plus')}
      </div>
    `,
  );
}
/** Consulta el comprobante y permite imprimir o solicitar la anulación. */
function saleDetail(id) {
  const s = store.state,
    sale = s.sales.find((x) => x.id === id);
  assert(sale, 'Venta no encontrada.');
  showModal(
    `Detalle de venta #${sale.number}`,
    /* HTML */ `
      ${receipt(s, sale)}${
        sale.status === 'Anulada'
          ? /* HTML */ `
              <div class="note mt-5">
                Anulada el ${dateTime(sale.voidedAt)}. Motivo: ${esc(sale.voidReason)}
              </div>
            `
          : ''
      }
      <div class="modal-footer">
        ${sale.status === 'Completada' ? btn('Anular venta', 'void-sale', 'btn-danger', 'close', `data-id="${id}"`) : ''}${btn('Imprimir', 'print-sale', '', 'printer', `data-id="${id}"`)}
      </div>
    `,
  );
}
/** Descarga un respaldo o reporte y libera la URL temporal. */
function download(name, content, type) {
  const a = document.createElement('a'),
    url = URL.createObjectURL(new Blob([content], { type }));
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
// Acciones delegadas: permiten actualizar las regiones sin volver a enlazar cada botón.
const actions = {
  'close-modal': closeModal,
  'mobile-menu': () => document.getElementById('sidebar').classList.toggle('open'),
  login: navigateToAccess,
  'switch-user': (el) => {
    assert(
      store.state.users.some((u) => u.id === el.dataset.id && u.active),
      'Usuario no disponible.',
    );
    store.transaction((s) => {
      s.sessionUserId = el.dataset.id;
    });
    ui.cart = freshCart();
    saveInterface(ui);
    location.href = pageHref('venta');
  },
  help: () =>
    showModal(
      'Tu local, paso a paso',
      /* HTML */ `
        <div class="grid gap-5 text-xs text-slate-500 leading-6">
          <p>
            <strong class="text-slate-700">1. Revisa tu caja.</strong>
            La demo comienza con un turno abierto. Desde Caja y turnos puedes registrar ingresos,
            retiros y cierres.
          </p>
          <p>
            <strong class="text-slate-700">2. Prepara una venta.</strong>
            Elige productos, cliente, modalidad y canal. Si es delivery, completa los datos de
            entrega.
          </p>
          <p>
            <strong class="text-slate-700">3. Cobra y entrega.</strong>
            Combina medios de pago y decide si imprimir el comprobante.
          </p>
          <p>
            <strong class="text-slate-700">4. Gestiona tu local.</strong>
            El administrador tiene acceso a compras, inventario, promociones y reportes.
          </p>
        </div>
        <div class="note mt-5">
          Los datos son de ejemplo y se guardan únicamente en este navegador. Los pagos e
          impresiones no tienen integraciones reales.
        </div>
        <div class="modal-footer">${btn('Entendido', 'close-modal', 'btn-primary')}</div>
      `,
    ),
  alerts: () => {
    const low = store.state.products.filter((p) => p.active && p.stock <= p.minStock);
    showModal(
      'Alertas de inventario',
      /* HTML */ `
        ${table(
          ['Producto', 'Disponible', 'Mínimo'],
          low.map(
            (p) => /* HTML */ `
              <tr>
                <td>${esc(p.name)}</td>
                <td>${badge(`${p.stock} un.`, 'red')}</td>
                <td>${p.minStock}</td>
              </tr>
            `,
          ),
        )}
        <div class="modal-footer">${btn('Cerrar', 'close-modal')}</div>
      `,
    );
  },
  category: (el) => {
    ui.category = el.dataset.id;
    render();
  },
  'add-cart': (el) => addCart(el.dataset.id),
  qty: (el) => addCart(el.dataset.id, Number(el.dataset.delta)),
  'remove-cart': (el) => {
    ui.cart.items = ui.cart.items.filter((x) => x.productId !== el.dataset.id);
    ensureCart();
    render();
  },
  'clear-cart': () =>
    confirmModal(
      'Vaciar venta',
      'Se quitarán todos los productos y datos de la venta actual.',
      () => {
        ui.cart = freshCart();
        render();
      },
      'Vaciar venta',
    ),
  channel: (el) => {
    ui.cart.channel = el.dataset.id;
    render();
  },
  discount: () =>
    showModal(
      'Descuento de la venta',
      /* HTML */ `
        ${field('Descuento adicional (CLP)', 'amount', 'number', ui.cart.manualDiscount, 'required min="0" step="1"')}
        <p class="muted mt-3">Se aplica después de las promociones y antes del envío.</p>
        ${formFooter('Aplicar descuento')}
      `,
      {
        onSubmit: (fd) => {
          const value = integer(fd.get('amount'), 'Descuento');
          quote(store.state, { ...ui.cart, manualDiscount: value });
          ui.cart.manualDiscount = value;
          closeModal();
          render();
        },
      },
    ),
  checkout: checkout,
  'view-cart': () =>
    document.querySelector('.cart').scrollIntoView({ behavior: 'smooth', block: 'start' }),
  'sale-detail': (el) => saleDetail(el.dataset.id),
  'print-sale': (el) =>
    printReceipt(
      store.state,
      store.state.sales.find((x) => x.id === el.dataset.id),
    ),
  'void-sale': (el) => {
    const id = el.dataset.id;
    showModal(
      'Anular venta',
      /* HTML */ `
        <div class="note mb-5">
          Se devolverán los productos al inventario y se registrará la devolución por los medios de
          pago originales en el turno abierto. Esta acción no se puede repetir.
        </div>
        ${field('Motivo de anulación', 'reason', 'text', '', 'required maxlength="200"')}${formFooter('Anular y devolver')}
      `,
      {
        onSubmit: (fd) => {
          transaction((s) => voidSale(s, id, fd.get('reason')), 'Venta anulada.');
          closeModal();
        },
      },
    );
  },
  'open-shift': () =>
    showModal(
      'Abrir turno de caja',
      /* HTML */ `
        ${field('Fondo inicial de efectivo (CLP)', 'opening', 'number', 50000, 'required min="0" step="1"')}
        <div class="note mt-4">
          Este fondo es una asignación del efectivo del local. No representa un nuevo ingreso ni una
          venta.
        </div>
        ${formFooter('Abrir caja')}
      `,
      {
        onSubmit: (fd) => {
          transaction((s) => openShift(s, fd.get('opening')), 'Turno abierto.');
          closeModal();
        },
      },
    ),
  'close-shift': () => {
    const expected = expectedCash(store.state);
    showModal(
      'Arqueo y cierre de turno',
      /* HTML */ `
        <div class="bg-slate-50 rounded-xl p-5 mb-5">
          <p class="muted mb-2">Efectivo esperado en caja</p>
          <strong class="text-2xl">${money(expected)}</strong>
        </div>
        ${field('Efectivo contado (CLP)', 'counted', 'number', '', 'required min="0" step="1" id="cash-counted"')}
        <div id="cash-difference" class="mt-4 text-xs text-slate-500">
          Ingresa el conteo para comparar.
        </div>
        <div class="note mt-4">
          El cierre quedará guardado con su diferencia. El siguiente usuario podrá iniciar un nuevo
          turno.
        </div>
        ${formFooter('Confirmar cierre')}
      `,
      {
        onSubmit: (fd) => {
          transaction((s) => closeShift(s, fd.get('counted')), 'Turno cerrado y arqueo guardado.');
          closeModal();
        },
      },
    );
  },
  'cash-in': () => cashModal('Ingreso'),
  'cash-out': () => cashModal('Retiro'),
  'new-customer': () => entityModal('customers', null, store, render),
  'new-entity': (el) => entityModal(el.dataset.entity, null, store, render),
  'edit-entity': (el) => entityModal(el.dataset.entity, el.dataset.id, store, render),
  categories: () => categoriesModal(store, render),
  'edit-category': (el) => editCategory(store, render, el.dataset.id),
  'toggle-category': (el) =>
    confirmModal(
      'Cambiar estado de categoría',
      'Al desactivar una categoría, sus productos dejarán de estar disponibles en el punto de venta. El inventario y el historial se conservan.',
      () => {
        transaction(
          (s) => {
            s.disabledCategories ??= [];
            const name = el.dataset.id;
            assert(s.categories.includes(name), 'Categoría no encontrada.');
            s.disabledCategories = s.disabledCategories.includes(name)
              ? s.disabledCategories.filter((x) => x !== name)
              : [...s.disabledCategories, name];
          },
          'Estado de categoría actualizado.',
          true,
        );
      },
      'Confirmar cambio',
    ),
  'stock-adjust': (el) => stockModal(store, render, el.dataset.id),
  'customer-history': (el) => {
    const s = store.state,
      c = s.customers.find((x) => x.id === el.dataset.id),
      sales = s.sales.filter((x) => x.customerId === c.id);
    showModal(
      `Compras de ${esc(c.name)}`,
      `${table(
        ['Venta', 'Fecha', 'Total', 'Estado'],
        [...sales].reverse().map(
          (x) => /* HTML */ `
            <tr>
              <td>${btn(`#${x.number}`, 'sale-detail', 'btn-sm', '', `data-id="${x.id}"`)}</td>
              <td>${dateTime(x.createdAt)}</td>
              <td>${money(x.total)}</td>
              <td>${badge(x.status, x.status === 'Anulada' ? 'red' : '')}</td>
            </tr>
          `,
        ),
      )}`,
      { wide: true },
    );
  },
  'new-purchase': () => purchaseModal(store, render),
  'add-purchase-line': () => {
    assert(document.querySelectorAll('.purchase-line').length < 30, 'Máximo 30 líneas por compra.');
    document
      .getElementById('purchase-lines')
      .insertAdjacentHTML('beforeend', purchaseLine(store.state));
  },
  'remove-purchase-line': (el) => el.closest('.purchase-line').remove(),
  'receive-purchase': (el) =>
    confirmModal(
      'Recibir compra',
      'Se agregarán los productos al inventario y se actualizará su costo unitario con los valores de esta compra.',
      () => transaction((s) => receivePurchase(s, el.dataset.id), 'Compra recibida.', true),
      'Confirmar recepción',
    ),
  'pay-purchase': (el) =>
    showModal(
      'Pagar compra',
      `${select('Medio de pago', 'method', METHODS, 'Transferencia')}${formFooter('Registrar pago')}`,
      {
        onSubmit: (fd) => {
          transaction(
            (s) => payPurchase(s, el.dataset.id, fd.get('method')),
            'Pago registrado.',
            true,
          );
          closeModal();
        },
      },
    ),
  'new-expense': () => expenseModal(store, render),
  'clear-sales-filters': () => {
    ui.salesFilters = { start: '', end: '', channel: '', user: '', method: '' };
    render();
  },
  'report-month': () => {
    ui.reportFilters = { start: monthStart(), end: localDay() };
    render();
  },
  'export-report': () => {
    const r = report(store.state, ui.reportFilters.start, ui.reportFilters.end),
      rows = [
        ['Reporte', 'Valor CLP'],
        ['Desde', ui.reportFilters.start],
        ['Hasta', ui.reportFilters.end],
        ['Ventas brutas', r.gross],
        ['Descuentos', r.discounts],
        ['Anulaciones', r.refunded],
        ['Ventas netas', r.net],
        ['Costo vendido', r.cost],
        ['Gastos', r.expenses],
        ['Resultado', r.result],
        ...Object.entries(r.paymentTotals),
        ...Object.entries(r.channels),
      ];
    download(
      `reporte-${localDay()}.csv`,
      '\ufeff' +
        rows
          .map((row) => row.map((x) => `"${String(x).replaceAll('"', '""')}"`).join(';'))
          .join('\r\n'),
      'text/csv;charset=utf-8',
    );
    toast('Reporte descargado.');
  },
  backup: () => {
    download(
      `respaldo-punto-ventas-${localDay()}.json`,
      JSON.stringify(store.state, null, 2),
      'application/json',
    );
    toast('Respaldo descargado.');
  },
  restore: () => document.getElementById('restore-file').click(),
  reset: () =>
    confirmModal(
      'Reiniciar demostración',
      'Se reemplazarán las ventas, turnos, productos y demás registros actuales. Descarga un respaldo antes si deseas conservarlos.',
      () => {
        store.reset();
        ui.cart = freshCart();
        ui.search = '';
        ui.category = 'Todas';
        render();
        toast('Datos de demostración restaurados.');
      },
      'Reiniciar datos',
    ),
};
/** Formulario compartido de ingresos y retiros de efectivo. */
function cashModal(type) {
  assert(activeShift(store.state), 'Abre un turno primero.');
  showModal(
    `${type} de efectivo`,
    `${field('Monto (CLP)', 'amount', 'number', '', 'required min="1" step="1"')}${field('Motivo', 'reason', 'text', '', 'required maxlength="180" class="mt-4"')}${formFooter(`Registrar ${type.toLowerCase()}`)}`,
    {
      onSubmit: (fd) => {
        transaction(
          (s) => cashMovement(s, type, fd.get('amount'), fd.get('reason')),
          'Movimiento registrado.',
        );
        closeModal();
      },
    },
  );
}
document.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-action]');
  if (!el || el.disabled) return;
  const action = actions[el.dataset.action];
  if (action)
    try {
      await action(el);
    } catch (error) {
      toast(error.message, true);
    }
});
// Búsquedas y cálculos inmediatos que no escriben datos del negocio.
document.addEventListener('input', (e) => {
  const el = e.target;
  try {
    if (el.id === 'pos-search') {
      ui.search = el.value;
      refreshPreservingFocus();
    }
    if (el.id === 'admin-search') {
      ui.adminSearch = el.value;
      refreshPreservingFocus();
    }
    if (el.hasAttribute('data-cart')) {
      const key = el.dataset.cart;
      if (key !== 'delivery') ui.cart[key] = el.value;
    }
    if (el.hasAttribute('data-payment')) updatePaymentSummary();
    if (el.id === 'cash-counted') {
      const n = Number(el.value),
        diff = n - expectedCash(store.state);
      document.getElementById('cash-difference').innerHTML = /* HTML */ `
        Diferencia de caja:
        <strong class="${diff ? 'text-orange-500' : 'text-emerald-600'}">${money(diff)}</strong>
      `;
    }
  } catch (error) {
    toast(error.message, true);
  }
});
// Selecciones del carrito, imágenes y restauración de respaldos.
document.addEventListener('change', async (e) => {
  const el = e.target;
  try {
    if (el.id === 'cart-customer') {
      ui.cart.customerId = el.value;
      const c = store.state.customers.find((x) => x.id === el.value);
      ui.cart.mode = c?.wholesale ? 'wholesale' : 'retail';
      if (c) {
        ui.cart.recipient = c.name;
        ui.cart.address = c.address;
      }
      ensureCart();
      render();
    }
    if (el.id === 'cart-mode') {
      ui.cart.mode = el.value;
      ensureCart();
      render();
    }
    if (el.dataset.cart === 'delivery') {
      ui.cart.delivery = integer(el.value, 'Envío');
      render();
    }
    if (el.id === 'restore-file' && el.files[0]) {
      const file = el.files[0];
      assert(file.size < 15 * 1024 * 1024, 'El respaldo no debe superar 15 MB.');
      let data;
      try {
        data = JSON.parse(await file.text());
      } catch {
        throw new Error('El archivo no contiene un JSON válido.');
      }
      const { validateState } = await import('./store.js');
      validateState(data);
      confirmModal(
        'Restaurar respaldo',
        `Se reemplazarán los datos actuales por el respaldo: ${data.products.length} productos y ${data.sales.length} ventas.`,
        () => {
          store.restore(data);
          ui.cart = freshCart();
          render();
          toast('Respaldo restaurado correctamente.');
        },
        'Reemplazar datos',
      );
      el.value = '';
    }
    if (el.closest('.purchase-line') && el.name === 'productId') {
      el.closest('.purchase-line').querySelector('[name=cost]').value =
        store.state.products.find((x) => x.id === el.value)?.cost || 0;
    }
  } catch (error) {
    toast(error.message, true);
  }
});
// Los formularios de pantalla comparten las mismas validaciones que los diálogos.
document.addEventListener('submit', (e) => {
  const form = e.target;
  try {
    if (form.id === 'sales-filters') {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      assert(
        !data.start || !data.end || data.start <= data.end,
        'El período de fechas no es válido.',
      );
      ui.salesFilters = data;
      render();
    }
    if (form.id === 'report-filters') {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      assert(
        !data.start || !data.end || data.start <= data.end,
        'El período de fechas no es válido.',
      );
      ui.reportFilters = data;
      render();
    }
    if (form.id === 'settings-form') {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      for (const k of ['initialCapital', 'initialCash', 'initialNonCash'])
        data[k] = integer(data[k], k);
      transaction((s) => Object.assign(s.settings, data), 'Configuración guardada.', true);
    }
  } catch (error) {
    e.preventDefault();
    toast(error.message, true);
  }
});
// Se guarda el borrador antes de abandonar un HTML; cada página carga los datos actuales.
window.addEventListener('pagehide', () => saveInterface(ui));
window.addEventListener('pageshow', (event) => {
  if (event.persisted) location.reload();
});
window.addEventListener('storage', (e) => {
  if (e.key === 'prototipo-punto-ventas:v1')
    toast('Los datos cambiaron en otra pestaña. Recarga antes de continuar.', true);
});
render();

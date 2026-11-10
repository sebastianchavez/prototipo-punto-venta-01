/**
 * Componentes reutilizables para las páginas y los diálogos. Los datos editables se escapan antes de insertarlos en el HTML.
 */
import { money, dateTime } from './store.js';
export const esc = (v) =>
  String(v ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
const paths = {
  store: 'M3 9h18l-2-6H5L3 9Zm1 4v8h16v-8M9 21v-7h6v7M3 9c0 4 5 4 5 0 0 4 8 4 8 0 0 4 5 4 5 0',
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  home: 'm3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8',
  cart: 'M3 3h2l3 13h10l3-9H6M9 21h.01M17 21h.01',
  receipt: 'M5 3h14v18l-3-2-4 2-4-2-3 2V3Zm4 5h6M9 12h6',
  wallet: 'M20 8V5H4v15h16V8H4M16 11h6v6h-6z',
  box: 'm3 7 9-4 9 4-9 4-9-4Zm0 0v11l9 4 9-4V7M12 11v11M7 5l10 4',
  layers: 'm3 7 9-4 9 4-9 4-9-4Zm0 5 9 4 9-4M3 17l9 4 9-4',
  book: 'M3 4h6l3 3 3-3h6v16h-6l-3 2-3-2H3V4Zm9 3v15M6 9h3M15 9h3M6 13h3M15 13h3',
  tag: 'M3 3h8l10 10-8 8L3 11V3Zm5 4h.01',
  users:
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M17 4a4 4 0 0 1 0 7M22 21v-2a4 4 0 0 0-3-3.87',
  truck:
    'M1 4h13v13H1zM14 9h5l3 4v4h-8M7 19a2 2 0 1 0-4 0 2 2 0 0 0 4 0M21 19a2 2 0 1 0-4 0 2 2 0 0 0 4 0',
  bag: 'M5 7h14l2 14H3L5 7Zm3 0V5a4 4 0 0 1 8 0v2M8 10v2M16 10v2',
  chart: 'M4 3v18h17M8 16v-5M13 16V7M18 16V4',
  settings:
    'm9 3-1 3-3 1-2 4 2 2-1 3 3 3 3-1 2 3 4-1 1-3 3-1 1-4-3-2 1-3-4-2-3 1-2-2H9Zm6 9a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  search: 'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  chevron: 'm9 5 7 7-7 7',
  down: 'm6 9 6 6 6-6',
  plus: 'M12 5v14M5 12h14',
  close: 'm6 6 12 12M6 18 18 6',
  check: 'm5 12 4 4L19 6',
  arrow: 'M5 12h14m-5-5 5 5-5 5',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4',
  calendar: 'M4 5h16v16H4zM8 3v4M16 3v4M4 10h16',
  clock: 'M12 8v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  pizza: 'm12 3 9 17H3L12 3Zm-6 11 12 0M11 10h.01M14 17h.01M9 17h.01',
  cookie: 'M21 12A9 9 0 1 1 12 3c-1 4 1 6 4 5-1 3 1 5 5 4M8 8h.01M7 14h.01M12 17h.01',
  coffee: 'M4 8h12v7a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Zm12 1h2a3 3 0 0 1 0 6h-2M7 3v2M12 3v2M2 23h18',
  drink: 'M7 6h10l-1 16H8L7 6Zm5 0V2h5M7 11h10',
  dollar: 'M12 2v20M17 5H9a4 4 0 0 0 0 8h6a3 3 0 0 1 0 6H6',
  trending: 'm3 17 6-6 4 4L21 5M15 5h6v6',
  edit: 'm15 4 5 5M4 16 16 4a3 3 0 0 1 4 4L8 20l-5 1 1-5Z',
  trash: 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  download: 'M12 3v12m-5-5 5 5 5-5M4 15v6h16v-6',
  upload: 'M12 16V4m-5 5 5-5 5 5M4 15v6h16v-6',
  logout: 'M9 3H4v18h5M12 12h10m-5-5 5 5-5 5',
  menu: 'M3 6h18M3 12h18M3 18h18',
  help: 'M9 9a3 3 0 1 1 5 2c-2 1-2 2-2 3M12 18h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  printer: 'M6 9V3h12v6M6 18H3V9h18v9h-3M6 14h12v8H6zM17 12h.01',
  card: 'M2 5h20v15H2zM2 10h20M6 15h3',
  alert: 'm12 3 10 18H2L12 3Zm0 6v5M12 17h.01',
  refresh: 'M21 8V3l-4 4a8 8 0 1 0 3 10M21 3h-5',
  minus: 'M5 12h14',
  filter: 'M3 4h18l-7 8v8l-4-2v-6L3 4',
  lock: 'M5 10h14v11H5zM8 10V6a4 4 0 0 1 8 0v4M12 14v3',
  leaf: 'M20 3C8 3 3 8 5 16c8 4 15-2 15-13ZM5 21 15 10',
};
export const icon = (name, cls = '') => /* HTML */ `
  <svg class="icon ${cls}" aria-hidden="true" viewBox="0 0 24 24">
    <path d="${paths[name] || paths.box}" />
  </svg>
`;
export const image = (src, alt, cls = '') => /* HTML */ `
  <img src="${esc(safeImage(src))}" alt="${esc(alt)}" class="${cls}" loading="lazy" data-fallback />
`;
/** Acepta imágenes locales, HTTPS o los formatos raster cargados desde el formulario. */
export function safeImage(src) {
  return typeof src === 'string' &&
    /^(assets\/[\w./-]+|https:\/\/[^\s<>"']+|data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+)$/.test(
      src,
    )
    ? src
    : 'assets/placeholder.svg';
}
export const badge = (text, kind = '') => /* HTML */ `
  <span class="badge ${kind}">${esc(text)}</span>
`;
export const btn = (label, action, kind = '', ico = '', attrs = '') => /* HTML */ `
  <button class="btn ${kind}" type="button" data-action="${action}" ${attrs}>
    ${ico ? icon(ico) : ''}${label}
  </button>
`;
export const actionBtn = (ico, action, label, attrs = '') => /* HTML */ `
  <button
    class="icon-btn"
    type="button"
    data-action="${action}"
    title="${esc(label)}"
    aria-label="${esc(label)}"
    ${attrs}
  >
    ${icon(ico)}
  </button>
`;
export const heading = (title, desc, actions = '') => /* HTML */ `
  <div class="page-heading">
    <div>
      <h1>${title}</h1>
      <p>${desc}</p>
    </div>
    <div class="flex flex-wrap gap-2">${actions}</div>
  </div>
`;
export const stat = (label, value, ico = 'dollar', sub = '') => /* HTML */ `
  <div class="panel stat">
    <div class="stat-icon">${icon(ico)}</div>
    <div>
      <div class="stat-label">${label}</div>
      <div class="stat-value">${value}</div>
      ${
        sub
          ? /* HTML */ `
              <div class="mt-2 text-[10px] text-slate-400">${sub}</div>
            `
          : ''
      }
    </div>
  </div>
`;
export const empty = (title, desc = '', ico = 'box') => /* HTML */ `
  <div class="empty-state">
    ${icon(ico)}
    <h3>${title}</h3>
    <p>${desc}</p>
  </div>
`;
export const table = (headers, rows) =>
  rows.length
    ? /* HTML */ `
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                ${headers
                  .map(
                    (h) => /* HTML */ `
                      <th scope="col">${h}</th>
                    `,
                  )
                  .join('')}
              </tr>
            </thead>
            <tbody>${rows.join('')}</tbody>
          </table>
        </div>
      `
    : empty('No hay registros', 'Prueba otros filtros o agrega un nuevo registro.');
export const field = (label, name, type = 'text', value = '', attrs = '') =>
  /* HTML */ `<label${/class="[^"]*\bfull\b/.test(attrs) ? ' class="full"' : ''}>${label}<input name="${name}" type="${type}" value="${esc(value)}" ${attrs}></label>`;
export const select = (label, name, options, value = '', attrs = '') => /* HTML */ `
  <label>
    ${label}
    <select name="${name}" aria-label="${esc(label)}" ${attrs}>
      ${options
        .map((o) => {
          const [v, t] = Array.isArray(o) ? o : [o, o];
          return /* HTML */ `
            <option value="${esc(v)}" ${String(value) === String(v) ? 'selected' : ''}>
              ${esc(t)}
            </option>
          `;
        })
        .join('')}
    </select>
  </label>
`;
export const area = (label, name, value = '', attrs = '') => /* HTML */ `
  <label class="full">
    ${label}
    <textarea name="${name}" rows="3" ${attrs}>${esc(value)}</textarea>
  </label>
`;
export const formFooter = (label = 'Guardar') => /* HTML */ `
  <div class="modal-footer">
    ${btn('Cancelar', 'close-modal')}
    <button type="submit" class="btn btn-primary">${icon('check')}${label}</button>
  </div>
`;
/** Muestra avisos accesibles y los retira automáticamente. */
export function toast(message, error = false) {
  const node = document.createElement('div');
  node.className = `toast ${error ? 'error' : ''}`;
  node.innerHTML = /* HTML */ `
    ${icon(error ? 'alert' : 'check')}
    <span>${esc(message)}</span>
  `;
  document.getElementById('toasts').append(node);
  setTimeout(() => node.remove(), 4500);
}
let lastFocus = null;
/** Abre un diálogo accesible y evita envíos repetidos mientras se guarda. */
export function showModal(title, body, { wide = false, onSubmit } = {}) {
  lastFocus = document.activeElement;
  const root = document.getElementById('modal-root');
  root.innerHTML = /* HTML */ `
    <div class="modal-backdrop">
      <section
        class="modal ${wide ? 'wide' : ''}"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        tabindex="-1"
      >
        <div class="modal-heading">
          <h2 id="dialog-title">${title}</h2>
          ${actionBtn('close', 'close-modal', 'Cerrar ventana')}
        </div>
        <div class="modal-body">
          ${onSubmit ? '<form id="modal-form"><div id="form-error" role="alert"></div>' : ''}${body}${onSubmit ? '</form>' : ''}
        </div>
      </section>
    </div>
  `;
  const modal = root.querySelector('.modal');
  (modal.querySelector('input,select,textarea') || modal).focus();
  if (onSubmit)
    document.getElementById('modal-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.currentTarget;
      const submit = form.querySelector('[type=submit]');
      if (submit.disabled) return;
      submit.disabled = true;
      try {
        await onSubmit(new FormData(form), form);
      } catch (error) {
        const box = document.getElementById('form-error');
        if (box) {
          box.className = 'error-text';
          box.textContent = error.message;
        } else toast(error.message, true);
      } finally {
        if (submit.isConnected) submit.disabled = false;
      }
    });
}
/** Cierra el diálogo y devuelve el foco al control que lo abrió. */
export function closeModal() {
  document.getElementById('modal-root').innerHTML = '';
  if (lastFocus?.isConnected) lastFocus.focus();
}
document.addEventListener('keydown', (e) => {
  const modal = document.querySelector('.modal');
  if (!modal) return;
  if (e.key === 'Escape') closeModal();
  if (e.key === 'Tab') {
    const items = [...modal.querySelectorAll('button,input,select,textarea,a[href]')].filter(
      (x) => !x.disabled && x.offsetParent !== null,
    );
    if (!items.length) return;
    const first = items[0],
      last = items.at(-1);
    if (e.shiftKey && (document.activeElement === first || document.activeElement === modal)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});
document.addEventListener(
  'error',
  (e) => {
    if (e.target.matches?.('img[data-fallback]')) {
      e.target.removeAttribute('data-fallback');
      e.target.src = 'assets/placeholder.svg';
    }
  },
  true,
);
/** Solicita confirmación antes de reemplazar datos o ejecutar operaciones destructivas. */
export function confirmModal(title, message, onConfirm, label = 'Confirmar') {
  showModal(
    title,
    /* HTML */ `
      <p class="text-sm leading-7 text-slate-500">${message}</p>
      ${formFooter(label)}
    `,
    {
      onSubmit: (fd, form) => {
        onConfirm();
        if (form.isConnected) closeModal();
      },
    },
  );
}
/** Construye el comprobante interno a partir de la instantánea histórica de la venta. */
export function receipt(s, sale) {
  return /* HTML */ `
    <div class="receipt">
      <h2>prototipo punto ventas</h2>
      <p class="text-center mt-3">
        ${esc(s.settings.receiptAddress)}
        <br />
        ${esc(s.settings.receiptPhone)}
      </p>
      <hr />
      <p>COMPROBANTE INTERNO · #${sale.number}</p>
      <p>${dateTime(sale.createdAt)}</p>
      <p>
        ${esc(sale.channel)} · ${esc(s.users.find((x) => x.id === sale.userId)?.name || 'Usuario')}
      </p>
      ${sale.status === 'Anulada' ? '<h2>ANULADA</h2>' : ''}
      <hr />
      ${sale.items
        .map(
          (i) => /* HTML */ `
            <div class="money-line">
              <span>${i.qty} × ${esc(i.name)}</span>
              <strong>${money(i.total)}</strong>
            </div>
          `,
        )
        .join('')}
      <hr />
      <div class="money-line">
        <span>Subtotal</span>
        <span>${money(sale.subtotal)}</span>
      </div>
      <div class="money-line">
        <span>Descuentos</span>
        <span>−${money(sale.promotionDiscount + sale.manualDiscount)}</span>
      </div>
      ${
        sale.delivery
          ? /* HTML */ `
              <div class="money-line">
                <span>Envío</span>
                <span>${money(sale.delivery)}</span>
              </div>
            `
          : ''
      }
      <div class="money-line">
        <strong>TOTAL</strong>
        <strong>${money(sale.total)}</strong>
      </div>
      <hr />
      ${sale.payments
        .map(
          (p) => /* HTML */ `
            <div class="money-line">
              <span>${esc(p.method)}</span>
              <span>${money(p.amount)}</span>
            </div>
          `,
        )
        .join('')}
      <div class="money-line">
        <span>Vuelto</span>
        <span>${money(sale.change)}</span>
      </div>
      ${
        sale.channel === 'Delivery'
          ? /* HTML */ `
              <hr />
              <p>
                ${esc(sale.recipient)}
                <br />
                ${esc(sale.address)}
              </p>
            `
          : ''
      }
      <hr />
      <p class="text-center">${esc(s.settings.receiptMessage)}</p>
      <p class="text-center mt-3">Demostración · Sin validez tributaria</p>
    </div>
  `;
}
/** Prepara una copia aislada para los estilos de impresión. */
export function printReceipt(s, sale) {
  document.getElementById('print-root').innerHTML = receipt(s, sale);
  window.print();
}

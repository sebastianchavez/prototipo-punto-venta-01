/**
 * Controladores de caja y reportes. Cada renderTemplate utiliza el marcado definido en la página HTML correspondiente.
 */
import { renderTemplate } from './templates.js';
import {
  money,
  dateTime,
  localDay,
  activeShift,
  expectedCash,
  report,
  balance,
  quote,
} from './store.js';
import { METHODS } from './seed.js';
import {
  esc,
  icon,
  image,
  badge,
  btn,
  actionBtn,
  stat,
  table,
  empty,
  field,
  select,
} from './ui.js';
export const categoryIcons = {
  Pizzas: 'pizza',
  Galletones: 'cookie',
  Cafetería: 'coffee',
  Empanadas: 'bag',
  Bebestibles: 'drink',
  Snacks: 'box',
};
/** Prepara catálogo, promociones, carrito y totales para venta.html. */
export function renderPOS(s, ui) {
  let q;
  try {
    q = quote(s, ui.cart);
  } catch {
    q = { items: [], subtotal: 0, promotionDiscount: 0, manualDiscount: 0, delivery: 0, total: 0 };
  }
  const shift = activeShift(s),
    search = ui.search.toLocaleLowerCase('es');
  const products = s.products.filter(
    (p) =>
      p.active &&
      !s.disabledCategories?.includes(p.category) &&
      (ui.category === 'Todas' || p.category === ui.category) &&
      (!search || `${p.name} ${p.sku}`.toLocaleLowerCase('es').includes(search)),
  );
  return renderTemplate('venta-page', {
    content: renderTemplate('venta-fragment-1', {
      content: renderTemplate('venta-fragment-2', { walletIcon: icon('wallet') }),
    }),
    searchIcon: icon('search'),
    search: esc(ui.search),
    actionBtn: actionBtn('layers', 'categories', 'Ver categorías'),
    content2: ['Todas', ...s.categories.filter((c) => !s.disabledCategories?.includes(c))]
      .map((c) =>
        renderTemplate('venta-fragment-3', {
          content: ui.category === c ? 'active' : '',
          c: esc(c),
          symbolIcon: icon(categoryIcons[c] || 'grid'),
          c2: esc(c),
        }),
      )
      .join(''),
    content3: ui.category === 'Todas' ? 'Todos los productos' : esc(ui.category),
    length: products.length,
    checkIcon: icon('check', '!w-3 !h-3'),
    products: products
      .map((p) => {
        const promos = s.promotions.some(
          (x) =>
            x.active && x.productIds.includes(p.id) && x.start <= localDay() && x.end >= localDay(),
        );
        return renderTemplate('venta-fragment-4', {
          id: p.id,
          content: !p.stock ? 'disabled' : '',
          name: esc(p.name),
          image: image(p.image, p.name),
          content2: promos ? 'promo-tag' : '',
          content3: promos
            ? 'Promoción'
            : p.stock <= p.minStock
              ? 'Últimas unidades'
              : `${p.stock} disponibles`,
          category: esc(p.category),
          name2: esc(p.name),
          price: money(p.price),
        });
      })
      .join(''),
    content4: products.length
      ? ''
      : empty('No encontramos productos', 'Prueba con otro nombre, código o categoría.', 'search'),
    helpIcon: icon('help', '!w-3.5 !h-3.5'),
    items: ui.cart.items.reduce((n, i) => n + i.qty, 0),
    content5: Math.max(1000, ...s.sales.map((x) => x.number)) + 1,
    content6: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
    actionBtn2: actionBtn(
      'trash',
      'clear-cart',
      'Vaciar venta',
      !ui.cart.items.length ? 'disabled' : '',
    ),
    content7: ['Al paso', 'Delivery']
      .map((c) =>
        renderTemplate('venta-fragment-5', {
          c: c,
          content: ui.cart.channel === c ? 'active' : '',
          symbolIcon: icon(c === 'Al paso' ? 'store' : 'truck'),
          c2: c,
        }),
      )
      .join(''),
    usersIcon: icon('users', '!w-4 !h-4 text-slate-400'),
    customers: s.customers
      .map((c) =>
        renderTemplate('venta-fragment-6', {
          id: c.id,
          content: ui.cart.customerId === c.id ? 'selected' : '',
          name: esc(c.name),
          content2: c.wholesale ? ' · Mayorista' : '',
        }),
      )
      .join(''),
    actionBtn3: actionBtn('plus', 'new-customer', 'Agregar cliente'),
    content8: ui.cart.mode === 'retail' ? 'selected' : '',
    content9: ui.cart.mode === 'wholesale' ? 'selected' : '',
    content10:
      ui.cart.channel === 'Delivery'
        ? renderTemplate('venta-fragment-7', {
            recipient: esc(ui.cart.recipient),
            address: esc(ui.cart.address),
            delivery: ui.cart.delivery,
          })
        : '',
    content11: !q.items.length
      ? renderTemplate('venta-fragment-10', { bagIcon: icon('bag') })
      : q.items
          .map((i) =>
            renderTemplate('venta-fragment-8', {
              image: image(i.image, i.name),
              name: esc(i.name),
              productId: i.productId,
              name2: esc(i.name),
              qty: i.qty,
              productId2: i.productId,
              name3: esc(i.name),
              content: i.wholesale ? 'Mayorista' : money(i.unitPrice),
              content2: i.discount
                ? renderTemplate('venta-fragment-9', { discount: money(i.discount) })
                : '',
              total: money(i.total),
              productId3: i.productId,
              name4: esc(i.name),
            }),
          )
          .join(''),
    subtotal: money(q.subtotal),
    promotionDiscount: money(q.promotionDiscount),
    plusIcon: icon('plus', '!w-3 !h-3'),
    manualDiscount: money(q.manualDiscount),
    content12: q.delivery
      ? renderTemplate('venta-fragment-11', { delivery: money(q.delivery) })
      : '',
    total: money(q.total),
    content13: !q.items.length ? 'disabled' : '',
    cardIcon: icon('card', '!w-[18px] !h-[18px]'),
    arrowIcon: icon('arrow', '!w-4 !h-4 ml-auto'),
    lockIcon: icon('lock', '!w-3 !h-3'),
    content14: shift
      ? 'Turno abierto · Operación de demostración'
      : 'Abre una caja antes de cobrar',
    total2: money(q.total),
    btn: btn(
      `Ver venta · ${ui.cart.items.reduce((n, i) => n + i.qty, 0)}`,
      'view-cart',
      'btn-primary',
      'bag',
    ),
  });
}
/** Calcula el resumen diario y las alertas de inicio.html. */
export function renderDashboard(s) {
  const r = report(s, localDay(), localDay()),
    shift = activeShift(s),
    low = s.products.filter((p) => p.active && p.stock <= p.minStock);
  return renderTemplate('inicio-page', {
    content: renderTemplate('inicio-fragment-1', {
      content: renderTemplate('inicio-fragment-2', { plusIcon: icon('plus') }),
    }),
    stat: stat('Ventas de hoy', money(r.net), 'trending', `${r.count} ventas registradas`),
    stat2: stat(
      'Ticket promedio',
      money(r.count ? Math.round(r.net / r.count) : 0),
      'receipt',
      'Por venta registrada',
    ),
    stat3: stat(
      'Efectivo en turno',
      money(expectedCash(s)),
      'wallet',
      shift ? 'Caja abierta' : 'Sin turno activo',
    ),
    stat4: stat('Alertas de inventario', low.length, 'box', 'Productos bajo stock mínimo'),
    badge: badge('Esta semana', 'orange'),
    salesChart: salesChart(s, 7),
    trendingIcon: icon('trending', 'text-orange-400'),
    content2:
      r.top
        .slice(0, 4)
        .map((p, i) =>
          renderTemplate('inicio-fragment-3', {
            content: i + 1,
            image: image(p.image, p.name, 'w-10 h-10 rounded-lg object-cover'),
            name: esc(p.name),
            qty: p.qty,
            total: money(p.total),
          }),
        )
        .join('') || empty('Todavía no hay ventas'),
    table: table(
      ['Venta', 'Canal', 'Total', ''],
      [...s.sales]
        .reverse()
        .slice(0, 5)
        .map((x) =>
          renderTemplate('inicio-fragment-4', {
            number: x.number,
            channel: esc(x.channel),
            total: money(x.total),
            badge: badge(x.status, x.status === 'Anulada' ? 'red' : ''),
          }),
        ),
    ),
    table2: table(
      ['Producto', 'Stock', 'Mínimo'],
      low.map((p) =>
        renderTemplate('inicio-fragment-5', {
          name: esc(p.name),
          badge: badge(`${p.stock} unidades`, 'red'),
          minStock: p.minStock,
        }),
      ),
    ),
  });
}
/** Genera los valores del gráfico semanal, sin bibliotecas de gráficos. */
export function salesChart(s, days, startDate = new Date()) {
  const points = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(startDate);
    date.setDate(date.getDate() - i);
    points.push({ date, value: Math.max(0, report(s, localDay(date), localDay(date)).net) });
  }
  const max = Math.max(1, ...points.map((x) => x.value));
  return renderTemplate('inicio-chart-page', {
    points: points
      .map((p) =>
        renderTemplate('inicio-chart-fragment-1', {
          Math: Math.max(2, (p.value / max) * 150),
          localDay: esc(localDay(p.date)),
          value: money(p.value),
          date: p.date.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }),
        }),
      )
      .join(''),
  });
}
/** Aplica los filtros del historial antes de completar ventas.html. */
export function renderSales(s, filters) {
  const rows = [...s.sales].reverse().filter(
    (x) =>
      (!filters.start || localDay(x.createdAt) >= filters.start) &&
      (!filters.end || localDay(x.createdAt) <= filters.end) &&
      (!filters.channel || x.channel === filters.channel) &&
      (!filters.user || x.userId === filters.user) &&
      (!filters.method || x.payments.some((p) => p.method === filters.method)) &&
      (!filters.search ||
        String(x.number).includes(filters.search) ||
        s.customers
          .find((c) => c.id === x.customerId)
          ?.name.toLowerCase()
          .includes(filters.search.toLowerCase())),
  );
  return renderTemplate('ventas-page', {
    content: renderTemplate('ventas-fragment-1', {}),
    field: field('Desde', 'start', 'date', filters.start),
    field2: field('Hasta', 'end', 'date', filters.end),
    select: select('Canal', 'channel', [['', 'Todos'], 'Al paso', 'Delivery'], filters.channel),
    select2: select(
      'Usuario',
      'user',
      [['', 'Todos'], ...s.users.map((x) => [x.id, x.name])],
      filters.user,
    ),
    select3: select('Medio de pago', 'method', [['', 'Todos'], ...METHODS], filters.method),
    btn: btn('Limpiar', 'clear-sales-filters', 'btn-sm'),
    length: rows.length,
    rows: money(rows.filter((x) => x.status === 'Completada').reduce((n, x) => n + x.total, 0)),
    table: table(
      ['Venta / fecha', 'Cliente', 'Canal', 'Pago', 'Total', 'Estado', ''],
      rows.map((x) =>
        renderTemplate('ventas-fragment-2', {
          number: x.number,
          createdAt: dateTime(x.createdAt),
          content: esc(s.customers.find((c) => c.id === x.customerId)?.name || 'Cliente general'),
          badge: badge(x.channel, x.channel === 'Delivery' ? 'blue' : 'gray'),
          content2: x.payments.map((p) => esc(p.method)).join(' + ') || 'Sin cargo',
          total: money(x.total),
          badge2: badge(x.status, x.status === 'Anulada' ? 'red' : ''),
          actionBtn: actionBtn('eye', 'sale-detail', 'Ver detalle', `data-id="${x.id}"`),
        }),
      ),
    ),
  });
}
/** Separa los movimientos del turno abierto de los cierres históricos. */
export function renderCash(s) {
  const sh = activeShift(s),
    movements = sh ? s.movements.filter((x) => x.shiftId === sh.id) : [],
    hist = [...s.shifts].reverse();
  return renderTemplate('caja-page', {
    content: renderTemplate('caja-fragment-1', {
      content: sh
        ? btn('Cerrar turno', 'close-shift', 'btn-primary', 'lock')
        : btn('Abrir caja', 'open-shift', 'btn-primary', 'plus'),
    }),
    stat: stat(
      'Estado de caja',
      sh ? 'Abierta' : 'Cerrada',
      'wallet',
      sh ? dateTime(sh.openedAt) : 'Abre un turno para comenzar',
    ),
    stat2: stat(
      'Fondo inicial',
      money(sh?.opening || 0),
      'dollar',
      s.users.find((u) => u.id === sh?.userId)?.name || 'Sin turno activo',
    ),
    stat3: stat(
      'Efectivo esperado',
      money(expectedCash(s)),
      'receipt',
      'Incluye ingresos y retiros del turno',
    ),
    btn: btn('Ingreso', 'cash-in', 'btn-sm', 'plus', !sh ? 'disabled' : ''),
    btn2: btn('Retiro', 'cash-out', 'btn-sm', 'minus', !sh ? 'disabled' : ''),
    table: table(
      ['Fecha', 'Movimiento', 'Motivo', 'Medio', 'Monto'],
      [...movements].reverse().map((m) =>
        renderTemplate('caja-fragment-2', {
          createdAt: dateTime(m.createdAt),
          badge: badge(m.type, m.amount < 0 ? 'orange' : ''),
          reason: esc(m.reason),
          method: esc(m.method),
          content: m.amount < 0 ? 'text-red-400' : 'text-emerald-600',
          amount: money(m.amount),
        }),
      ),
    ),
    length: hist.length,
    table2: table(
      ['Apertura', 'Usuario', 'Cierre', 'Fondo', 'Esperado', 'Contado', 'Diferencia'],
      hist.map((x) =>
        renderTemplate('caja-fragment-3', {
          openedAt: dateTime(x.openedAt),
          name: esc(s.users.find((u) => u.id === x.userId)?.name),
          content: x.closedAt ? dateTime(x.closedAt) : badge('En curso'),
          opening: money(x.opening),
          content2: money(x.closedAt ? x.expected : expectedCash(s, x)),
          content3: x.closedAt ? money(x.counted) : '—',
          content4: x.closedAt ? badge(money(x.difference), x.difference ? 'red' : '') : '—',
        }),
      ),
    ),
  });
}
/** Completa reportes.html con resultados del período y saldos globales. */
export function renderReports(s, filters) {
  const r = report(s, filters.start, filters.end),
    b = balance(s);
  return renderTemplate('reportes-page', {
    content: renderTemplate('reportes-fragment-1', {}),
    field: field('Desde', 'start', 'date', filters.start),
    field2: field('Hasta', 'end', 'date', filters.end),
    filterIcon: icon('filter'),
    btn: btn('Este mes', 'report-month'),
    btn2: btn('Exportar CSV', 'export-report', '', 'download'),
    stat: stat(
      'Ventas netas',
      money(r.net),
      'trending',
      `${r.count} ventas · ${r.refundCount} anulaciones`,
    ),
    stat2: stat('Costo de productos', money(r.cost), 'box', 'Costo histórico de cada venta'),
    stat3: stat('Margen bruto', `${r.margin}%`, 'chart', money(r.net - r.cost)),
    stat4: stat(
      'Resultado del período',
      money(r.result),
      'wallet',
      'Después de gastos operacionales',
    ),
    badge: badge('Gestión estimada', 'orange'),
    content2: [
      ['Ventas brutas y envío', r.gross],
      ['Descuentos', -r.discounts],
      ['Anulaciones del período', -r.refunded],
      ['Ventas netas', r.net],
      ['Costo de productos vendidos', -r.cost],
      ['Gastos operacionales', -r.expenses],
      ['Resultado del período', r.result],
    ]
      .map(([label, v], i) =>
        renderTemplate('reportes-fragment-2', {
          content: i === 6 ? '!border-0 !text-orange-500 !font-semibold' : '',
          label: label,
          v: money(v),
        }),
      )
      .join(''),
    cardIcon: icon('card', 'text-slate-400'),
    Object: Object.entries(r.paymentTotals)
      .map(([label, v]) =>
        renderTemplate('reportes-fragment-3', {
          label: label,
          v: money(v),
          Math: Math.min(100, Math.max(0, (v / Math.max(1, r.net)) * 100)),
        }),
      )
      .join(''),
    Object2: Object.entries(r.channels)
      .map(([c, v]) => renderTemplate('reportes-fragment-4', { c: c, v: money(v) }))
      .join(''),
    content3: [
      ['Efectivo acumulado', b.cash],
      ['Saldos no efectivos', b.nonCash],
      ['Inventario valorizado', b.inventory],
      ['Total activos', b.assets],
      ['Deuda a proveedores', b.debt],
      ['Capital inicial', b.capital],
      ['Ajuste de apertura demo', b.openingAdjustment],
      ['Resultados acumulados', b.result],
      ['Patrimonio estimado', b.equity],
    ]
      .map(([l, v]) => renderTemplate('reportes-fragment-5', { l: l, v: money(v) }))
      .join(''),
    badge2: badge('Período seleccionado', 'gray'),
    table: table(
      ['Producto', 'Unidades', 'Venta de productos'],
      r.top.map((p) =>
        renderTemplate('reportes-fragment-6', {
          name: esc(p.name),
          qty: p.qty,
          total: money(p.total),
        }),
      ),
    ),
  });
}

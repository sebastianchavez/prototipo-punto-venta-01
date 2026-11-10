/**
 * Capa de datos y reglas de negocio. Las páginas comparten la misma clave de localStorage; las operaciones se validan y guardan de forma atómica.
 */
import { createSeed, KEY, VERSION, METHODS } from './seed.js';
export const uid = (prefix) =>
  `${prefix}-${globalThis.crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2)}`;
export const localDay = (date = new Date()) =>
  new Date(date).toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });
export const money = (n) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(n || 0);
export const dateTime = (d) =>
  new Date(d).toLocaleString('es-CL', {
    timeZone: 'America/Santiago',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
export function integer(value, label = 'Importe', min = 0) {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < min)
    throw new Error(`${label}: ingresa un número entero igual o mayor a ${min}.`);
  return n;
}
export function assert(ok, message) {
  if (!ok) throw new Error(message);
}
export const currentUser = (s) => s.users.find((x) => x.id === s.sessionUserId && x.active);
export const activeShift = (s) => s.shifts.find((x) => !x.closedAt);
export function requireShift(s) {
  const sh = activeShift(s);
  assert(sh, 'Abre un turno de caja antes de realizar esta operación.');
  return sh;
}
export function requireAdmin(s) {
  assert(currentUser(s)?.role === 'Administrador', 'Esta operación requiere un administrador.');
}
const requiredArrays = [
  'products',
  'categories',
  'users',
  'customers',
  'suppliers',
  'promotions',
  'recipes',
  'sales',
  'movements',
  'shifts',
  'stockMovements',
  'purchases',
  'expenses',
];
/** Valida estructura, referencias y totales antes de cargar o restaurar un respaldo. */
export function validateState(s) {
  assert(
    s && typeof s === 'object' && s.version === VERSION,
    'El respaldo no es compatible con esta versión.',
  );
  for (const key of requiredArrays)
    assert(Array.isArray(s[key]), `Respaldo inválido: falta ${key}.`);
  assert(s.settings && typeof s.settings === 'object', 'Falta la configuración del respaldo.');
  for (const key of requiredArrays.filter((k) => k !== 'categories')) {
    const ids = s[key].map((x) => x?.id);
    assert(
      ids.every((x) => typeof x === 'string' && x) && new Set(ids).size === ids.length,
      `Identificadores inválidos en ${key}.`,
    );
  }
  const text = (v) => typeof v === 'string';
  const validDate = (v) => text(v) && Number.isFinite(Date.parse(v));
  const numeric = (v, label, min = 0) => {
    assert(typeof v === 'number', `${label}: valor numérico inválido en el respaldo.`);
    return integer(v, label, min);
  };
  numeric(s.revision, 'Revisión');
  for (const p of s.products) {
    assert(
      text(p.name) &&
        p.name.trim() &&
        text(p.sku) &&
        p.sku.trim() &&
        s.categories.includes(p.category),
      'Producto inválido.',
    );
    for (const k of ['price', 'wholesalePrice', 'wholesaleMin', 'cost', 'stock', 'minStock'])
      numeric(p[k], k, k === 'wholesaleMin' ? 1 : 0);
    assert(typeof p.active === 'boolean' && text(p.image), 'Producto inválido.');
  }
  assert(
    new Set(s.products.map((p) => p.sku.toLowerCase())).size === s.products.length,
    'Códigos de producto duplicados.',
  );
  assert(
    s.categories.every(text) && new Set(s.categories).size === s.categories.length,
    'Categorías inválidas.',
  );
  if (s.disabledCategories !== undefined)
    assert(
      Array.isArray(s.disabledCategories) &&
        s.disabledCategories.every((x) => s.categories.includes(x)),
      'Estado de categorías inválido.',
    );
  for (const u of s.users)
    assert(
      text(u.name) && ['Administrador', 'Cajero'].includes(u.role) && typeof u.active === 'boolean',
      'Usuario inválido.',
    );
  assert(
    s.users.some((x) => x.active && x.role === 'Administrador'),
    'Debe existir un administrador activo.',
  );
  assert(
    s.sessionUserId === null || s.users.some((x) => x.id === s.sessionUserId && x.active),
    'Sesión inválida.',
  );
  for (const x of [...s.customers, ...s.suppliers])
    assert(text(x.name) && text(x.email) && text(x.phone) && text(x.address), 'Contacto inválido.');
  for (const x of s.promotions) {
    assert(
      text(x.name) &&
        typeof x.active === 'boolean' &&
        Array.isArray(x.productIds) &&
        x.productIds.length &&
        x.productIds.every((id) => s.products.some((p) => p.id === id)) &&
        ['percent', 'fixed'].includes(x.type) &&
        validDate(x.start) &&
        validDate(x.end) &&
        x.start <= x.end,
      'Promoción inválida.',
    );
    numeric(x.value, 'Descuento', 1);
    assert(x.type !== 'percent' || x.value <= 100, 'Porcentaje inválido.');
  }
  for (const x of s.recipes) {
    assert(
      text(x.name) && text(x.ingredients) && text(x.instructions) && text(x.image),
      'Receta inválida.',
    );
    numeric(x.yield, 'Rendimiento', 1);
  }
  for (const x of s.sales) {
    assert(
      validDate(x.createdAt) &&
        ['Completada', 'Anulada'].includes(x.status) &&
        Array.isArray(x.items) &&
        x.items.length > 0 &&
        Array.isArray(x.payments) &&
        text(x.token),
      'Venta inválida.',
    );
    for (const k of [
      'number',
      'total',
      'subtotal',
      'promotionDiscount',
      'manualDiscount',
      'delivery',
      'cost',
      'change',
      'tendered',
    ])
      numeric(x[k], k);
    for (const i of x.items) {
      assert(
        s.products.some((p) => p.id === i.productId) &&
          text(i.name) &&
          text(i.sku) &&
          text(i.image),
        'Producto de venta inválido.',
      );
      for (const k of ['qty', 'unitPrice', 'unitCost', 'discount', 'total'])
        numeric(i[k], k, k === 'qty' ? 1 : 0);
      assert(i.total === i.unitPrice * i.qty - i.discount, 'Total de producto inconsistente.');
    }
    for (const p of x.payments) {
      assert(METHODS.includes(p.method), 'Medio de pago inválido.');
      numeric(p.amount, 'Pago');
    }
    assert(x.payments.reduce((a, p) => a + p.amount, 0) === x.total, 'Pagos inconsistentes.');
    assert(
      x.subtotal === x.items.reduce((n, i) => n + i.unitPrice * i.qty, 0) &&
        x.cost === x.items.reduce((n, i) => n + i.unitCost * i.qty, 0) &&
        x.promotionDiscount === x.items.reduce((n, i) => n + i.discount, 0) &&
        x.total === x.subtotal - x.promotionDiscount - x.manualDiscount + x.delivery &&
        x.tendered === x.total + x.change,
      'Totales de venta inconsistentes.',
    );
    assert(
      s.users.some((u) => u.id === x.userId) &&
        s.shifts.some((sh) => sh.id === x.shiftId) &&
        ['Al paso', 'Delivery'].includes(x.channel) &&
        ['retail', 'wholesale'].includes(x.mode) &&
        (!x.customerId || s.customers.some((c) => c.id === x.customerId)),
      'Referencias de venta inválidas.',
    );
    if (x.status === 'Anulada')
      assert(
        validDate(x.voidedAt) &&
          text(x.voidReason) &&
          s.users.some((u) => u.id === x.voidUserId) &&
          s.shifts.some((sh) => sh.id === x.voidShiftId),
        'Anulación inválida.',
      );
  }
  assert(
    new Set(s.sales.map((x) => x.token)).size === s.sales.length &&
      new Set(s.sales.map((x) => x.number)).size === s.sales.length,
    'Ventas duplicadas.',
  );
  for (const x of s.movements) {
    assert(
      validDate(x.createdAt) &&
        METHODS.includes(x.method) &&
        Number.isSafeInteger(x.amount) &&
        text(x.reason),
      'Movimiento inválido.',
    );
  }
  assert(s.shifts.filter((x) => !x.closedAt).length <= 1, 'Solo puede existir un turno abierto.');
  for (const x of s.shifts) {
    assert(validDate(x.openedAt) && s.users.some((u) => u.id === x.userId), 'Turno inválido.');
    numeric(x.opening, 'Fondo');
    if (x.closedAt) {
      assert(validDate(x.closedAt), 'Cierre inválido.');
      numeric(x.counted, 'Conteo');
      assert(
        Number.isSafeInteger(x.expected) &&
          Number.isSafeInteger(x.difference) &&
          x.difference === x.counted - x.expected,
        'Arqueo inválido.',
      );
    }
  }
  for (const x of s.stockMovements) {
    assert(
      validDate(x.createdAt) &&
        s.products.some((p) => p.id === x.productId) &&
        Number.isSafeInteger(x.qty) &&
        text(x.reason),
      'Movimiento de inventario inválido.',
    );
  }
  for (const x of s.purchases) {
    assert(
      validDate(x.createdAt) &&
        typeof x.paid === 'boolean' &&
        typeof x.received === 'boolean' &&
        s.suppliers.some((p) => p.id === x.supplierId) &&
        Array.isArray(x.items) &&
        x.items.length > 0 &&
        METHODS.includes(x.paymentMethod),
      'Compra inválida.',
    );
    numeric(x.total, 'Total compra');
    numeric(x.number, 'Número compra', 1);
    for (const i of x.items) {
      assert(
        s.products.some((p) => p.id === i.productId) && text(i.name),
        'Producto de compra inválido.',
      );
      numeric(i.qty, 'Cantidad', 1);
      numeric(i.cost, 'Costo');
    }
    assert(
      x.total === x.items.reduce((n, i) => n + i.qty * i.cost, 0),
      'Total de compra inconsistente.',
    );
  }
  for (const x of s.expenses) {
    assert(
      validDate(x.createdAt) &&
        text(x.description) &&
        text(x.category) &&
        METHODS.includes(x.method),
      'Gasto inválido.',
    );
    numeric(x.amount, 'Gasto', 1);
  }
  for (const k of ['initialCapital', 'initialCash', 'initialNonCash']) numeric(s.settings[k], k);
  for (const k of ['receiptAddress', 'receiptPhone', 'receiptMessage'])
    assert(text(s.settings[k]), 'Configuración inválida.');
  return true;
}
export class Store {
  constructor(storage = globalThis.localStorage) {
    this.storage = storage;
    this.error = '';
    try {
      const raw = storage.getItem(KEY);
      this.state = raw ? JSON.parse(raw) : createSeed();
      validateState(this.state);
      if (!raw) storage.setItem(KEY, JSON.stringify(this.state));
    } catch (error) {
      this.state = null;
      this.error = `No se pudieron cargar o guardar los datos: ${error.message}`;
    }
  }
  // Trabaja sobre una copia: si validar o guardar falla, el estado visible no cambia.
  transaction(fn, { admin = false } = {}) {
    assert(this.state, 'No hay almacenamiento disponible.');
    if (admin) requireAdmin(this.state);
    const latest = this.storage.getItem(KEY);
    assert(
      latest && JSON.parse(latest).revision === this.state.revision,
      'Los datos cambiaron en otra pestaña. Recarga antes de continuar.',
    );
    const next = structuredClone(this.state);
    const result = fn(next);
    next.revision = (next.revision || 0) + 1;
    validateState(next);
    try {
      this.storage.setItem(KEY, JSON.stringify(next));
    } catch {
      throw new Error(
        'No se pudo guardar. El almacenamiento está lleno o bloqueado; la operación no se realizó.',
      );
    }
    this.state = next;
    return result;
  }
  restore(data) {
    requireAdmin(this.state);
    const next = structuredClone(data);
    validateState(next);
    next.revision = (this.state.revision || 0) + 1;
    this.storage.setItem(KEY, JSON.stringify(next));
    this.state = next;
  }
  reset() {
    requireAdmin(this.state);
    const next = createSeed();
    next.revision = (this.state.revision || 0) + 1;
    this.storage.setItem(KEY, JSON.stringify(next));
    this.state = next;
  }
}
/** Calcula precios, mejor promoción, descuentos y envío sin modificar el estado. */
export function quote(s, cart, now = new Date()) {
  const day = localDay(now);
  const seen = new Set();
  const items = (cart.items || []).map((line) => {
    assert(!seen.has(line.productId), 'Producto repetido en carrito.');
    seen.add(line.productId);
    const p = s.products.find(
      (x) => x.id === line.productId && x.active && !s.disabledCategories?.includes(x.category),
    );
    assert(p, 'Un producto ya no está disponible.');
    const qty = integer(line.qty, 'Cantidad', 1);
    assert(qty <= p.stock, `Stock insuficiente para ${p.name}. Disponible: ${p.stock}.`);
    const wholesale = cart.mode === 'wholesale' && qty >= p.wholesaleMin;
    const unitPrice = wholesale ? p.wholesalePrice : p.price;
    let discount = 0;
    if (cart.mode !== 'wholesale')
      for (const promo of s.promotions.filter(
        (x) => x.active && x.productIds.includes(p.id) && x.start <= day && x.end >= day,
      )) {
        discount = Math.max(
          discount,
          promo.type === 'percent'
            ? Math.round((unitPrice * promo.value) / 100)
            : Math.min(unitPrice, promo.value),
        );
      }
    return {
      productId: p.id,
      name: p.name,
      sku: p.sku,
      image: p.image,
      qty,
      unitPrice,
      unitCost: p.cost,
      discount: discount * qty,
      total: (unitPrice - discount) * qty,
      wholesale,
    };
  });
  const subtotal = items.reduce((n, i) => n + i.unitPrice * i.qty, 0),
    promotionDiscount = items.reduce((n, i) => n + i.discount, 0),
    manualDiscount = integer(cart.manualDiscount || 0, 'Descuento'),
    delivery = cart.channel === 'Delivery' ? integer(cart.delivery || 0, 'Envío') : 0;
  assert(
    manualDiscount <= subtotal - promotionDiscount,
    'El descuento no puede superar el valor de los productos.',
  );
  return {
    items,
    subtotal,
    promotionDiscount,
    manualDiscount,
    delivery,
    total: subtotal - promotionDiscount - manualDiscount + delivery,
    cost: items.reduce((n, i) => n + i.unitCost * i.qty, 0),
  };
}
/** Agrega un movimiento financiero asociado al turno y a la operación de origen. */
function movement(s, { type, method, amount, reason, ref = '', shiftId }) {
  s.movements.push({
    id: uid('mov'),
    createdAt: new Date().toISOString(),
    userId: s.sessionUserId,
    shiftId: shiftId ?? activeShift(s)?.id ?? null,
    type,
    method,
    amount,
    reason,
    ref,
  });
}
/** Actualiza existencias y conserva la trazabilidad del movimiento. */
function stockMove(s, p, qty, reason, ref = '') {
  p.stock += qty;
  s.stockMovements.push({
    id: uid('stock'),
    productId: p.id,
    createdAt: new Date().toISOString(),
    userId: s.sessionUserId,
    qty,
    reason,
    ref,
  });
}
/** Guarda el costo histórico y distribuye el pago neto del vuelto. */
export function completeSale(s, cart, paymentInput, token) {
  assert(token && !s.sales.some((x) => x.token === token), 'Esta venta ya fue registrada.');
  const shift = requireShift(s);
  const q = quote(s, cart);
  assert(q.items.length, 'Agrega productos a la venta.');
  if (cart.channel === 'Delivery')
    assert(
      cart.recipient?.trim() && cart.address?.trim(),
      'Completa el destinatario y la dirección de entrega.',
    );
  const entries = METHODS.map((method) => ({
    method,
    amount: integer(paymentInput[method] || 0, `Pago ${method}`),
  })).filter((x) => x.amount > 0);
  const tendered = entries.reduce((n, p) => n + p.amount, 0),
    cash = entries.find((p) => p.method === 'Efectivo'),
    change = tendered - q.total;
  assert(tendered >= q.total, 'El monto recibido no cubre el total.');
  assert(
    change === 0 || (cash && cash.amount >= change),
    'El excedente solo puede devolverse desde el pago en efectivo.',
  );
  if (cash) cash.amount -= change;
  const sale = {
    id: uid('sale'),
    number: Math.max(1000, ...s.sales.map((x) => x.number)) + 1,
    createdAt: new Date().toISOString(),
    userId: s.sessionUserId,
    shiftId: shift.id,
    customerId: cart.customerId || '',
    channel: cart.channel || 'Al paso',
    mode: cart.mode || 'retail',
    recipient: cart.recipient || '',
    address: cart.address || '',
    ...q,
    payments: entries.filter((x) => x.amount > 0),
    tendered,
    change,
    status: 'Completada',
    token,
  };
  s.sales.push(sale);
  for (const i of q.items)
    stockMove(
      s,
      s.products.find((p) => p.id === i.productId),
      -i.qty,
      `Venta #${sale.number}`,
      sale.id,
    );
  for (const p of sale.payments)
    movement(s, {
      type: 'Venta',
      ...p,
      reason: `Venta #${sale.number}`,
      ref: sale.id,
      shiftId: shift.id,
    });
  return sale.id;
}
/** Revierte stock y pagos una sola vez, en el turno de devolución. */
export function voidSale(s, id, reason) {
  const shift = requireShift(s),
    sale = s.sales.find((x) => x.id === id);
  assert(sale?.status === 'Completada', 'La venta ya está anulada o no existe.');
  assert(reason?.trim(), 'Indica el motivo de anulación.');
  sale.status = 'Anulada';
  sale.voidedAt = new Date().toISOString();
  sale.voidReason = reason.trim();
  sale.voidUserId = s.sessionUserId;
  sale.voidShiftId = shift.id;
  for (const i of sale.items)
    stockMove(
      s,
      s.products.find((p) => p.id === i.productId),
      i.qty,
      `Anulación #${sale.number}`,
      sale.id,
    );
  for (const p of sale.payments)
    movement(s, {
      type: 'Devolución',
      method: p.method,
      amount: -p.amount,
      reason: `Anulación #${sale.number}: ${reason}`,
      ref: sale.id,
      shiftId: shift.id,
    });
}
export const expectedCash = (s, shift = activeShift(s)) =>
  shift
    ? shift.opening +
      s.movements
        .filter((x) => x.shiftId === shift.id && x.method === 'Efectivo')
        .reduce((n, x) => n + x.amount, 0)
    : 0;
/** Asigna un fondo inicial sin tratarlo como una venta. */
export function openShift(s, opening) {
  assert(!activeShift(s), 'Ya existe un turno abierto.');
  const sh = {
    id: uid('shift'),
    userId: s.sessionUserId,
    openedAt: new Date().toISOString(),
    opening: integer(opening, 'Fondo inicial'),
    closedAt: null,
    counted: null,
    expected: null,
    difference: null,
  };
  s.shifts.push(sh);
  return sh.id;
}
/** Conserva el arqueo esperado, contado y la diferencia de cierre. */
export function closeShift(s, counted) {
  const sh = requireShift(s);
  sh.expected = expectedCash(s, sh);
  sh.counted = integer(counted, 'Efectivo contado');
  sh.difference = sh.counted - sh.expected;
  sh.closedAt = new Date().toISOString();
  sh.closedBy = s.sessionUserId;
}
/** Registra un ingreso o retiro manual de efectivo con motivo. */
export function cashMovement(s, type, amount, reason) {
  const sh = requireShift(s);
  assert(['Ingreso', 'Retiro'].includes(type), 'Tipo inválido.');
  assert(reason?.trim(), 'Indica un motivo.');
  const n = integer(amount, 'Monto', 1);
  assert(
    type !== 'Retiro' || n <= expectedCash(s, sh),
    'El retiro supera el efectivo disponible en el turno.',
  );
  movement(s, {
    type,
    method: 'Efectivo',
    amount: type === 'Retiro' ? -n : n,
    reason: reason.trim(),
    shiftId: sh.id,
  });
}
/** Aplica entrada, merma o ajuste sin permitir existencias negativas. */
export function adjustStock(s, id, type, qty, reason) {
  requireAdmin(s);
  const p = s.products.find((x) => x.id === id);
  assert(p, 'Producto no encontrado.');
  assert(reason?.trim(), 'Indica el motivo del ajuste.');
  const n = integer(qty, 'Cantidad', type === 'Ajuste' ? 0 : 1);
  const delta = type === 'Ajuste' ? n - p.stock : type === 'Merma' ? -n : n;
  assert(p.stock + delta >= 0, 'La merma supera las existencias.');
  stockMove(s, p, delta, `${type}: ${reason.trim()}`);
}
/** Registra el compromiso de compra sin afectar todavía el inventario. */
export function savePurchase(s, data) {
  requireAdmin(s);
  assert(
    s.suppliers.some((x) => x.id === data.supplierId),
    'Selecciona un proveedor.',
  );
  assert(data.items?.length, 'Agrega al menos un producto.');
  const seen = new Set();
  const items = data.items.map((i) => {
    const p = s.products.find((x) => x.id === i.productId);
    assert(p && !seen.has(p.id), 'Producto de compra inválido o repetido.');
    seen.add(p.id);
    return {
      productId: p.id,
      name: p.name,
      qty: integer(i.qty, 'Cantidad', 1),
      cost: integer(i.cost, 'Costo'),
    };
  });
  const purchase = {
    id: uid('buy'),
    number: Math.max(0, ...s.purchases.map((x) => x.number)) + 1,
    createdAt: new Date().toISOString(),
    supplierId: data.supplierId,
    items,
    total: items.reduce((n, i) => n + i.qty * i.cost, 0),
    received: false,
    paid: false,
    paymentMethod: data.paymentMethod || 'Transferencia',
  };
  s.purchases.push(purchase);
  return purchase.id;
}
/** Recibe cada compra una sola vez y actualiza el último costo unitario. */
export function receivePurchase(s, id) {
  requireAdmin(s);
  const p = s.purchases.find((x) => x.id === id);
  assert(p && !p.received, 'La compra ya fue recibida.');
  p.received = true;
  p.receivedAt = new Date().toISOString();
  for (const i of p.items) {
    const product = s.products.find((x) => x.id === i.productId);
    stockMove(s, product, i.qty, `Recepción de compra #${p.number}`, p.id);
    product.cost = i.cost;
  }
}
/** Registra el pago independientemente del momento de recepción. */
export function payPurchase(s, id, method) {
  requireAdmin(s);
  assert(METHODS.includes(method), 'Medio de pago inválido.');
  const p = s.purchases.find((x) => x.id === id);
  assert(p && !p.paid, 'La compra ya está pagada.');
  if (method === 'Efectivo') {
    const sh = requireShift(s);
    assert(expectedCash(s, sh) >= p.total, 'No hay suficiente efectivo en el turno.');
  }
  p.paid = true;
  p.paidAt = new Date().toISOString();
  p.paymentMethod = method;
  movement(s, {
    type: 'Compra',
    method,
    amount: -p.total,
    reason: `Pago compra #${p.number}`,
    ref: p.id,
  });
}
/** Registra el gasto y, si es efectivo, verifica el saldo del turno. */
export function addExpense(s, data) {
  requireAdmin(s);
  const amount = integer(data.amount, 'Monto', 1);
  assert(data.description?.trim() && data.category?.trim(), 'Completa la descripción y categoría.');
  assert(METHODS.includes(data.method), 'Medio de pago inválido.');
  if (data.method === 'Efectivo') {
    const sh = requireShift(s);
    assert(expectedCash(s, sh) >= amount, 'No hay suficiente efectivo en el turno.');
  }
  const e = {
    id: uid('expense'),
    createdAt: new Date().toISOString(),
    userId: s.sessionUserId,
    description: data.description.trim(),
    category: data.category,
    amount,
    method: data.method,
  };
  s.expenses.push(e);
  movement(s, {
    type: 'Gasto',
    method: e.method,
    amount: -amount,
    reason: e.description,
    ref: e.id,
  });
}
/** Reconoce ventas y anulaciones según la fecha de cada operación. */
export function report(s, start = '', end = '') {
  const inPeriod = (d) => (!start || localDay(d) >= start) && (!end || localDay(d) <= end);
  const booked = s.sales.filter((x) => inPeriod(x.createdAt));
  const refunds = s.sales.filter((x) => x.status === 'Anulada' && inPeriod(x.voidedAt));
  const sum = (xs, f) => xs.reduce((n, x) => n + f(x), 0);
  const gross = sum(booked, (x) => x.subtotal + x.delivery),
    discounts = sum(booked, (x) => x.promotionDiscount + x.manualDiscount),
    refunded = sum(refunds, (x) => x.total),
    net = gross - discounts - refunded;
  const cost = sum(booked, (x) => x.cost) - sum(refunds, (x) => x.cost),
    expenses = sum(
      s.expenses.filter((x) => inPeriod(x.createdAt)),
      (x) => x.amount,
    );
  const paymentTotals = Object.fromEntries(
    METHODS.map((method) => [
      method,
      sum(booked, (x) =>
        sum(
          x.payments.filter((p) => p.method === method),
          (p) => p.amount,
        ),
      ) -
        sum(refunds, (x) =>
          sum(
            x.payments.filter((p) => p.method === method),
            (p) => p.amount,
          ),
        ),
    ]),
  );
  const channels = Object.fromEntries(
    ['Al paso', 'Delivery'].map((channel) => [
      channel,
      sum(
        booked.filter((x) => x.channel === channel),
        (x) => x.total,
      ) -
        sum(
          refunds.filter((x) => x.channel === channel),
          (x) => x.total,
        ),
    ]),
  );
  const top = {};
  for (const sale of booked)
    for (const i of sale.items) {
      top[i.productId] ??= { id: i.productId, name: i.name, image: i.image, qty: 0, total: 0 };
      top[i.productId].qty += i.qty;
      top[i.productId].total += i.total;
    }
  for (const sale of refunds)
    for (const i of sale.items)
      if (top[i.productId]) {
        top[i.productId].qty -= i.qty;
        top[i.productId].total -= i.total;
      }
  return {
    gross,
    discounts,
    refunded,
    net,
    cost,
    expenses,
    result: net - cost - expenses,
    margin: net ? Math.round(((net - cost) / net) * 100) : 0,
    count: booked.length,
    refundCount: refunds.length,
    paymentTotals,
    channels,
    top: Object.values(top)
      .filter((x) => x.qty > 0)
      .sort((a, b) => b.qty - a.qty),
  };
}
/** Reconcilia saldos, inventario, deuda y patrimonio para la demostración. */
export function balance(s) {
  const cash =
    s.settings.initialCash +
    s.movements.filter((x) => x.method === 'Efectivo').reduce((n, x) => n + x.amount, 0);
  const nonCash =
    s.settings.initialNonCash +
    s.movements.filter((x) => x.method !== 'Efectivo').reduce((n, x) => n + x.amount, 0) -
    s.expenses
      .filter((x) => !s.movements.some((m) => m.ref === x.id) && x.method !== 'Efectivo')
      .reduce((n, x) => n + x.amount, 0);
  const inventory = s.products.reduce((n, p) => n + p.stock * p.cost, 0),
    debt = s.purchases.filter((x) => !x.paid).reduce((n, p) => n + p.total, 0),
    result = report(s).result;
  // Opening inventory and historical demonstrations establish the opening equity reconciliation.
  const equity = cash + nonCash + inventory - debt,
    openingAdjustment = equity - s.settings.initialCapital - result;
  return {
    cash,
    nonCash,
    inventory,
    debt,
    result,
    capital: s.settings.initialCapital,
    openingAdjustment,
    equity,
    assets: cash + nonCash + inventory,
  };
}

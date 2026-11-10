/**
 * Pruebas de los flujos de negocio con almacenamiento en memoria. Nunca modifican los datos del navegador.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createSeed, KEY } from '../js/seed.js';
import {
  Store,
  validateState,
  quote,
  completeSale,
  voidSale,
  activeShift,
  expectedCash,
  openShift,
  closeShift,
  cashMovement,
  adjustStock,
  savePurchase,
  receivePurchase,
  payPurchase,
  addExpense,
  report,
  balance,
  localDay,
} from '../js/store.js';
const memory = () => {
  const map = new Map();
  return { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, v) };
};
const setup = () => new Store(memory());
const cart = (items = [{ productId: 'p1', qty: 1 }], extra = {}) => ({
  items,
  mode: 'retail',
  channel: 'Al paso',
  manualDiscount: 0,
  delivery: 0,
  ...extra,
});

test('seed contains valid data across periods and initializes only once', () => {
  const storage = memory(),
    a = new Store(storage);
  assert.equal(validateState(a.state), true);
  assert.ok(a.state.sales.length > 200);
  assert.ok(
    a.state.sales.some((x) => localDay(x.createdAt).slice(0, 7) !== localDay().slice(0, 7)),
  );
  a.transaction((s) => (s.products[0].stock = 999));
  const b = new Store(storage);
  assert.equal(b.state.products[0].stock, 999);
});
test('best promotion is applied once, fixed discount is capped at unit price', () => {
  const s = createSeed();
  s.promotions.push({
    id: 'promo2',
    name: 'Otra',
    productIds: ['p4'],
    type: 'fixed',
    value: 300,
    start: '2020-01-01',
    end: '2035-01-01',
    active: true,
  });
  assert.equal(quote(s, cart([{ productId: 'p4', qty: 2 }])).promotionDiscount, 600);
  s.promotions.at(-1).value = 9000;
  assert.equal(quote(s, cart([{ productId: 'p4', qty: 1 }])).total, 0);
  s.promotions.at(-1).end = '2020-02-01';
  assert.equal(quote(s, cart([{ productId: 'p4', qty: 1 }])).total, 1620);
});
test('wholesale threshold controls price and never combines with promotions', () => {
  const s = createSeed();
  assert.equal(quote(s, cart([{ productId: 'p4', qty: 5 }], { mode: 'wholesale' })).total, 9000);
  const q = quote(s, cart([{ productId: 'p4', qty: 6 }], { mode: 'wholesale' }));
  assert.equal(q.total, 7800);
  assert.equal(q.promotionDiscount, 0);
});
test('inactive categories prevent sales without changing inventory or history', () => {
  const st = setup(),
    stock = st.state.products[0].stock,
    count = st.state.sales.length;
  st.transaction((s) => (s.disabledCategories = ['Pizzas']));
  assert.throws(
    () => st.transaction((s) => completeSale(s, cart(), { Efectivo: 8000 }, 'inactive-category')),
    /disponible/,
  );
  assert.equal(st.state.products[0].stock, stock);
  assert.equal(st.state.sales.length, count);
  st.transaction((s) => (s.disabledCategories = []));
  assert.equal(quote(st.state, cart()).total, 7900);
});
test('combined payment preserves cash change and stock, retains historical cost', () => {
  const st = setup(),
    before = expectedCash(st.state),
    stock = st.state.products[0].stock;
  const id = st.transaction((s) =>
    completeSale(s, cart(), { Efectivo: 5000, Tarjeta: 4000 }, 'token-a'),
  );
  const sale = st.state.sales.find((x) => x.id === id);
  assert.equal(sale.change, 1100);
  assert.deepEqual(sale.payments, [
    { method: 'Efectivo', amount: 3900 },
    { method: 'Tarjeta', amount: 4000 },
  ]);
  assert.equal(expectedCash(st.state), before + 3900);
  assert.equal(st.state.products[0].stock, stock - 1);
  st.transaction((s) => (s.products[0].cost = 999));
  assert.equal(st.state.sales.find((x) => x.id === id).cost, 3200);
  assert.throws(
    () => st.transaction((s) => completeSale(s, cart(), { Efectivo: 7900 }, 'token-a')),
    /ya fue/,
  );
});
test('all four methods register and require correct allocation', () => {
  const st = setup();
  for (const method of ['Efectivo', 'Transferencia', 'Tarjeta', 'Junaeb'])
    st.transaction((s) => completeSale(s, cart(), { [method]: 7900 }, method));
  assert.throws(
    () => st.transaction((s) => completeSale(s, cart(), { Tarjeta: 8000 }, 'excess')),
    /excedente/,
  );
  assert.throws(
    () => st.transaction((s) => completeSale(s, cart(), { Tarjeta: 500 }, 'short')),
    /no cubre/,
  );
});
test('stock, integer validation, discount limits and delivery validation are enforced atomically', () => {
  const st = setup(),
    original = JSON.stringify(st.state);
  for (const c of [
    cart([{ productId: 'p1', qty: 10000 }]),
    cart([{ productId: 'p1', qty: 1.5 }]),
    cart(undefined, { manualDiscount: 10000 }),
    cart(undefined, { channel: 'Delivery', delivery: 1500 }),
  ])
    assert.throws(() => st.transaction((s) => completeSale(s, c, { Efectivo: 20000 }, 'invalid')));
  assert.equal(JSON.stringify(st.state), original);
  const q = quote(
    st.state,
    cart(undefined, {
      manualDiscount: 900,
      channel: 'Delivery',
      recipient: 'Demo',
      address: 'Dirección demo',
      delivery: 1500,
    }),
  );
  assert.equal(q.total, 8500);
});
test('void restores stock and creates original method refunds in currently open shift', () => {
  const st = setup(),
    initialStock = st.state.products[0].stock;
  const id = st.transaction((s) =>
    completeSale(s, cart(), { Junaeb: 3000, Efectivo: 5000 }, 'return'),
  );
  st.transaction((s) => closeShift(s, expectedCash(s)));
  st.transaction((s) => openShift(s, 20000));
  const before = expectedCash(st.state);
  st.transaction((s) => voidSale(s, id, 'Error de pedido'));
  assert.equal(st.state.products[0].stock, initialStock);
  assert.equal(expectedCash(st.state), before - 4900);
  assert.equal(st.state.movements.filter((x) => x.ref === id && x.type === 'Devolución').length, 2);
  assert.throws(() => st.transaction((s) => voidSale(s, id, 'Otra')), /ya está anulada/);
});
test('shift opening, movements, cash count, closed sales rejection and handoff', () => {
  const st = setup();
  assert.throws(() => st.transaction((s) => openShift(s, 100)), /Ya existe/);
  st.transaction((s) => cashMovement(s, 'Ingreso', 1000, 'Fondo adicional'));
  st.transaction((s) => cashMovement(s, 'Retiro', 500, 'Retiro demo'));
  const expected = expectedCash(st.state);
  st.transaction((s) => closeShift(s, expected - 100));
  const closed = st.state.shifts.at(-1);
  assert.equal(closed.difference, -100);
  assert.equal(activeShift(st.state), undefined);
  assert.throws(
    () => st.transaction((s) => completeSale(s, cart(), { Efectivo: 8000 }, 'closed')),
    /Abre un turno/,
  );
  st.transaction((s) => (s.sessionUserId = 'u2'));
  st.transaction((s) => openShift(s, 30000));
  assert.equal(activeShift(st.state).userId, 'u2');
  assert.equal(expectedCash(st.state), 30000);
});
test('purchases support separate reception and payment, update cost once', () => {
  const st = setup(),
    before = st.state.products[0].stock;
  const id = st.transaction((s) =>
    savePurchase(s, {
      supplierId: 's1',
      items: [{ productId: 'p1', qty: 5, cost: 2500 }],
      paymentMethod: 'Transferencia',
    }),
  );
  assert.equal(st.state.products[0].stock, before);
  st.transaction((s) => payPurchase(s, id, 'Transferencia'));
  assert.equal(st.state.products[0].stock, before);
  st.transaction((s) => receivePurchase(s, id));
  assert.equal(st.state.products[0].stock, before + 5);
  assert.equal(st.state.products[0].cost, 2500);
  assert.throws(() => st.transaction((s) => receivePurchase(s, id)), /ya fue recibida/);
  assert.throws(() => st.transaction((s) => payPurchase(s, id, 'Tarjeta')), /ya está pagada/);
});
test('stock entries, shrinkage and adjustments keep stock nonnegative', () => {
  const st = setup();
  st.transaction((s) => adjustStock(s, 'p1', 'Ajuste', 10, 'Conteo'));
  st.transaction((s) => adjustStock(s, 'p1', 'Entrada', 5, 'Producción'));
  st.transaction((s) => adjustStock(s, 'p1', 'Merma', 2, 'Producto dañado'));
  assert.equal(st.state.products[0].stock, 13);
  assert.throws(() => st.transaction((s) => adjustStock(s, 'p1', 'Merma', 14, 'Error')), /supera/);
});
test('expenses update reports and cash only for cash payments', () => {
  const st = setup(),
    before = expectedCash(st.state),
    r = report(st.state, localDay(), localDay());
  st.transaction((s) =>
    addExpense(s, {
      description: 'Prueba energía',
      category: 'Electricidad',
      amount: 1000,
      method: 'Tarjeta',
    }),
  );
  assert.equal(expectedCash(st.state), before);
  st.transaction((s) =>
    addExpense(s, {
      description: 'Transporte',
      category: 'Transporte',
      amount: 500,
      method: 'Efectivo',
    }),
  );
  assert.equal(expectedCash(st.state), before - 500);
  assert.equal(report(st.state, localDay(), localDay()).expenses, r.expenses + 1500);
});
test('reports use reversal date, preserve original sale and balance equation', () => {
  const st = setup(),
    id = st.transaction((s) => completeSale(s, cart(), { Tarjeta: 7900 }, 'report'));
  st.transaction((s) => {
    s.sales.find((x) => x.id === id).createdAt = '2026-01-01T12:00:00Z';
  });
  const oldBefore = report(st.state, '2026-01-01', '2026-01-01').net;
  st.transaction((s) => voidSale(s, id, 'Anulación posterior'));
  assert.equal(report(st.state, '2026-01-01', '2026-01-01').net, oldBefore);
  const b = balance(st.state);
  assert.equal(b.assets, b.debt + b.equity);
  assert.equal(b.equity, b.capital + b.openingAdjustment + b.result);
});
test('storage failure rolls back operation and stale tabs cannot overwrite', () => {
  const storage = memory(),
    a = new Store(storage),
    b = new Store(storage);
  a.transaction((s) => (s.products[0].stock = 50));
  assert.throws(() => b.transaction((s) => (s.products[0].stock = 60)), /otra pestaña/);
  storage.setItem = () => {
    throw new Error('QuotaExceeded');
  };
  assert.throws(() => a.transaction((s) => (s.products[0].stock = 70)), /No se pudo guardar/);
  assert.equal(a.state.products[0].stock, 50);
});
test('backup restore validates structure, numbers, duplicate ids and incompatible version', () => {
  const st = setup(),
    original = structuredClone(st.state);
  for (const mutate of [
    (s) => (s.version = 99),
    (s) => (s.products[0].stock = -1),
    (s) => s.products.push(s.products[0]),
    (s) => (s.sales[0].payments[0].amount = 1),
    (s) => delete s.settings,
  ]) {
    const bad = structuredClone(original);
    mutate(bad);
    assert.throws(() => st.restore(bad));
    assert.equal(st.state.sales.length, original.sales.length);
  }
  const backup = JSON.parse(JSON.stringify(original));
  st.transaction((s) => (s.products[0].stock = 1));
  st.restore(backup);
  assert.equal(st.state.products[0].stock, original.products[0].stock);
});
test('cashier cannot change catalog or reset demo; administrator cannot be removed', () => {
  const st = setup();
  assert.throws(() => st.transaction((s) => (s.users[0].active = false)), /administrador activo/);
  st.transaction((s) => (s.sessionUserId = 'u2'));
  assert.throws(
    () => st.transaction((s) => (s.products[0].price = 1), { admin: true }),
    /administrador/,
  );
  assert.throws(() => st.reset(), /administrador/);
  assert.throws(
    () => st.transaction((s) => adjustStock(s, 'p1', 'Entrada', 1, 'Test')),
    /administrador/,
  );
});
test('blocked storage and corrupt JSON do not silently overwrite saved data', () => {
  const blocked = new Store({
    getItem: () => {
      throw new Error('blocked');
    },
    setItem: () => {
      throw new Error('blocked');
    },
  });
  assert.equal(blocked.state, null);
  const storage = memory();
  storage.setItem(KEY, 'bad json');
  assert.equal(new Store(storage).state, null);
  assert.equal(storage.getItem(KEY), 'bad json');
});

/**
 * Datos ficticios iniciales. Solo se cargan cuando todavía no existe una demostración guardada.
 */
export const METHODS = ['Efectivo', 'Transferencia', 'Tarjeta', 'Junaeb'];
export const VERSION = 1;
export const KEY = 'prototipo-punto-ventas:v1';
const photo = (name) => `assets/${name}.jpg`;
/** Genera catálogo e historial relativo a la fecha actual, con un turno demo abierto. */
export function createSeed(now = new Date()) {
  const today = new Date(now);
  today.setHours(8, 0, 0, 0);
  const products = [
    ['p1', 'Pizza pepperoni', 'Pizzas', 7900, 5900, 4, 3200, 28, 8, 'pizza-pepperoni', 'PIZ-001'],
    ['p2', 'Pizza margarita', 'Pizzas', 6900, 5200, 4, 2600, 22, 8, 'pizza-margarita', 'PIZ-002'],
    [
      'p3',
      'Pizza vegetariana',
      'Pizzas',
      7500,
      5600,
      4,
      2900,
      18,
      6,
      'pizza-vegetariana',
      'PIZ-003',
    ],
    [
      'p4',
      'Galletón de chocolate',
      'Galletones',
      1800,
      1300,
      6,
      650,
      36,
      10,
      'cookie-chocolate',
      'GAL-001',
    ],
    [
      'p5',
      'Galletón de avena',
      'Galletones',
      1600,
      1100,
      6,
      500,
      24,
      10,
      'cookie-avena',
      'GAL-002',
    ],
    ['p6', 'Café latte', 'Cafetería', 2400, 1800, 5, 800, 40, 12, 'cafe', 'CAF-001'],
    ['p7', 'Empanada de queso', 'Empanadas', 2200, 1600, 6, 850, 32, 10, 'empanada', 'EMP-001'],
    ['p8', 'Bebida cola 350 ml', 'Bebestibles', 1500, 1000, 12, 600, 48, 12, 'bebida', 'BEB-001'],
    ['p9', 'Agua sin gas 500 ml', 'Bebestibles', 1000, 700, 12, 350, 6, 12, 'agua', 'BEB-002'],
    ['p10', 'Agua con gas 500 ml', 'Bebestibles', 1000, 700, 12, 350, 20, 12, 'agua', 'BEB-003'],
    ['p11', 'Barra Snickers', 'Snacks', 1200, 900, 12, 550, 5, 10, 'snack', 'SNK-001'],
    ['p12', 'Mantequilla de maní', 'Snacks', 4500, 3500, 6, 2200, 15, 5, 'mani', 'SNK-002'],
  ].map(
    ([
      id,
      name,
      category,
      price,
      wholesalePrice,
      wholesaleMin,
      cost,
      stock,
      minStock,
      image,
      sku,
    ]) => ({
      id,
      name,
      category,
      price,
      wholesalePrice,
      wholesaleMin,
      cost,
      stock,
      minStock,
      image: ['mani', 'snack'].includes(image) ? `assets/${image}.svg` : photo(image),
      sku,
      active: true,
    }),
  );
  const users = [
    { id: 'u1', name: 'Catalina Pérez', role: 'Administrador', active: true },
    { id: 'u2', name: 'Matías González', role: 'Cajero', active: true },
    { id: 'u3', name: 'Valentina Rojas', role: 'Cajero', active: true },
  ];
  const customers = [
    {
      id: 'c1',
      name: 'Francisca Muñoz',
      email: 'francisca@example.com',
      phone: '+56 9 6123 4567',
      address: 'Av. Providencia 1450, Santiago',
      wholesale: false,
    },
    {
      id: 'c2',
      name: 'Cafetería Los Aromos',
      email: 'compras@example.com',
      phone: '+56 9 7234 5678',
      address: 'Los Aromos 225, Ñuñoa',
      wholesale: true,
    },
    {
      id: 'c3',
      name: 'Diego Soto',
      email: 'diego@example.com',
      phone: '+56 9 8345 6789',
      address: 'Manuel Montt 890, Santiago',
      wholesale: false,
    },
  ];
  const sales = [],
    movements = [],
    stockMovements = [];
  const shifts = [];
  for (let d = 64; d >= 0; d--) {
    if (d > 0 && d % 7 === 0) continue;
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    const sid = d === 0 ? 'shift-current' : `shift-${d}`;
    let cash = 50000;
    const shift = {
      id: sid,
      userId: d % 2 ? 'u2' : 'u1',
      openedAt: date.toISOString(),
      opening: 50000,
      closedAt: null,
      counted: null,
      expected: null,
      difference: null,
    };
    for (let n = 0; n < (d === 0 ? 8 : 3 + (d % 5)); n++) {
      const stamp = new Date(date);
      stamp.setHours(9 + n, 10 + ((n * 7) % 45));
      if (d === 0 && stamp > now) stamp.setTime(now.getTime() - (8 - n) * 60000);
      const p = products[(d * 3 + n) % products.length],
        q = 1 + (n % 3 === 0 ? 1 : 0),
        method = METHODS[(d + n) % 4];
      const items = [
        {
          productId: p.id,
          name: p.name,
          sku: p.sku,
          image: p.image,
          qty: q,
          unitPrice: p.price,
          unitCost: p.cost,
          discount: 0,
          total: p.price * q,
        },
      ];
      const delivery = n % 4 === 0 ? 1500 : 0,
        total = p.price * q + delivery;
      const sale = {
        id: `sale-${d}-${n}`,
        number: 1000 + sales.length,
        createdAt: stamp.toISOString(),
        userId: shift.userId,
        shiftId: sid,
        customerId: n % 3 === 0 ? 'c1' : '',
        channel: delivery ? 'Delivery' : 'Al paso',
        recipient: delivery ? 'Francisca Muñoz' : '',
        address: delivery ? 'Av. Providencia 1450, Santiago' : '',
        mode: 'retail',
        items,
        subtotal: p.price * q,
        promotionDiscount: 0,
        manualDiscount: 0,
        delivery,
        total,
        cost: p.cost * q,
        payments: [{ method, amount: total }],
        tendered: method === 'Efectivo' ? Math.ceil(total / 1000) * 1000 : total,
        change: method === 'Efectivo' ? Math.ceil(total / 1000) * 1000 - total : 0,
        status: 'Completada',
        token: `seed-${d}-${n}`,
      };
      sales.push(sale);
      movements.push({
        id: `mov-${d}-${n}`,
        createdAt: stamp.toISOString(),
        shiftId: sid,
        userId: shift.userId,
        type: 'Venta',
        method,
        amount: total,
        reason: `Venta #${sale.number}`,
        ref: sale.id,
      });
      if (method === 'Efectivo') cash += total;
    }
    if (d > 0)
      Object.assign(shift, {
        closedAt: new Date(date.getTime() + 12 * 3600000).toISOString(),
        counted: cash,
        expected: cash,
        difference: 0,
      });
    shifts.push(shift);
  }
  return {
    version: VERSION,
    revision: 0,
    sessionUserId: 'u1',
    products,
    users,
    customers,
    categories: ['Pizzas', 'Galletones', 'Cafetería', 'Empanadas', 'Bebestibles', 'Snacks'],
    disabledCategories: [],
    suppliers: [
      {
        id: 's1',
        name: 'Distribuidora Central',
        email: 'ventas@central.example',
        phone: '+56 2 2345 6789',
        address: 'Av. Central 420, Santiago',
      },
      {
        id: 's2',
        name: 'Alimentos del Sur',
        email: 'contacto@sur.example',
        phone: '+56 9 9876 5432',
        address: 'Camino El Bosque 152, Santiago',
      },
    ],
    promotions: [
      {
        id: 'promo1',
        name: 'Un dulce momento',
        productIds: ['p4', 'p5'],
        type: 'percent',
        value: 10,
        start: '2020-01-01',
        end: '2035-12-31',
        active: true,
      },
    ],
    recipes: [
      {
        id: 'r1',
        name: 'Pizza pepperoni',
        yield: 1,
        ingredients:
          '250 g de masa de pizza\n80 g de salsa de tomate\n120 g de queso mozzarella\n50 g de pepperoni',
        instructions:
          'Estirar la masa. Cubrir con salsa, queso y pepperoni. Hornear a 250 °C durante 10 a 12 minutos.',
        image: photo('pizza-pepperoni'),
      },
      {
        id: 'r2',
        name: 'Galletón de chocolate',
        yield: 12,
        ingredients:
          '250 g de harina\n150 g de mantequilla\n180 g de azúcar\n2 huevos\n150 g de chips de chocolate',
        instructions:
          'Batir mantequilla y azúcar. Incorporar huevos, harina y chocolate. Formar 12 porciones y hornear a 180 °C por 14 minutos.',
        image: photo('cookie-chocolate'),
      },
    ],
    sales,
    movements,
    shifts,
    stockMovements,
    purchases: [
      {
        id: 'buy1',
        number: 1,
        supplierId: 's1',
        createdAt: new Date(today.getTime() - 86400000 * 3).toISOString(),
        items: [{ productId: 'p8', name: 'Bebida cola 350 ml', qty: 24, cost: 600 }],
        total: 14400,
        received: true,
        paid: false,
        paymentMethod: 'Transferencia',
      },
    ],
    expenses: [
      {
        id: 'e1',
        createdAt: new Date(today.getTime() - 86400000 * 5).toISOString(),
        category: 'Electricidad',
        description: 'Consumo eléctrico del local',
        amount: 42000,
        method: 'Transferencia',
        userId: 'u1',
      },
    ],
    settings: {
      receiptAddress: 'Av. Providencia 1234, Santiago',
      receiptPhone: '+56 9 1234 5678',
      receiptMessage: '¡Gracias por tu compra! Vuelve pronto.',
      initialCapital: 500000,
      initialCash: 250000,
      initialNonCash: 250000,
    },
  };
}

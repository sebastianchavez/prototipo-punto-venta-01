/**
 * Administración del local. Las pantallas están en sus HTML; aquí se calculan sus valores y se gestionan los formularios compartidos.
 */
import { renderTemplate } from './templates.js';
import {
  uid,
  money,
  dateTime,
  integer,
  assert,
  currentUser,
  adjustStock,
  savePurchase,
  receivePurchase,
  payPurchase,
  addExpense,
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
  area,
  formFooter,
  showModal,
  closeModal,
  toast,
  safeImage,
} from './ui.js';
const entityNames = {
  products: 'producto',
  customers: 'cliente',
  suppliers: 'proveedor',
  promotions: 'promoción',
  recipes: 'receta',
  users: 'usuario',
};
const options = (s) => s.products.map((p) => [p.id, p.name]);
const rowsActions = (entity, id) =>
  `${actionBtn('edit', 'edit-entity', 'Editar', `data-entity="${entity}" data-id="${id}"`)}`;
/** Completa únicamente la plantilla de la pantalla administrativa actual. */
export function renderAdmin(route, s, search = '') {
  const includes = (x) => !search || JSON.stringify(x).toLowerCase().includes(search.toLowerCase());
  const searchable = (placeholder) => /* HTML */ `
    <div class="toolbar">
      <div class="search-field w-full max-w-sm">
        ${icon('search')}
        <input
          id="admin-search"
          type="search"
          placeholder="${placeholder}"
          value="${esc(search)}"
          aria-label="${placeholder}"
        />
      </div>
    </div>
  `;
  const add = (entity, label) =>
    btn(label, 'new-entity', 'btn-primary', 'plus', `data-entity="${entity}"`);
  if (route === 'productos')
    return renderTemplate('productos-page', {
      content: renderTemplate('productos-fragment-1', {
        content: `${btn('Categorías', 'categories', '', 'layers')}${add('products', 'Nuevo producto')}`,
      }),
      searchable: searchable('Buscar producto o código…'),
      table: table(
        ['Producto', 'Código', 'Categoría', 'Precio', 'Mayorista', 'Costo', 'Estado', ''],
        s.products.filter(includes).map((p) =>
          renderTemplate('productos-fragment-2', {
            image: image(p.image, p.name, 'w-10 h-10 rounded-lg object-cover'),
            name: esc(p.name),
            sku: esc(p.sku),
            category: esc(p.category),
            price: money(p.price),
            wholesalePrice: money(p.wholesalePrice),
            wholesaleMin: p.wholesaleMin,
            cost: money(p.cost),
            badge: badge(p.active ? 'Activo' : 'Inactivo', p.active ? '' : 'gray'),
            rowsActions: rowsActions('products', p.id),
          }),
        ),
      ),
    });
  if (route === 'inventario') {
    const low = s.products.filter((p) => p.active && p.stock <= p.minStock);
    return renderTemplate('inventario-page', {
      content: renderTemplate('inventario-fragment-1', {
        btn: btn('Movimiento de stock', 'stock-adjust', 'btn-primary', 'plus'),
      }),
      stat: stat(
        'Unidades disponibles',
        s.products.reduce((n, p) => n + p.stock, 0),
        'box',
      ),
      stat2: stat(
        'Valor del inventario',
        money(s.products.reduce((n, p) => n + p.stock * p.cost, 0)),
        'layers',
      ),
      stat3: stat('Stock bajo', low.length, 'alert'),
      searchable: searchable('Buscar en inventario…'),
      table: table(
        ['Producto', 'Código', 'Stock actual', 'Stock mínimo', 'Estado', ''],
        s.products.filter(includes).map((p) =>
          renderTemplate('inventario-fragment-2', {
            name: esc(p.name),
            sku: esc(p.sku),
            stock: p.stock,
            minStock: p.minStock,
            badge: badge(
              p.stock <= p.minStock ? 'Reponer' : 'Disponible',
              p.stock <= p.minStock ? 'red' : '',
            ),
            actionBtn: actionBtn('edit', 'stock-adjust', 'Ajustar stock', `data-id="${p.id}"`),
          }),
        ),
      ),
      table2: table(
        ['Fecha', 'Producto', 'Movimiento', 'Motivo'],
        [...s.stockMovements]
          .reverse()
          .slice(0, 100)
          .map((m) =>
            renderTemplate('inventario-fragment-3', {
              createdAt: dateTime(m.createdAt),
              name: esc(s.products.find((p) => p.id === m.productId)?.name),
              content: m.qty < 0 ? 'text-red-400' : 'text-emerald-600',
              content2: m.qty > 0 ? '+' : '',
              qty: m.qty,
              reason: esc(m.reason),
            }),
          ),
      ),
    });
  }
  if (route === 'clientes' || route === 'proveedores') {
    const entity = route === 'clientes' ? 'customers' : 'suppliers';
    return renderTemplate('clientes-proveedores-page', {
      content: renderTemplate('clientes-proveedores-fragment-1', {
        content: route === 'clientes' ? 'Clientes' : 'Proveedores',
        content2:
          route === 'clientes'
            ? 'Conoce a quienes vuelven por sus favoritos.'
            : 'Mantén tus contactos y abastecimiento en orden.',
        add: add(entity, route === 'clientes' ? 'Nuevo cliente' : 'Nuevo proveedor'),
      }),
      searchable: searchable('Buscar por nombre o contacto…'),
      table: table(
        ['Nombre', 'Contacto', 'Dirección', route === 'clientes' ? 'Tipo' : 'Compras', ''],
        s[entity].filter(includes).map((c) =>
          renderTemplate('clientes-proveedores-fragment-2', {
            name: esc(
              c.name
                .split(' ')
                .slice(0, 2)
                .map((x) => x[0])
                .join(''),
            ),
            name2: esc(c.name),
            phone: esc(c.phone),
            email: esc(c.email),
            address: esc(c.address),
            content:
              route === 'clientes'
                ? badge(c.wholesale ? 'Mayorista' : 'Minorista', c.wholesale ? 'orange' : 'gray')
                : s.purchases.filter((p) => p.supplierId === c.id).length,
            content2:
              route === 'clientes'
                ? actionBtn(
                    'receipt',
                    'customer-history',
                    'Historial de compras',
                    `data-id="${c.id}"`,
                  )
                : '',
            rowsActions: rowsActions(entity, c.id),
          }),
        ),
      ),
    });
  }
  if (route === 'promociones')
    return renderTemplate('promociones-page', {
      content: renderTemplate('promociones-fragment-1', {
        add: add('promotions', 'Nueva promoción'),
      }),
      content2:
        s.promotions
          .map((p) =>
            renderTemplate('promociones-fragment-2', {
              tagIcon: icon('tag'),
              badge: badge(p.active ? 'Habilitada' : 'Inactiva', p.active ? '' : 'gray'),
              name: esc(p.name),
              content: p.type === 'percent' ? `${p.value}%` : money(p.value),
              productIds: p.productIds
                .map((id) => esc(s.products.find((x) => x.id === id)?.name))
                .join(' · '),
              start: esc(p.start),
              end: esc(p.end),
              btn: btn(
                'Editar promoción',
                'edit-entity',
                'btn-sm',
                'edit',
                `data-entity="promotions" data-id="${p.id}"`,
              ),
            }),
          )
          .join('') || empty('Sin promociones'),
    });
  if (route === 'recetas')
    return renderTemplate('recetas-page', {
      content: renderTemplate('recetas-fragment-1', { add: add('recipes', 'Nueva receta') }),
      content2:
        s.recipes
          .map((r) =>
            renderTemplate('recetas-fragment-2', {
              image: image(r.image, r.name, 'w-full h-44 object-cover'),
              name: esc(r.name),
              rowsActions: rowsActions('recipes', r.id),
              badge: badge(`Rinde ${r.yield} unidades`, 'orange'),
              ingredients: esc(r.ingredients),
              instructions: esc(r.instructions),
            }),
          )
          .join('') || empty('Aún no hay recetas'),
    });
  if (route === 'compras')
    return renderTemplate('compras-page', {
      content: renderTemplate('compras-fragment-1', {
        btn: btn('Registrar compra', 'new-purchase', 'btn-primary', 'plus'),
      }),
      stat: stat('Compras registradas', s.purchases.length, 'bag'),
      stat2: stat(
        'Pendiente de pago',
        money(s.purchases.filter((x) => !x.paid).reduce((n, x) => n + x.total, 0)),
        'wallet',
      ),
      stat3: stat('Por recibir', s.purchases.filter((x) => !x.received).length, 'truck'),
      table: table(
        ['Compra / fecha', 'Proveedor', 'Productos', 'Total', 'Recepción', 'Pago', 'Acciones'],
        [...s.purchases].reverse().map((p) =>
          renderTemplate('compras-fragment-2', {
            String: String(p.number).padStart(4, '0'),
            createdAt: dateTime(p.createdAt),
            name: esc(s.suppliers.find((x) => x.id === p.supplierId)?.name),
            items: p.items.map((i) => `${i.qty} × ${esc(i.name)}`).join('<br>'),
            total: money(p.total),
            badge: badge(p.received ? 'Recibida' : 'Pendiente', p.received ? '' : 'orange'),
            badge2: badge(p.paid ? 'Pagada' : 'Pendiente', p.paid ? '' : 'orange'),
            content: !p.received
              ? btn('Recibir', 'receive-purchase', 'btn-sm', 'box', `data-id="${p.id}"`)
              : '',
            content2: !p.paid
              ? btn('Pagar', 'pay-purchase', 'btn-sm', 'wallet', `data-id="${p.id}"`)
              : '',
          }),
        ),
      ),
    });
  if (route === 'gastos')
    return renderTemplate('gastos-page', {
      content: renderTemplate('gastos-fragment-1', {
        btn: btn('Registrar gasto', 'new-expense', 'btn-primary', 'plus'),
      }),
      table: table(
        ['Fecha', 'Descripción', 'Categoría', 'Medio de pago', 'Monto'],
        [...s.expenses].reverse().map((e) =>
          renderTemplate('gastos-fragment-2', {
            createdAt: dateTime(e.createdAt),
            description: esc(e.description),
            badge: badge(e.category, 'gray'),
            method: esc(e.method),
            amount: money(e.amount),
          }),
        ),
      ),
    });
  if (route === 'usuarios')
    return renderTemplate('usuarios-page', {
      content: renderTemplate('usuarios-fragment-1', { add: add('users', 'Nuevo usuario') }),
      table: table(
        ['Usuario', 'Rol', 'Estado', ''],
        s.users.map((u) =>
          renderTemplate('usuarios-fragment-2', {
            name: esc(
              u.name
                .split(' ')
                .map((x) => x[0])
                .slice(0, 2)
                .join(''),
            ),
            name2: esc(u.name),
            content: s.sessionUserId === u.id ? '<span class="muted">(tú)</span>' : '',
            badge: badge(u.role, u.role === 'Administrador' ? 'orange' : 'gray'),
            badge2: badge(u.active ? 'Activo' : 'Inactivo', u.active ? '' : 'gray'),
            rowsActions: rowsActions('users', u.id),
          }),
        ),
      ),
    });
  if (route === 'configuracion')
    return renderTemplate('configuracion-page', {
      content: renderTemplate('configuracion-fragment-1', {}),
      settingsIcon: icon('settings', 'text-slate-400'),
      field: field(
        'Nombre de la aplicación',
        'appName',
        'text',
        'prototipo punto ventas',
        'disabled class="full"',
      ),
      field2: field(
        'Dirección del comprobante',
        'receiptAddress',
        'text',
        s.settings.receiptAddress,
        'required',
      ),
      field3: field('Teléfono', 'receiptPhone', 'text', s.settings.receiptPhone),
      area: area(
        'Mensaje del comprobante',
        'receiptMessage',
        s.settings.receiptMessage,
        'required',
      ),
      field4: field(
        'Capital inicial (CLP)',
        'initialCapital',
        'number',
        s.settings.initialCapital,
        'required min="0" step="1"',
      ),
      field5: field(
        'Efectivo inicial global (CLP)',
        'initialCash',
        'number',
        s.settings.initialCash,
        'required min="0" step="1"',
      ),
      field6: field(
        'Saldo inicial no efectivo (CLP)',
        'initialNonCash',
        'number',
        s.settings.initialNonCash,
        'required min="0" step="1"',
      ),
      checkIcon: icon('check'),
      downloadIcon: icon('download', 'text-slate-400'),
      btn: btn('Descargar respaldo', 'backup', '', 'download'),
      btn2: btn('Restaurar respaldo', 'restore', '', 'upload'),
      refreshIcon: icon('refresh', 'text-slate-400'),
      btn3: btn('Reiniciar demostración', 'reset', 'btn-danger', 'refresh'),
    });
  return empty('Pantalla no encontrada');
}
/** Crea o edita un registro, valida sus campos y conserva las referencias históricas. */
export function entityModal(entity, id, store, refresh) {
  const s = store.state,
    old = s[entity]?.find((x) => x.id === id) || {},
    isNew = !id;
  assert(entityNames[entity], 'Formulario no disponible.');
  let body = '';
  if (entity === 'products')
    body = /* HTML */ `
      ${field('Nombre', 'name', 'text', old.name, 'required maxlength="80"')}${field('Código / SKU', 'sku', 'text', old.sku, 'required maxlength="30"')}${select('Categoría', 'category', s.categories, old.category)}${select(
        'Estado',
        'active',
        [
          ['true', 'Activo'],
          ['false', 'Inactivo'],
        ],
        String(old.active ?? true),
      )}${field('Precio minorista (CLP)', 'price', 'number', old.price ?? 0, 'required min="0" step="1"')}${field('Precio mayorista (CLP)', 'wholesalePrice', 'number', old.wholesalePrice ?? 0, 'required min="0" step="1"')}${field('Mínimo mayorista (unidades)', 'wholesaleMin', 'number', old.wholesaleMin ?? 6, 'required min="1" step="1"')}${field('Costo unitario (CLP)', 'cost', 'number', old.cost ?? 0, 'required min="0" step="1"')}${field('Stock mínimo', 'minStock', 'number', old.minStock ?? 5, 'required min="0" step="1"')}${isNew ? field('Stock inicial', 'stock', 'number', 0, 'required min="0" step="1"') : ''}${field('Imagen (ruta local o URL HTTPS)', 'image', 'text', old.image || 'assets/placeholder.svg', 'class="full"')}
      <label class="full">
        O cargar una imagen local (máx. 1 MB)
        <input type="file" name="imageFile" accept="image/png,image/jpeg,image/webp" />
      </label>
    `;
  if (entity === 'customers' || entity === 'suppliers')
    body = `${field('Nombre', 'name', 'text', old.name, 'required maxlength="100"')}${field('Teléfono', 'phone', 'tel', old.phone)}${field('Correo electrónico', 'email', 'email', old.email)}${field('Dirección', 'address', 'text', old.address, 'maxlength="200"')}${
      entity === 'customers'
        ? select(
            'Tipo de cliente',
            'wholesale',
            [
              ['false', 'Minorista'],
              ['true', 'Mayorista'],
            ],
            String(old.wholesale ?? false),
          )
        : ''
    }`;
  if (entity === 'users')
    body = `${field('Nombre', 'name', 'text', old.name, 'required maxlength="80"')}${select('Rol', 'role', ['Administrador', 'Cajero'], old.role || 'Cajero')}${select(
      'Estado',
      'active',
      [
        ['true', 'Activo'],
        ['false', 'Inactivo'],
      ],
      String(old.active ?? true),
    )}`;
  if (entity === 'promotions')
    body = /* HTML */ `
      ${field('Nombre', 'name', 'text', old.name, 'required maxlength="80"')}${select(
        'Estado',
        'active',
        [
          ['true', 'Habilitada'],
          ['false', 'Inactiva'],
        ],
        String(old.active ?? true),
      )}${select(
        'Tipo de descuento',
        'type',
        [
          ['percent', 'Porcentaje'],
          ['fixed', 'Monto por unidad (CLP)'],
        ],
        old.type,
      )}${field('Valor', 'value', 'number', old.value ?? 10, 'required min="1" step="1"')}${field('Vigente desde', 'start', 'date', old.start || new Date().toLocaleDateString('en-CA'), 'required')}${field('Vigente hasta', 'end', 'date', old.end || '2027-12-31', 'required')}
      <div class="full">
        <p class="text-xs font-semibold mb-3 text-slate-500">Productos incluidos</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          ${s.products
            .map(
              (p) => /* HTML */ `
                <label class="!flex !flex-row items-center gap-2">
                  <input
                    type="checkbox"
                    name="productIds"
                    value="${p.id}"
                    ${old.productIds?.includes(p.id) ? 'checked' : ''}
                  />
                  ${esc(p.name)}
                </label>
              `,
            )
            .join('')}
        </div>
      </div>
    `;
  if (entity === 'recipes')
    body = `${field('Nombre', 'name', 'text', old.name, 'required maxlength="80"')}${field('Rendimiento (unidades)', 'yield', 'number', old.yield ?? 1, 'required min="1" step="1"')}${field('Imagen', 'image', 'text', old.image || 'assets/placeholder.svg', 'class="full"')}${area('Ingredientes (uno por línea)', 'ingredients', old.ingredients, 'required')}${area('Preparación', 'instructions', old.instructions, 'required')}`;
  showModal(
    `${isNew ? 'Crear' : 'Editar'} ${entityNames[entity]}`,
    /* HTML */ `
      <div class="form-grid">${body}</div>
      ${formFooter(isNew ? 'Crear registro' : 'Guardar cambios')}
    `,
    {
      onSubmit: async (fd) => {
        const data = Object.fromEntries(fd);
        delete data.imageFile;
        for (const k of ['name', 'sku', 'email', 'phone', 'address', 'ingredients', 'instructions'])
          if (k in data) data[k] = data[k].trim();
        assert(!('name' in data) || data.name, 'Escribe un nombre.');
        for (const k of [
          'price',
          'wholesalePrice',
          'wholesaleMin',
          'cost',
          'minStock',
          'stock',
          'yield',
          'value',
        ])
          if (k in data)
            data[k] = integer(data[k], k, ['wholesaleMin', 'yield', 'value'].includes(k) ? 1 : 0);
        if ('active' in data) data.active = data.active === 'true';
        if ('wholesale' in data) data.wholesale = data.wholesale === 'true';
        if (entity === 'promotions') {
          data.productIds = fd.getAll('productIds');
          assert(data.productIds.length, 'Selecciona al menos un producto.');
          assert(data.start <= data.end, 'La fecha final debe ser posterior a la inicial.');
          assert(data.type !== 'percent' || data.value <= 100, 'El porcentaje máximo es 100.');
        }
        if ('image' in data) data.image = safeImage(data.image);
        const file = fd.get('imageFile');
        if (file?.size) {
          assert(file.size <= 1024 * 1024, 'La imagen no puede superar 1 MB.');
          assert(
            ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
            'Usa una imagen JPG, PNG o WebP.',
          );
          data.image = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
            reader.readAsDataURL(file);
          });
        }
        store.transaction(
          (next) => {
            if (entity === 'products')
              assert(
                !next.products.some(
                  (x) => x.id !== id && x.sku.toLowerCase() === data.sku.toLowerCase(),
                ),
                'El código ya pertenece a otro producto.',
              );
            if (entity === 'users' && id === next.sessionUserId)
              assert(data.active, 'No puedes desactivar tu sesión actual.');
            if (isNew) {
              next[entity].push({ id: uid(entity), ...data });
              if (entity === 'products' && data.stock)
                next.stockMovements.push({
                  id: uid('stock'),
                  productId: next.products.at(-1).id,
                  createdAt: new Date().toISOString(),
                  userId: next.sessionUserId,
                  qty: data.stock,
                  reason: 'Stock inicial',
                  ref: '',
                });
            } else
              Object.assign(
                next[entity].find((x) => x.id === id),
                data,
              );
          },
          { admin: entity !== 'customers' },
        );
        closeModal();
        refresh();
        toast('Registro guardado correctamente.');
      },
    },
  );
}
/** Consulta las categorías y permite agregar nuevas categorías. */
export function categoriesModal(store, refresh) {
  const s = store.state;
  showModal(
    'Categorías de productos',
    /* HTML */ `
      <div class="grid gap-2 mb-5">
        ${s.categories
          .map(
            (c) => /* HTML */ `
              <div class="flex justify-between items-center p-3 rounded-lg bg-slate-50 gap-2">
                <span class="text-xs flex-1">
                  ${esc(c)}
                  <span class="muted block mt-1">
                    ${s.products.filter((p) => p.category === c).length} productos
                    ${s.disabledCategories?.includes(c) ? '· Inactiva' : ''}
                  </span>
                </span>
                ${currentUser(s)?.role === 'Administrador' ? `${actionBtn('edit', 'edit-category', 'Editar categoría', `data-id="${esc(c)}"`)}${btn(s.disabledCategories?.includes(c) ? 'Activar' : 'Desactivar', 'toggle-category', 'btn-sm', '', `data-id="${esc(c)}"`)}` : ''}
              </div>
            `,
          )
          .join('')}
      </div>
      ${currentUser(s)?.role === 'Administrador' ? `${field('Nueva categoría', 'name', 'text', '', 'required maxlength="40"')}${formFooter('Agregar categoría')}` : btn('Cerrar', 'close-modal')}
    `,
    currentUser(s)?.role === 'Administrador'
      ? {
          onSubmit: (fd) => {
            const name = fd.get('name').trim();
            assert(name, 'Escribe un nombre.');
            store.transaction(
              (next) => {
                assert(
                  !next.categories.some((c) => c.toLowerCase() === name.toLowerCase()),
                  'Esta categoría ya existe.',
                );
                next.categories.push(name);
              },
              { admin: true },
            );
            closeModal();
            refresh();
            toast('Categoría agregada.');
          },
        }
      : {},
  );
}
/** Renombra una categoría y actualiza las referencias del catálogo. */
export function editCategory(store, refresh, oldName) {
  showModal(
    'Editar categoría',
    `${field('Nombre de la categoría', 'name', 'text', oldName, 'required maxlength="40"')}${formFooter()}`,
    {
      onSubmit: (fd) => {
        const name = fd.get('name').trim();
        assert(name, 'Escribe un nombre.');
        store.transaction(
          (s) => {
            assert(s.categories.includes(oldName), 'Categoría no encontrada.');
            assert(
              !s.categories.some((c) => c !== oldName && c.toLowerCase() === name.toLowerCase()),
              'Esta categoría ya existe.',
            );
            s.categories = s.categories.map((c) => (c === oldName ? name : c));
            s.disabledCategories = (s.disabledCategories || []).map((c) =>
              c === oldName ? name : c,
            );
            s.products.filter((p) => p.category === oldName).forEach((p) => (p.category = name));
          },
          { admin: true },
        );
        closeModal();
        refresh();
        toast('Categoría actualizada.');
      },
    },
  );
}
/** Registra entradas, mermas o una existencia final por conteo. */
export function stockModal(store, refresh, id) {
  showModal(
    'Movimiento de inventario',
    /* HTML */ `
      <div class="form-grid">
        ${select('Producto', 'productId', options(store.state), id)}${select('Tipo de movimiento', 'type', ['Entrada', 'Merma', 'Ajuste'])}${field('Cantidad / existencia final en ajuste', 'qty', 'number', 1, 'required min="0" step="1"')}${field('Motivo', 'reason', 'text', '', 'required maxlength="200"')}
      </div>
      <div class="note mt-5">
        Entrada suma unidades. Merma descuenta unidades. Ajuste establece la existencia final del
        producto.
      </div>
      ${formFooter('Registrar movimiento')}
    `,
    {
      onSubmit: (fd) => {
        store.transaction(
          (s) =>
            adjustStock(s, fd.get('productId'), fd.get('type'), fd.get('qty'), fd.get('reason')),
          { admin: true },
        );
        closeModal();
        refresh();
        toast('Inventario actualizado.');
      },
    },
  );
}
/** Crea una línea editable del formulario de compra. */
export function purchaseLine(s) {
  return /* HTML */ `
    <div class="purchase-line grid grid-cols-[1fr_70px_100px_30px] gap-2 items-end mb-3">
      ${select('Producto', 'productId', options(s))}${field('Unidades', 'qty', 'number', 1, 'min="1" step="1" required')}${field('Costo unit.', 'cost', 'number', s.products[0]?.cost || 0, 'min="0" step="1" required')}${actionBtn('close', 'remove-purchase-line', 'Quitar línea')}
    </div>
  `;
}
/** Registra la compra; recepción y pago se aplican dentro de una sola transacción. */
export function purchaseModal(store, refresh) {
  assert(store.state.suppliers.length, 'Primero agrega un proveedor.');
  assert(store.state.products.length, 'Primero agrega un producto.');
  showModal(
    'Registrar compra',
    /* HTML */ `
      ${select(
        'Proveedor',
        'supplierId',
        store.state.suppliers.map((x) => [x.id, x.name]),
      )}
      <div id="purchase-lines" class="mt-5">${purchaseLine(store.state)}</div>
      ${btn('Agregar producto', 'add-purchase-line', 'btn-sm', 'plus')}
      <div class="form-grid mt-5">
        ${select('Condición de pago', 'condition', [
          ['pending', 'Pendiente de pago'],
          ['paid', 'Pagar ahora'],
        ])}${select('Medio de pago', 'paymentMethod', METHODS, 'Transferencia')}${select(
          'Recepción',
          'receive',
          [
            ['no', 'Por recibir'],
            ['yes', 'Recibir ahora'],
          ],
        )}
      </div>
      <div class="note mt-4">
        El stock y el costo se actualizan al recibir la compra. El pago se registra una sola vez,
        independientemente de la recepción.
      </div>
      ${formFooter('Registrar compra')}
    `,
    {
      wide: true,
      onSubmit: (fd, form) => {
        const data = Object.fromEntries(fd);
        data.items = [...form.querySelectorAll('.purchase-line')].map((row) =>
          Object.fromEntries(
            [...row.querySelectorAll('input,select')].map((x) => [x.name, x.value]),
          ),
        );
        store.transaction(
          (s) => {
            const id = savePurchase(s, data);
            if (data.receive === 'yes') receivePurchase(s, id);
            if (data.condition === 'paid') payPurchase(s, id, data.paymentMethod);
          },
          { admin: true },
        );
        closeModal();
        refresh();
        toast('Compra registrada.');
      },
    },
  );
}
/** Valida un gasto y registra su impacto en el medio de pago elegido. */
export function expenseModal(store, refresh) {
  showModal(
    'Registrar gasto',
    /* HTML */ `
      <div class="form-grid">
        ${field('Descripción', 'description', 'text', '', 'required maxlength="160"')}${select('Categoría', 'category', ['Electricidad', 'Arriendo', 'Servicios', 'Insumos', 'Transporte', 'Otros'])}${field('Monto (CLP)', 'amount', 'number', '', 'required min="1" step="1"')}${select('Medio de pago', 'method', METHODS, 'Transferencia')}
      </div>
      ${formFooter('Registrar gasto')}
    `,
    {
      onSubmit: (fd) => {
        store.transaction((s) => addExpense(s, Object.fromEntries(fd)), { admin: true });
        closeModal();
        refresh();
        toast('Gasto registrado.');
      },
    },
  );
}

function parseJsonField(val, fallback = null) {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

function mapRowToProduct(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    category: row.category || '',
    categoryLabel: row.category_label !== undefined ? row.category_label : (row.categoryLabel || ''),
    unit: row.unit || '',
    duration: row.duration || '',
    badge: row.badge || '',
    description: row.description || '',
    price: parseInt(row.price, 10) || 0,
    oldPrice: parseInt(row.old_price !== undefined ? row.old_price : row.oldPrice, 10) || parseInt(row.price, 10) || 0,
    specs: row.specs !== undefined ? row.specs : '',
    detailedSpecs: parseJsonField(row.detailed_specs !== undefined ? row.detailed_specs : row.detailedSpecs),
    aiReview: parseJsonField(row.ai_review !== undefined ? row.ai_review : row.aiReview),
    aiEnrichedAt: row.ai_enriched_at || row.aiEnrichedAt || null,
    image: row.image !== undefined ? row.image : '',
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt
  };
}

function normalizeOrderHistoryEntry(entry, fallbackTime) {
  if (!entry || typeof entry !== 'object') return entry;
  const ts = entry.timestamp || entry.time || fallbackTime || new Date().toISOString();
  return {
    ...entry,
    time: entry.time || ts,
    timestamp: entry.timestamp || ts
  };
}

function mapRowToOrder(row) {
  if (!row) return null;
  const createdAt = row.created_at || row.createdAt;
  const rawHistory = parseJsonField(row.status_history !== undefined ? row.status_history : row.statusHistory, []);
  const statusHistory = Array.isArray(rawHistory)
    ? rawHistory.map((h) => normalizeOrderHistoryEntry(h, createdAt))
    : [];
  return {
    id: row.id,
    customerId: row.customer_id !== undefined ? row.customer_id : (row.customerId || null),
    customerInfo: parseJsonField(row.customer_info !== undefined ? row.customer_info : row.customerInfo, {}),
    items: parseJsonField(row.items, []),
    totalAmount: parseInt(row.total_amount !== undefined ? row.total_amount : row.totalAmount, 10) || 0,
    status: row.status || 'pending',
    paymentMethod: row.payment_method || row.paymentMethod || 'cod',
    paymentStatus: row.payment_status || row.paymentStatus || 'unpaid',
    paymentRef: row.payment_ref || row.paymentRef || null,
    paymentExpiresAt: row.payment_expires_at || row.paymentExpiresAt || null,
    statsSynced: Boolean(row.stats_synced !== undefined ? row.stats_synced : row.statsSynced),
    adminNote: row.admin_note !== undefined ? row.admin_note : (row.adminNote || ''),
    note: row.note || '',
    statusHistory,
    createdAt,
    updatedAt: row.updated_at || row.updatedAt
  };
}

function mapRowToCustomer(row) {
  if (!row) return null;
  let wishlist = [];
  const rawWishlist = row.wishlist;
  if (Array.isArray(rawWishlist)) {
    wishlist = rawWishlist;
  } else if (typeof rawWishlist === 'string' && rawWishlist) {
    try {
      wishlist = JSON.parse(rawWishlist);
    } catch {
      wishlist = [];
    }
  }
  return {
    id: row.id,
    fullName: row.full_name !== undefined ? row.full_name : row.fullName,
    phone: row.phone,
    passwordHash: row.password_hash !== undefined ? row.password_hash : row.passwordHash,
    email: row.email || '',
    address: row.address || '',
    note: row.note || '',
    adminNote: row.admin_note !== undefined ? row.admin_note : (row.adminNote || ''),
    tag: row.tag || 'Mới',
    wishlist,
    visitCount: parseInt(row.visit_count !== undefined ? row.visit_count : row.visitCount, 10) || 1,
    orderCount: parseInt(row.order_count !== undefined ? row.order_count : row.orderCount, 10) || 0,
    totalSpent: parseInt(row.total_spent !== undefined ? row.total_spent : row.totalSpent, 10) || 0,
    lastVisited: row.last_visited || row.lastVisited,
    lastOrderAt: row.last_order_at || row.lastOrderAt,
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt
  };
}

function mapRowToAdmin(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    passwordHash: row.password_hash !== undefined ? row.password_hash : row.passwordHash,
    password: row.password,
    fullName: row.full_name !== undefined ? row.full_name : row.fullName,
    email: row.email,
    role: row.role || 'Super Admin',
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt
  };
}

const productSchema = {
  tableName: 'products',
  primaryKey: 'id',
  primaryKeyCol: 'id',
  fields: {
    id: { column: 'id', type: 'string' },
    name: { column: 'name', type: 'string' },
    brand: { column: 'brand', type: 'string', default: 'Khác' },
    price: { column: 'price', type: 'integer', default: 0 },
    oldPrice: { column: 'old_price', type: 'integer', default: (doc) => doc.price || 0 },
    specs: { column: 'specs', type: 'string', default: '' },
    image: { column: 'image', type: 'string', default: '' },
    detailedSpecs: { column: 'detailed_specs', type: 'json', default: null },
    aiReview: { column: 'ai_review', type: 'json', default: null },
    aiEnrichedAt: { column: 'ai_enriched_at', type: 'timestamp', default: null },
    createdAt: { column: 'created_at', type: 'timestamp' },
    updatedAt: { column: 'updated_at', type: 'timestamp' },
    category: { column: 'category', type: 'string', default: '' },
    categoryLabel: { column: 'category_label', type: 'string', default: '' },
    unit: { column: 'unit', type: 'string', default: '' },
    duration: { column: 'duration', type: 'string', default: '' },
    badge: { column: 'badge', type: 'string', default: '' },
    description: { column: 'description', type: 'string', default: '' }
  },
  normalize: mapRowToProduct
};

const orderSchema = {
  tableName: 'orders',
  primaryKey: 'id',
  primaryKeyCol: 'id',
  fields: {
    id: { column: 'id', type: 'string' },
    customerId: { column: 'customer_id', type: 'string', default: null },
    customerInfo: { column: 'customer_info', type: 'json', default: () => ({}) },
    items: { column: 'items', type: 'json', default: () => [] },
    totalAmount: { column: 'total_amount', type: 'integer', default: 0 },
    status: { column: 'status', type: 'string', default: 'pending' },
    paymentMethod: { column: 'payment_method', type: 'string', default: 'cod' },
    paymentStatus: { column: 'payment_status', type: 'string', default: 'unpaid' },
    paymentRef: { column: 'payment_ref', type: 'string', default: null },
    paymentExpiresAt: { column: 'payment_expires_at', type: 'timestamp', default: null },
    statsSynced: { column: 'stats_synced', type: 'boolean', default: false },
    adminNote: { column: 'admin_note', type: 'string', default: '' },
    note: { column: 'note', type: 'string', default: '' },
    statusHistory: { column: 'status_history', type: 'json', default: () => [] },
    createdAt: { column: 'created_at', type: 'timestamp' },
    updatedAt: { column: 'updated_at', type: 'timestamp' }
  },
  normalize: mapRowToOrder
};

const customerSchema = {
  tableName: 'customers',
  primaryKey: 'id',
  primaryKeyCol: 'id',
  fields: {
    id: { column: 'id', type: 'string' },
    fullName: { column: 'full_name', type: 'string', default: 'Khách hàng' },
    phone: { column: 'phone', type: 'string' },
    passwordHash: { column: 'password_hash', type: 'string', default: null },
    email: { column: 'email', type: 'string', default: '' },
    address: { column: 'address', type: 'string', default: '' },
    note: { column: 'note', type: 'string', default: '' },
    adminNote: { column: 'admin_note', type: 'string', default: '' },
    tag: { column: 'tag', type: 'string', default: 'Mới' },
    wishlist: { column: 'wishlist', type: 'json', default: () => [] },
    visitCount: { column: 'visit_count', type: 'integer', default: 1 },
    orderCount: { column: 'order_count', type: 'integer', default: 0 },
    totalSpent: { column: 'total_spent', type: 'integer', default: 0 },
    lastVisited: { column: 'last_visited', type: 'timestamp', default: null },
    lastOrderAt: { column: 'last_order_at', type: 'timestamp', default: null },
    createdAt: { column: 'created_at', type: 'timestamp' },
    updatedAt: { column: 'updated_at', type: 'timestamp' }
  },
  normalize: mapRowToCustomer
};

const adminSchema = {
  tableName: 'admins',
  primaryKey: 'id',
  primaryKeyCol: 'id',
  fields: {
    id: { column: 'id', type: 'string' },
    username: { column: 'username', type: 'string' },
    passwordHash: { column: 'password_hash', type: 'string' },
    password: { column: null, inMemoryOnly: true },
    fullName: { column: 'full_name', type: 'string', default: '' },
    email: { column: 'email', type: 'string', default: '' },
    role: { column: 'role', type: 'string', default: 'Super Admin' },
    createdAt: { column: 'created_at', type: 'timestamp' },
    updatedAt: { column: 'updated_at', type: 'timestamp' }
  },
  normalize: mapRowToAdmin
};

function findFieldDef(schema, key) {
  if (!schema || !schema.fields || !key) return null;
  if (schema.fields[key]) {
    return { name: key, def: schema.fields[key] };
  }
  for (const [name, def] of Object.entries(schema.fields)) {
    if (def.column === key) {
      return { name, def };
    }
  }
  return null;
}

module.exports = {
  parseJsonField,
  mapRowToProduct,
  mapRowToOrder,
  mapRowToCustomer,
  mapRowToAdmin,
  findFieldDef,
  productSchema,
  orderSchema,
  customerSchema,
  adminSchema
};

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const connectDatabase = require('./config/db');
const { normalizeProducts } = require('./normalize_products');

const DB_FILE = path.join(__dirname, 'db.json');
const CATALOG_KEYS = ['Product', 'product', 'products', 'catalog', 'items', 'data', 'ProductList'];

const args = process.argv.slice(2);
const hasFlag = flag => args.includes(flag);
const mode = hasFlag('--clear') ? 'clear' : hasFlag('--force') ? 'force' : 'update';

const buildCategory = categoryValue => {
  if (!categoryValue) return 'Uncategorized';
  const value = Array.isArray(categoryValue) ? categoryValue[0] : categoryValue;
  if (value == null) return 'Uncategorized';
  const text = String(value).trim();
  if (!text) return 'Uncategorized';

  const normalized = text.toLowerCase();
  const mapping = {
    'stoves': 'Stoves',
    'welding-products': 'Welding Products',
    'welding products': 'Welding Products',
    'home-appliances': 'Home Appliances',
    'home appliances': 'Home Appliances',
    'engraining-products': 'Engraining Products',
    'engraining products': 'Engraining Products'
  };
  if (mapping[normalized]) return mapping[normalized];

  return text
    .replace(/[-_]/g, ' ')
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const buildProductPayload = product => {
  const payload = {
    sku: product.sku || null,
    slug: product.slug || null,
    name: product.name,
    price: product.price,
    category: buildCategory(product.category),
    icon: product.icon || 'fa-box',
    isNewArrival: !!product.isNewArrival,
    images: Array.isArray(product.images) ? product.images : [],
    createdAt: product.createdAt ? new Date(product.createdAt) : new Date()
  };
  if (product._id) {
    payload._id = product._id;
  }
  return payload;
};

const isSameProduct = (existing, payload) => {
  return existing.name === payload.name &&
    existing.price === payload.price &&
    existing.category === payload.category &&
    existing.icon === payload.icon &&
    existing.isNewArrival === payload.isNewArrival &&
    JSON.stringify(existing.images || []) === JSON.stringify(payload.images || []) &&
    (existing.sku || null) === (payload.sku || null) &&
    (existing.slug || null) === (payload.slug || null);
};

const loadDb = () => {
  if (!fs.existsSync(DB_FILE)) {
    return {};
  }
  const raw = fs.readFileSync(DB_FILE, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Unable to parse ${DB_FILE}: ${err.message}`);
  }
};

const saveDb = db => {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
};

const findCatalogKey = db => CATALOG_KEYS.find(key => Array.isArray(db[key])) || null;

const directDbImport = products => {
  const db = loadDb();
  const catalogKey = findCatalogKey(db) || 'Product';
  if (!Array.isArray(db[catalogKey])) db[catalogKey] = [];
  const existingProducts = db[catalogKey];

  const summary = {
    imported: 0,
    updated: 0,
    skipped: 0,
    total: products.length,
    mode: 'Mock'
  };

  if (mode === 'clear') {
    summary.skipped = existingProducts.length;
    db[catalogKey] = [];
    saveDb(db);
    return summary;
  }

  if (mode === 'force') {
    const payloads = products.map(buildProductPayload);
    db[catalogKey] = payloads.map(p => {
      const row = { ...p };
      if (!row._id) delete row._id;
      if (!row.sku) delete row.sku;
      if (!row.slug) delete row.slug;
      return row;
    });
    saveDb(db);
    summary.imported = db[catalogKey].length;
    return summary;
  }

  for (const product of products) {
    const payload = buildProductPayload(product);
    const matchedIndex = existingProducts.findIndex(doc => {
      const docSku = doc.sku ? String(doc.sku) : (doc._id ? String(doc._id) : null);
      const docName = doc.name ? String(doc.name) : null;
      if (payload.sku && docSku && payload.sku === docSku) {
        return true;
      }
      return docName && payload.name && docName === payload.name;
    });

    if (matchedIndex !== -1) {
      const existingDoc = existingProducts[matchedIndex];
      const existingPayload = {
        sku: existingDoc.sku || null,
        slug: existingDoc.slug || null,
        name: existingDoc.name,
        price: existingDoc.price,
        category: existingDoc.category,
        icon: existingDoc.icon,
        isNewArrival: !!existingDoc.isNewArrival,
        images: Array.isArray(existingDoc.images) ? existingDoc.images : []
      };

      if (isSameProduct(existingPayload, payload)) {
        summary.skipped += 1;
        continue;
      }

      const updatedDoc = { ...existingDoc, ...payload };
      if (existingDoc._id) {
        updatedDoc._id = existingDoc._id;
      }
      existingProducts[matchedIndex] = updatedDoc;
      summary.updated += 1;
    } else {
      const newDoc = { ...payload };
      if (!newDoc._id) delete newDoc._id;
      if (!newDoc.sku) delete newDoc.sku;
      if (!newDoc.slug) delete newDoc.slug;
      existingProducts.push(newDoc);
      summary.imported += 1;
    }
  }

  saveDb(db);
  return summary;
};

const run = async () => {
  try {
    await connectDatabase();
    let parsed = JSON.parse(fs.readFileSync(path.join(__dirname, 'products_normalized.json'), 'utf8'));
    const products = Array.isArray(parsed) ? parsed : (parsed.products || parsed.Product || Object.values(parsed)[0]);
    if (!Array.isArray(products) || products.length === 0) {
      console.error('No products found to import.');
      process.exit(1);
    }

    const dbMode = 'MongoDB';
    let summary = {
      imported: 0,
      updated: 0,
      skipped: 0,
      total: products.length,
      mode: dbMode
    };

    if (dbMode === 'Mock') {
      summary = directDbImport(products);
    } else {
      const Product = require('./models/Product');

      if (mode === 'clear') {
        const existingCount = await Product.countDocuments();
        await Product.deleteMany({});
        summary.skipped = existingCount;
      } else if (mode === 'force') {
        await Product.deleteMany({});
        const payloads = products.map(buildProductPayload);
        await Product.insertMany(payloads);
        summary.imported = payloads.length;
      } else {
        for (const product of products) {
          const payload = buildProductPayload(product);
          const filter = payload.sku
            ? { $or: [{ sku: payload.sku }, { name: payload.name }] }
            : { name: payload.name };

          const existing = await Product.findOne(filter);
          if (existing) {
            const existingPayload = {
              sku: existing.sku || null,
              slug: existing.slug || null,
              name: existing.name,
              price: existing.price,
              category: existing.category,
              icon: existing.icon,
              isNewArrival: !!existing.isNewArrival,
              images: Array.isArray(existing.images) ? existing.images : []
            };

            if (isSameProduct(existingPayload, payload)) {
              summary.skipped += 1;
              continue;
            }

            await Product.findByIdAndUpdate(existing._id, payload);
            summary.updated += 1;
          } else {
            await new Product(payload).save();
            summary.imported += 1;
          }
        }
      }
    }

    console.log('--- Import Summary ---');
    console.log(`Products Imported: ${summary.imported}`);
    console.log(`Products Updated:  ${summary.updated}`);
    console.log(`Products Skipped:  ${summary.skipped}`);
    console.log(`Total Products:    ${summary.total}`);
    console.log(`Database Mode:     ${summary.mode}`);
    process.exit(0);
  } catch (err) {
    console.error('Import failed:', err);
    process.exit(1);
  }
};

run();

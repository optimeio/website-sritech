const mongoose = require('./mongoose');
const connectDatabase = require('./config/db');
const { normalizeProducts } = require('./normalize_products');

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

const buildProductPayload = product => ({
  sku: product.sku || null,
  slug: product.slug || null,
  name: product.name,
  price: product.price,
  category: buildCategory(product.category),
  icon: product.icon || 'fa-box',
  isNewArrival: !!product.isNewArrival,
  images: Array.isArray(product.images) ? product.images : [],
  createdAt: product.createdAt ? new Date(product.createdAt) : new Date()
});

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

const run = async () => {
  try {
    await connectDatabase();
    const Product = require('./models/Product');
    const dbMode = 

    const products = normalizeProducts();
    if (!Array.isArray(products) || products.length === 0) {
      console.error('No products found to import.');
      process.exit(1);
    }

    const summary = {
      imported: 0,
      updated: 0,
      skipped: 0,
      total: products.length,
      mode: dbMode
    };

    if (mode === 'clear') {
      const existingCount = await Product.countDocuments();
      await Product.deleteMany({});
      console.log(`Cleared ${existingCount} products from ${dbMode} mode.`);
      console.log('--- Import Summary ---');
      console.log(`Products Imported: ${summary.imported}`);
      console.log(`Products Updated:  ${summary.updated}`);
      console.log(`Products Skipped:  ${summary.skipped}`);
      console.log(`Total Products:    ${summary.total}`);
      console.log(`Database Mode:     ${summary.mode}`);
      process.exit(0);
    }

    if (mode === 'force') {
      await Product.deleteMany({});
      const payloads = products.map(buildProductPayload);
      await Product.insertMany(payloads);
      summary.imported = payloads.length;
    } else {
      for (const product of products) {
        const payload = buildProductPayload(product);
        const filter = product.sku
          ? { $or: [{ sku: product.sku }, { name: product.name }] }
          : { name: product.name };

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

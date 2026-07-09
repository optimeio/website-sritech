const mongoose = require('../mongoose');

const productSchema = new mongoose.Schema({
  sku: { type: String, required: false, sparse: true },
  slug: { type: String, required: false, sparse: true },
  name: { type: String, required: true },
  price: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, default: '' },
  specifications: { type: String, default: '' },
  stock: { type: Number, default: 0 },
  icon: { type: String, default: 'fa-box' },
  isNewArrival: { type: Boolean, default: false },
  images: [{ type: String }], // Array of base64 strings or URLs
  createdAt: { type: Date, default: Date.now }
});

const overrides = new Map();

const getActiveMongoose = () => (mongoose.getActive ? mongoose.getActive() : mongoose);

const getActiveProductModel = () => {
  const activeMongoose = getActiveMongoose();
  const existingModel = activeMongoose.models?.Product;
  if (existingModel) {
    return existingModel;
  }
  return activeMongoose.model('Product', productSchema);
};

const ProductModelProxy = new Proxy(function ProductModelProxy() {}, {
  construct(target, args) {
    const activeModel = getActiveProductModel();
    return new activeModel(...args);
  },
  get(target, prop) {
    if (overrides.has(prop)) {
      return overrides.get(prop);
    }

    const activeModel = getActiveProductModel();
    const value = activeModel[prop];

    if (typeof value === 'function') {
      return value.bind(activeModel);
    }

    return value;
  },
  set(target, prop, value) {
    overrides.set(prop, value);
    return true;
  }
});

module.exports = ProductModelProxy;

const ActivityLog = require('../models/ActivityLog');
const asyncHandler = require('../middleware/asyncHandler');
const mongoose = require('../mongoose');
const fs = require('fs');
const path = require('path');

const isValidObjectId = (id) => {
  const isMock = mongoose.isMock && mongoose.isMock();
  if (isMock) return true;
  return /^[0-9a-fA-F]{24}$/.test(String(id));
};

const getProductModel = () => require('../models/Product');

const PRODUCT_QUERY_TIMEOUT_MS = Number(process.env.PRODUCT_QUERY_TIMEOUT_MS || 8000);
const PRODUCT_IMAGE_LIMIT = Number(process.env.PRODUCT_IMAGE_LIMIT || 2);
const MAX_DESCRIPTION_LENGTH = Number(process.env.PRODUCT_DESCRIPTION_MAX_LENGTH || 400);
const MAX_SPECIFICATIONS_LENGTH = Number(process.env.PRODUCT_SPECIFICATIONS_MAX_LENGTH || 600);
const PRODUCT_SELECT_FIELDS = 'name price category description specifications howToUse stock icon isNewArrival images video createdAt sku slug';

const uploadToCloudinary = async (base64Str, resourceType = 'auto') => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || typeof base64Str !== 'string' || !base64Str.startsWith('data:')) {
    return base64Str;
  }
  try {
    const cloudinaryObj = require('../config/cloudinary');
    const uploadRes = await cloudinaryObj.uploader.upload(base64Str, {
      resource_type: resourceType,
      folder: 'sritech_products'
    });
    return uploadRes.secure_url;
  } catch (err) {
    console.error('[cloudinary] upload failed, keeping base64:', err.message);
    return base64Str;
  }
};

const isPlainObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

const coerceDocumentToObject = (value) => {
  if (!value) return value;
  if (typeof value.toObject === 'function') return value.toObject();
  if (typeof value.toJSON === 'function') return value.toJSON();
  if (Array.isArray(value)) return value.map((item) => coerceDocumentToObject(item));
  if (isPlainObject(value)) return { ...value };
  return value;
};

const runProductQuery = async (queryFactory, timeoutMs = PRODUCT_QUERY_TIMEOUT_MS) => {
  const queryResult = await executeProductQuery(queryFactory, timeoutMs);
  return coerceDocumentToObject(queryResult);
};

const executeProductQuery = async (queryPromiseFactory, timeoutMs = PRODUCT_QUERY_TIMEOUT_MS) => {
  return Promise.race([
    Promise.resolve().then(() => queryPromiseFactory()),
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Product query timed out after ${timeoutMs}ms`)), timeoutMs);
    })
  ]);
};

const normalizeProductPayload = (payload = {}) => {
  const normalized = { ...payload };
  if (Array.isArray(payload.images)) {
    normalized.images = payload.images.filter(Boolean).map((image) => String(image));
  } else if (payload.images) {
    normalized.images = [String(payload.images)];
  } else {
    normalized.images = [];
  }

  if (payload.video) {
    normalized.video = String(payload.video);
  } else {
    normalized.video = '';
  }
  return normalized;
};

const truncateText = (value, limit) => {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.length <= limit) return trimmed;
  return `${trimmed.slice(0, limit - 3).trimEnd()}...`;
};

const serializeProduct = (product) => {
  if (!product) return product;

  const plainProduct = coerceDocumentToObject(product);

  const images = Array.isArray(plainProduct.images)
    ? plainProduct.images.filter(Boolean).map((image) => String(image)).slice(0, PRODUCT_IMAGE_LIMIT)
    : [];

  const description = truncateText(plainProduct.description, MAX_DESCRIPTION_LENGTH);
  const specifications = truncateText(plainProduct.specifications, MAX_SPECIFICATIONS_LENGTH);

  const sanitized = {
    ...plainProduct,
    _id: plainProduct._id,
    name: plainProduct.name,
    price: plainProduct.price,
    category: plainProduct.category,
    description,
    specifications,
    howToUse: plainProduct.howToUse || '',
    stock: typeof plainProduct.stock === 'number' ? plainProduct.stock : Number(plainProduct.stock) || 0,
    icon: plainProduct.icon || 'fa-box',
    isNewArrival: Boolean(plainProduct.isNewArrival),
    images,
    video: plainProduct.video || '',
    createdAt: plainProduct.createdAt || new Date().toISOString()
  };

  delete sanitized.__v;
  delete sanitized.updatedAt;

  return sanitized;
};

const fallbackProducts = [
  {
    _id: 'fallback-rocket-stove',
    name: 'Rocket Stove',
    price: '₹3,999',
    category: 'Stoves',
    icon: 'fa-fire',
    isNewArrival: true,
    images: ['/rocket-stove.png'],
    createdAt: new Date().toISOString()
  },
  {
    _id: 'fallback-10-stove',
    name: '10" Stove',
    price: '₹4,499',
    category: 'Stoves',
    icon: 'fa-burn',
    images: ['/hero-image.png'],
    createdAt: new Date().toISOString()
  },
  {
    _id: 'fallback-rocket-stove-pro',
    name: 'Rocket Stove Pro',
    price: '₹5,499',
    category: 'Stoves',
    icon: 'fa-fire-flame-simple',
    images: ['/rocket-stove.png'],
    createdAt: new Date().toISOString()
  },
  {
    _id: 'fallback-stove-plate-kit',
    name: 'Stove Cooking Plate Kit',
    price: '₹1,299',
    category: 'Stoves',
    icon: 'fa-hot-tub-person',
    images: ['/hero-image.png'],
    createdAt: new Date().toISOString()
  },
  {
    _id: 'fallback-home-kit',
    name: 'Home Appliance Starter Kit',
    price: '₹1,999',
    category: 'Home Appliances',
    icon: 'fa-house',
    images: ['/hero-banner.png'],
    createdAt: new Date().toISOString()
  },
  {
    _id: 'fallback-engraining',
    name: 'Engraining Premium Pack',
    price: '₹2,999',
    category: 'Engraining Products',
    icon: 'fa-screwdriver-wrench',
    images: ['/rocket-stove.png'],
    createdAt: new Date().toISOString()
  },
  {
    _id: 'fallback-welding',
    name: 'SriTech Welding Torch',
    price: '₹2,499',
    category: 'Welding Products',
    icon: 'fa-fire-flame-curved',
    isNewArrival: true,
    images: ['/hero-image.png'],
    createdAt: new Date().toISOString()
  }
];

const deletedFallbackIds = new Set();

const getProductsFromStore = async () => {
  const isConnected = mongoose.connection?.readyState === 1 || mongoose.isMock?.();

  if (!isConnected) {
    console.warn('Product store is not ready, using fallback catalog.');
    return fallbackProducts.filter(p => !deletedFallbackIds.has(p._id));
  }

  const Product = getProductModel();

  try {
    const products = await runProductQuery(
      () => Product.find().select(PRODUCT_SELECT_FIELDS).sort({ createdAt: -1 }).allowDiskUse(true),
      PRODUCT_QUERY_TIMEOUT_MS
    );

    if (Array.isArray(products) && products.length > 0) {
      return products.map((product) => serializeProduct(product));
    }
  } catch (err) {
    console.warn('Product store unavailable, using fallback catalog:', err.message);
  }

  return fallbackProducts.filter(p => !deletedFallbackIds.has(p._id));
};

exports.getProducts = asyncHandler(async (req, res) => {
  const products = await getProductsFromStore();
  res.json(products);
});

exports.getProductById = asyncHandler(async (req, res) => {
  const Product = getProductModel();
  let product = null;
  const isConnected = mongoose.connection?.readyState === 1 || mongoose.isMock?.();
  const isValid = isValidObjectId(req.params.id);

  if (isConnected && (!mongoose.connection?.readyState === 1 || isValid)) {
    try {
      product = await runProductQuery(
        () => Product.findById(req.params.id).select(PRODUCT_SELECT_FIELDS),
        PRODUCT_QUERY_TIMEOUT_MS
      );
    } catch (err) {
      console.warn('Product lookup failed, using fallback product data:', err.message);
    }
  }

  if (!product) {
    product = fallbackProducts.find(item => item._id === req.params.id);
  }

  if (!product) return res.status(404).json({ message: 'Product not found.' });
  res.json(serializeProduct(product));
});

exports.createProduct = asyncHandler(async (req, res) => {
  const Product = getProductModel();
  const payload = normalizeProductPayload(req.body);

  if (Array.isArray(payload.images)) {
    payload.images = await Promise.all(
      payload.images.map(img => uploadToCloudinary(img, 'image'))
    );
  }
  if (payload.video) {
    payload.video = await uploadToCloudinary(payload.video, 'video');
  }

  const product = new Product(payload);
  const saved = await product.save();
  await new ActivityLog({ action: 'Added Product', details: `Product: ${saved.name}` }).save();
  res.status(201).json(serializeProduct(saved));
});

exports.updateProduct = asyncHandler(async (req, res) => {
  const Product = getProductModel();
  const payload = normalizeProductPayload(req.body);
  const isValid = isValidObjectId(req.params.id);

  if (Array.isArray(payload.images)) {
    payload.images = await Promise.all(
      payload.images.map(img => uploadToCloudinary(img, 'image'))
    );
  }
  if (payload.video) {
    payload.video = await uploadToCloudinary(payload.video, 'video');
  }

  let product = null;
  if (isValid) {
    product = await Product.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
  }

  if (!product) {
    const isFallback = fallbackProducts.some(p => p._id === req.params.id);
    if (isFallback) {
      return res.json({
        ...payload,
        _id: req.params.id,
        message: 'Fallback product updated in memory successfully.'
      });
    }
    return res.status(404).json({ message: 'Product not found.' });
  }
  await new ActivityLog({ action: 'Updated Product', details: `Product ${product.name} updated` }).save();
  res.json(serializeProduct(product));
});

exports.deleteProduct = asyncHandler(async (req, res) => {
  const Product = getProductModel();
  const isValid = isValidObjectId(req.params.id);

  let product = null;
  if (isValid) {
    product = await Product.findByIdAndDelete(req.params.id);
  }

  if (!product) {
    const isFallback = fallbackProducts.some(p => p._id === req.params.id);
    if (isFallback) {
      deletedFallbackIds.add(req.params.id);
      return res.json({ message: 'Fallback product deleted from view successfully.' });
    }
    return res.status(404).json({ message: 'Product not found.' });
  }
  await new ActivityLog({ action: 'Deleted Product', details: `Product ${product.name} deleted permanently` }).save();
  res.json({ message: 'Product deleted successfully.' });
});

exports.executeProductQuery = executeProductQuery;
exports.getProductsFromStore = getProductsFromStore;

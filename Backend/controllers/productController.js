const Product = require('../models/Product');
const ActivityLog = require('../models/ActivityLog');
const asyncHandler = require('../middleware/asyncHandler');
const mongoose = require('mongoose');

const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(String(id));
};

const PRODUCT_IMAGE_LIMIT = Number(process.env.PRODUCT_IMAGE_LIMIT || 2);
const MAX_DESCRIPTION_LENGTH = Number(process.env.PRODUCT_DESCRIPTION_MAX_LENGTH || 400);
const MAX_SPECIFICATIONS_LENGTH = Number(process.env.PRODUCT_SPECIFICATIONS_MAX_LENGTH || 600);
const PRODUCT_SELECT_FIELDS = 'name price category description specifications howToUse stock shippingCharge icon isNewArrival images video createdAt sku slug';

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

  const courierOptions = Array.isArray(plainProduct.courierOptions) && plainProduct.courierOptions.length > 0
    ? plainProduct.courierOptions.map(c => ({ name: String(c.name || ''), price: Number(c.price || 0) }))
    : [
        { name: 'rathimeena parcel service', price: 100 },
        { name: 'ST Couriers', price: 150 }
      ];

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
    shippingCharge: typeof plainProduct.shippingCharge === 'number' ? plainProduct.shippingCharge : Number(plainProduct.shippingCharge) || 0,
    gstPercent: typeof plainProduct.gstPercent === 'number' ? plainProduct.gstPercent : Number(plainProduct.gstPercent) || 0,
    discountPercent: typeof plainProduct.discountPercent === 'number' ? plainProduct.discountPercent : Number(plainProduct.discountPercent) || 0,
    courierOptions,
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

exports.getProducts = asyncHandler(async (req, res) => {
  let products = [];
  try {
    products = await Product.find().select(PRODUCT_SELECT_FIELDS).sort({ createdAt: -1 }).lean();
  } catch (err) {
    console.error('[getProducts] MongoDB error, falling back to local dataset:', err.message);
  }

  if (Array.isArray(products) && products.length > 0) {
    return res.json(products.map(serializeProduct));
  }

  // Fallback to local products_normalized.json if DB is empty or unreachable
  try {
    const fs = require('fs');
    const path = require('path');
    const normPath = path.join(__dirname, '..', 'products_normalized.json');
    if (fs.existsSync(normPath)) {
      const raw = fs.readFileSync(normPath, 'utf8');
      const parsed = JSON.parse(raw);
      const list = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.products) ? parsed.products : []);
      if (list.length > 0) {
        console.log(`[getProducts] Serving ${list.length} products from fallback file.`);
        return res.json(list.map((item, idx) => serializeProduct({
          _id: item._id || item.sku || `fallback-${idx + 1}`,
          ...item
        })));
      }
    }
  } catch (fallbackErr) {
    console.error('[getProducts] Fallback file read error:', fallbackErr.message);
  }

  res.json([]);
});

exports.getProductById = asyncHandler(async (req, res) => {
  let product = null;
  const target = req.params.id;
  
  if (isValidObjectId(target)) {
    product = await Product.findById(target).select(PRODUCT_SELECT_FIELDS);
  }
  
  if (!product) {
    product = await Product.findOne({ $or: [{ slug: target }, { _id: target }] }).select(PRODUCT_SELECT_FIELDS);
  }

  if (!product) return res.status(404).json({ message: 'Product not found.' });
  res.json(serializeProduct(product));
});

exports.createProduct = asyncHandler(async (req, res) => {
  const payload = normalizeProductPayload(req.body);

  if (Array.isArray(payload.images)) {
    payload.images = await Promise.all(
      payload.images.map(img => uploadToCloudinary(img, 'image'))
    );
  }
  if (payload.video) {
    payload.video = await uploadToCloudinary(payload.video, 'video');
  }

  if (!payload.slug && payload.name) {
    const baseSlug = String(payload.name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    payload.slug = `${baseSlug}-${Date.now().toString(36)}`;
  }

  const product = new Product(payload);
  const saved = await product.save();
  await new ActivityLog({ action: 'Added Product', details: `Product: ${saved.name}` }).save();

  res.status(201).json({ success: true, product: serializeProduct(saved) });
});

exports.updateProduct = asyncHandler(async (req, res) => {
  const payload = normalizeProductPayload(req.body);
  const isValid = isValidObjectId(req.params.id);

  if (!isValid) return res.status(400).json({ success: false, message: 'Invalid Product ID' });

  if (Array.isArray(payload.images)) {
    payload.images = await Promise.all(
      payload.images.map(img => uploadToCloudinary(img, 'image'))
    );
  }
  if (payload.video) {
    payload.video = await uploadToCloudinary(payload.video, 'video');
  }

  const updated = await Product.findByIdAndUpdate(req.params.id, payload, { new: true });

  if (!updated) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  await new ActivityLog({ action: 'Updated Product', details: `Product ${updated.name}` }).save();

  res.json({ success: true, product: serializeProduct(updated) });
});

exports.deleteProduct = asyncHandler(async (req, res) => {
  const isValid = isValidObjectId(req.params.id);

  if (!isValid) return res.status(400).json({ message: 'Invalid Product ID' });

  const product = await Product.findByIdAndDelete(req.params.id);

  if (!product) {
    return res.status(404).json({ message: 'Product not found.' });
  }
  
  await new ActivityLog({ action: 'Deleted Product', details: `Product ${product.name} deleted permanently` }).save();
  res.json({ message: 'Product deleted successfully.' });
});

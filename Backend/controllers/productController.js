const Product = require('../models/Product');
const ActivityLog = require('../models/ActivityLog');
const asyncHandler = require('../middleware/asyncHandler');
const mongoose = require('mongoose');

const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(String(id));
};

const PRODUCT_IMAGE_LIMIT = Number(process.env.PRODUCT_IMAGE_LIMIT || 10);
const MAX_DESCRIPTION_LENGTH = Number(process.env.PRODUCT_DESCRIPTION_MAX_LENGTH || 400);
const MAX_SPECIFICATIONS_LENGTH = Number(process.env.PRODUCT_SPECIFICATIONS_MAX_LENGTH || 600);
const PRODUCT_SELECT_FIELDS = 'name price category description specifications howToUse burnerSize stoveWeight dimensions material stock shippingCharge gstPercent discountPercent courierOptions icon isNewArrival createdAt sku slug images video';

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
        { name: 'Rathimeena Parcel Service', price: 150 },
        { name: 'ST Couriers', price: 250 },
        { name: 'MML Express', price: 150 }
      ];

  const sanitized = {
    ...plainProduct,
    _id: plainProduct._id,
    name: plainProduct.name,
    price: plainProduct.price,
    category: Array.isArray(plainProduct.category) ? plainProduct.category[0] || '' : String(plainProduct.category || ''),
    description,
    specifications,
    howToUse: plainProduct.howToUse || '',
    burnerSize: plainProduct.burnerSize || '',
    stoveWeight: plainProduct.stoveWeight || '',
    dimensions: plainProduct.dimensions || '',
    material: plainProduct.material || '',
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
  // If MongoDB is not yet connected (e.g. server just started), return empty array gracefully
  if (mongoose.connection.readyState !== 1) {
    return res.json([]);
  }

  let products = [];
  try {
    const selectObj = PRODUCT_SELECT_FIELDS.split(' ').reduce((acc, field) => ({ ...acc, [field]: 1 }), {});

    // Hard 25-second timeout to accommodate MongoDB Atlas high latency
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout after 25s')), 25000)
    );
    const queryPromise = Product.find().select(selectObj).maxTimeMS(25000).lean();
    products = await Promise.race([queryPromise, timeoutPromise]);
  } catch (err) {
    console.error('[getProducts] MongoDB error:', err.message);
    // Return empty array instead of hanging — frontend will retry via poll interval
    return res.json([]);
  }

  if (Array.isArray(products)) {
    products.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return res.json(products.map(serializeProduct));
  }

  res.json([]);
});

exports.getProductById = asyncHandler(async (req, res) => {
  let product = null;
  const target = req.params.id;
  
  try {
    const queryPromise = isValidObjectId(target) ? Product.findById(target) : Product.findOne({ slug: target });
    product = await queryPromise;
  } catch (err) {
    console.error('[getProductById] MongoDB error:', err.message);
  }

  if (product) return res.json(serializeProduct(product));

  res.status(404).json({ message: 'Product not found.' });
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

import React, { useState, useEffect } from 'react';
import './index.css';

const compressImageBase64 = (base64Str, maxWidth = 600, maxHeight = 600, quality = 0.6) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(base64Str);
  });
};

const AdminDashboard = ({ 
  onLogout, 
  products, 
  onAddProduct, 
  onDeleteProduct,
  onUpdateProduct,
  fetchProductDetails,
  navigate,
  offers = [],
  offerData, 
  onUpdateOffer, 
  onDeleteOffer,
  onToggleOffer,
  onDuplicateOffer,
  categories, 
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onAddCoupon,
  onDeleteCoupon,
  onUpdateCoupon,
  onUpdateOrder,
  orders = [],
  coupons = [],
  supportQueries = [],
  returnRequests = [],
  refundRequests = [],
  activityLogs = [],
  leads = [],
  onUpdateLeadStatus,
  onDeleteLead,
  users = [],
  onToggleBlockUser,
  onDeleteUser,
  onRefresh,
  isRefreshing,
  onViewPublicProducts,
  heroBanners = [],
  onAddHeroBanner,
  onDeleteHeroBanner,
  onRespondToSupport
}) => {
  const buildOfferFormState = (data = {}) => ({
    _id: data._id || data.id || '',
    title: data.title || 'Special Offer! 🎉',
    description: data.description || '',
    code: data.code || '',
    type: data.type || 'product',
    targetValue: data.targetValue || data.category || data.productName || '',
    discountType: data.discountType || 'percentage',
    discountValue: data.discountValue ?? data.discountPercent ?? '',
    priority: data.priority ?? 0,
    poster: data.poster || '',
    images: Array.isArray(data.images) ? data.images.filter(Boolean) : [],
    productName: data.productName || '',
    category: data.category || '',
    condition: data.condition || 'New',
    badgeLabel: data.badgeLabel || 'Featured Offer',
    originalPrice: data.originalPrice ?? '',
    offerPrice: data.offerPrice ?? '',
    mrpIllusion: data.mrpIllusion ?? '',
    discountPercent: data.discountPercent ?? '',
    stockUnits: data.stockUnits ?? '',
    rating: data.rating ?? '',
    startDate: data.startDate || '',
    endDate: data.endDate || '',
    comboContents: data.comboContents || '',
    isActive: data.isActive !== false,
    isPublished: Boolean(data.isPublished)
  });

  const [activeTab, setActiveTab] = useState('Overview');
  const [offerForm, setOfferForm] = useState(() => buildOfferFormState(offerData));
  const [editingOfferId, setEditingOfferId] = useState(null);
  const [offerSearch, setOfferSearch] = useState('');
  const [offerStatusFilter, setOfferStatusFilter] = useState('all');
  const [offerSort, setOfferSort] = useState('priority');
  const [offerImageUrl, setOfferImageUrl] = useState('');
  const [newProductImageUrl, setNewProductImageUrl] = useState('');
  const [editProductImageUrl, setEditProductImageUrl] = useState('');
  const [newHeroBanner, setNewHeroBanner] = useState({ image: '', caption: '' });
  const [supportReplies, setSupportReplies] = useState({});
  const [inventoryStockDrafts, setInventoryStockDrafts] = useState({});

  const [expandedUserId, setExpandedUserId] = useState(null);
  const [leadSearchTerm, setLeadSearchTerm] = useState('');
  const [leadStatusFilter, setLeadStatusFilter] = useState('All');
  const [selectedLead, setSelectedLead] = useState(null);
  const [leadAdminNotesInput, setLeadAdminNotesInput] = useState('');

  const getWishlistItems = (user) => {
    const wishlistIds = [...(user?.wishlist || []), ...(user?.waitlist || [])].map(id => String(id));
    return Array.isArray(products) ? products.filter(p => {
      const pid = (p._id || p.id)?.toString();
      return pid && wishlistIds.includes(pid);
    }) : [];
  };

  const getCartItems = (user) => {
    const cartIds = (user?.cart || []).map(id => String(id));
    return Array.isArray(products) ? products.filter(p => {
      const pid = (p._id || p.id)?.toString();
      return pid && cartIds.includes(pid);
    }) : [];
  };

  const getUserOrders = (user) => {
    const userIdStr = (user?._id || user?.id)?.toString();
    const userEmailStr = user?.email?.toLowerCase();
    return Array.isArray(orders) ? orders.filter(o => {
      const orderUserId = o.user?.toString() || o.userId?.toString() || o.customerId?.toString();
      const orderEmail = o.customerEmail?.toLowerCase() || o.email?.toLowerCase();
      return (orderUserId && userIdStr && orderUserId === userIdStr) || 
             (orderEmail && userEmailStr && orderEmail === userEmailStr);
    }) : [];
  };

  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [orderShippingForm, setOrderShippingForm] = useState({
    status: '',
    courierPartner: '',
    trackingNumber: '',
    trackingUrl: '',
    shipmentDate: '',
    estimatedDelivery: '',
    currentLocation: '',
    deliveryPersonName: '',
    deliveryPhone: '',
    note: ''
  });

  const orderStatusOptions = [
    'Payment Successful',
    'Order Confirmed',
    'Processing',
    'Packed',
    'Shipped',
    'In Transit',
    'Out For Delivery',
    'Delivered',
    'Cancelled',
    'Return Requested',
    'Return Approved',
    'Return Rejected',
    'Returned',
    'Refund Initiated',
    'Refund Completed'
  ];

  const orderProgressStages = [
    { key: 'Ordered', label: 'Ordered' },
    { key: 'Shipped', label: 'Shipped' },
    { key: 'Out For Delivery', label: 'Out for Delivery' },
    { key: 'Delivered', label: 'Delivered' }
  ];

  const getOrderProgressIndex = (status = '') => {
    const normalized = String(status || '').trim();
    if (!normalized) return 0;
    if (['Payment Successful', 'Order Confirmed', 'Processing', 'Packed', 'Ordered'].includes(normalized)) return 0;
    if (['Shipped', 'In Transit'].includes(normalized)) return 1;
    if (['Out For Delivery', 'Out for Delivery'].includes(normalized)) return 2;
    if (['Delivered'].includes(normalized)) return 3;
    if (['Cancelled', 'Returned', 'Return Requested', 'Return Approved', 'Return Rejected', 'Refund Initiated', 'Refund Completed'].includes(normalized)) return -1;
    return 0;
  };
  
  useEffect(() => {
    setOfferForm(buildOfferFormState(offerData));
  }, [offerData]);

  const [newCategory, setNewCategory] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discountType: 'Percentage',
    discountValue: '',
    linkedProduct: '',
    expiryDate: ''
  });
  
  const [editingCouponId, setEditingCouponId] = useState(null);
  const [isImageProcessing, setIsImageProcessing] = useState(false);

  const formatExipryDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      return d.toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };

  const startEditCoupon = (coupon) => {
    setEditingCouponId(coupon._id || coupon.id);
    setNewCoupon({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      linkedProduct: coupon.linkedProduct || '',
      expiryDate: formatExipryDate(coupon.expiryDate)
    });
  };

  const selectedOrder = orders.find(o => (o._id || o.id) === selectedOrderId) || null;

  useEffect(() => {
    if (!selectedOrder) return;
    setOrderShippingForm({
      status: selectedOrder.status || '',
      courierPartner: selectedOrder.courierPartner || '',
      trackingNumber: selectedOrder.trackingNumber || '',
      trackingUrl: selectedOrder.trackingUrl || '',
      shipmentDate: selectedOrder.shipmentDate ? new Date(selectedOrder.shipmentDate).toISOString().split('T')[0] : '',
      estimatedDelivery: selectedOrder.estimatedDelivery ? new Date(selectedOrder.estimatedDelivery).toISOString().split('T')[0] : '',
      currentLocation: selectedOrder.currentLocation || '',
      deliveryPersonName: selectedOrder.deliveryPersonName || '',
      deliveryPhone: selectedOrder.deliveryPhone || '',
      note: ''
    });
  }, [selectedOrder]);

  const handleSelectOrder = (order) => {
    setSelectedOrderId(order._id || order.id);
  };

  const updateShippingFormField = (field, value) => {
    setOrderShippingForm(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdateOrder = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const payload = {
      status: orderShippingForm.status,
      courierPartner: orderShippingForm.courierPartner,
      trackingNumber: orderShippingForm.trackingNumber,
      trackingUrl: orderShippingForm.trackingUrl,
      shipmentDate: orderShippingForm.shipmentDate || undefined,
      estimatedDelivery: orderShippingForm.estimatedDelivery || undefined,
      currentLocation: orderShippingForm.currentLocation,
      deliveryPersonName: orderShippingForm.deliveryPersonName,
      deliveryPhone: orderShippingForm.deliveryPhone,
      note: orderShippingForm.note
    };

    await onUpdateOrder(selectedOrder._id || selectedOrder.id, payload);
  };

  const cancelEditCoupon = () => {
    setEditingCouponId(null);
    setNewCoupon({
      code: '',
      discountType: 'Percentage',
      discountValue: '',
      linkedProduct: '',
      expiryDate: ''
    });
  };

  const [newProduct, setNewProduct] = useState({ 
    name: '', 
    price: '', 
    originalPrice: '',
    mrp: '',
    description: '',
    specifications: '',
    howToUse: '',
    burnerSize: '',
    stoveWeight: '',
    dimensions: '',
    material: '',
    usage: '',
    fuelType: '',
    cookingSurface: '',
    cookingCapacity: '',
    stock: 0,
    shippingCharge: 0,
    gstPercent: 0,
    discountPercent: 0,
    courierOptions: [
      { name: 'Rathimeena Parcel Service', price: 150 },
      { name: 'ST Couriers', price: 250 },
      { name: 'MML Express', price: 150 }
    ],
    category: categories[0]?.slug || categories[0]?.name || 'engraining-products', 
    icon: 'fa-box',
    isNewArrival: false,
    images: [],
    video: '' 
  });

  // --- Edit Product State ---
  const [editingProductId, setEditingProductId] = useState(null);
  const [editProduct, setEditProduct] = useState({
    name: '', price: '', originalPrice: '', mrp: '', description: '', specifications: '', howToUse: '', burnerSize: '', stoveWeight: '', dimensions: '', material: '', usage: '', fuelType: '', cookingSurface: '', cookingCapacity: '', stock: 0, shippingCharge: 0, gstPercent: 0, discountPercent: 0, courierOptions: [], category: '', isNewArrival: false, images: [], video: ''
  });
  const [replaceEditImages, setReplaceEditImages] = useState(false);

  // --- Auto-calculating Product Pricing & Discount Handlers ---
  const handleNewProductPricingChange = (field, rawValue) => {
    const cleanVal = String(rawValue || '').replace(/[^\d.]/g, '');
    setNewProduct(prev => {
      let nextMrp = field === 'originalPrice' ? cleanVal : (prev.originalPrice || prev.mrp || '');
      let nextSelling = field === 'price' ? cleanVal : (prev.price || '');
      let nextDiscount = field === 'discountPercent' ? cleanVal : (prev.discountPercent || 0);

      const mrpNum = parseFloat(nextMrp) || 0;
      const sellingNum = parseFloat(nextSelling) || 0;
      const discNum = parseFloat(nextDiscount) || 0;

      if (field === 'originalPrice') {
        if (mrpNum > 0 && sellingNum > 0 && mrpNum >= sellingNum) {
          nextDiscount = Math.round(((mrpNum - sellingNum) / mrpNum) * 100);
        } else if (mrpNum > 0 && discNum > 0 && (!nextSelling || sellingNum === 0)) {
          nextSelling = String(Math.round(mrpNum * (1 - discNum / 100)));
        } else if (mrpNum > 0 && sellingNum > mrpNum) {
          nextDiscount = 0;
        }
      } else if (field === 'price') {
        if (mrpNum > 0 && sellingNum > 0) {
          if (mrpNum >= sellingNum) {
            nextDiscount = Math.round(((mrpNum - sellingNum) / mrpNum) * 100);
          } else {
            nextDiscount = 0;
          }
        }
      } else if (field === 'discountPercent') {
        const clampedDisc = Math.min(100, Math.max(0, discNum));
        nextDiscount = cleanVal === '' ? '' : clampedDisc;
        if (mrpNum > 0) {
          nextSelling = String(Math.round(mrpNum * (1 - (clampedDisc / 100))));
        }
      }

      return {
        ...prev,
        originalPrice: nextMrp,
        mrp: nextMrp,
        price: nextSelling,
        discountPercent: nextDiscount === '' ? 0 : Number(nextDiscount)
      };
    });
  };

  const handleEditProductPricingChange = (field, rawValue) => {
    const cleanVal = String(rawValue || '').replace(/[^\d.]/g, '');
    setEditProduct(prev => {
      let nextMrp = field === 'originalPrice' ? cleanVal : (prev.originalPrice || prev.mrp || '');
      let nextSelling = field === 'price' ? cleanVal : (prev.price || '');
      let nextDiscount = field === 'discountPercent' ? cleanVal : (prev.discountPercent || 0);

      const mrpNum = parseFloat(nextMrp) || 0;
      const sellingNum = parseFloat(nextSelling) || 0;
      const discNum = parseFloat(nextDiscount) || 0;

      if (field === 'originalPrice') {
        if (mrpNum > 0 && sellingNum > 0 && mrpNum >= sellingNum) {
          nextDiscount = Math.round(((mrpNum - sellingNum) / mrpNum) * 100);
        } else if (mrpNum > 0 && discNum > 0 && (!nextSelling || sellingNum === 0)) {
          nextSelling = String(Math.round(mrpNum * (1 - discNum / 100)));
        } else if (mrpNum > 0 && sellingNum > mrpNum) {
          nextDiscount = 0;
        }
      } else if (field === 'price') {
        if (mrpNum > 0 && sellingNum > 0) {
          if (mrpNum >= sellingNum) {
            nextDiscount = Math.round(((mrpNum - sellingNum) / mrpNum) * 100);
          } else {
            nextDiscount = 0;
          }
        }
      } else if (field === 'discountPercent') {
        const clampedDisc = Math.min(100, Math.max(0, discNum));
        nextDiscount = cleanVal === '' ? '' : clampedDisc;
        if (mrpNum > 0) {
          nextSelling = String(Math.round(mrpNum * (1 - (clampedDisc / 100))));
        }
      }

      return {
        ...prev,
        originalPrice: nextMrp,
        mrp: nextMrp,
        price: nextSelling,
        discountPercent: nextDiscount === '' ? 0 : Number(nextDiscount)
      };
    });
  };

  const extractProductDefaults = (p) => {
    if (!p) return { burnerSize: '', stoveWeight: '', dimensions: '', material: '', howToUse: '', usage: '', fuelType: '', cookingSurface: '', cookingCapacity: '' };
    const name = p.name || '';
    const desc = p.description || '';
    const specs = p.specifications || '';

    let burnerSize = p.burnerSize || '';
    let stoveWeight = p.stoveWeight || '';
    let dimensions = p.dimensions || '';
    let material = p.material || '';
    let howToUse = p.howToUse || '';
    let usage = p.usage || '';
    let fuelType = p.fuelType || '';
    let cookingSurface = p.cookingSurface || '';
    let cookingCapacity = p.cookingCapacity || '';

    if (!burnerSize) {
      const match = (desc + ' ' + specs + ' ' + name).match(/(?:burner size|burner)\s*:\s*([^,\.\n;]+)/i);
      if (match) burnerSize = match[1].trim();
      else if (/6"/i.test(name) || /6 inch/i.test(name)) burnerSize = '6 Inches';
      else if (/double layer/i.test(name)) burnerSize = '6 Inches';
      else if (/single layer/i.test(name)) burnerSize = '5 Inches';
      else burnerSize = '6 Inches';
    }

    if (!stoveWeight) {
      const match = (desc + ' ' + specs).match(/(?:stove weight|weight|wt)\s*:\s*([^,\.\n;]+)/i);
      if (match) stoveWeight = match[1].trim();
      else if (/m5/i.test(name)) stoveWeight = '18 to 20 kg';
      else if (/m4/i.test(name)) stoveWeight = '8.5 kg';
      else stoveWeight = '8.5 kg';
    }

    if (!dimensions) {
      const match = (desc + ' ' + specs).match(/(?:dimensions|dim)\s*:\s*([^,\.\n;]+)/i);
      if (match) dimensions = match[1].trim();
      else if (/m5/i.test(name)) dimensions = '18" × 18" × 19"';
      else if (/m4/i.test(name)) dimensions = '12" × 10" × 14"';
      else dimensions = '12" × 10" × 14"';
    }

    if (!material) {
      const match = (desc + ' ' + specs).match(/material\s*:\s*([^,\.\n;]+)/i);
      if (match) material = match[1].trim();
      else if (/ss|stainless steel/i.test(desc + ' ' + specs + ' ' + name)) material = 'Premium Stainless Steel (SS)';
      else material = 'Mild Steel (MS)';
    }

    if (!howToUse) {
      howToUse = `1. Place stove on a stable, non-combustible surface.\n2. Fill combustion chamber with fuel (wood, coconut shell, husk or biomass).\n3. Connect & switch on air regulator blower for clean combustion.\n4. Light fuel from top/side port and adjust fan speed for flame intensity.`;
    }

    if (!usage) {
      const match = (desc + ' ' + specs).match(/usage\s*:\s*([^:\n;]+)/i);
      if (match) usage = match[1].trim();
      else usage = 'Crafted for Temples, Hotels, Restaurants, Bakeries, Cafes, Tea Shops, Catering Services, Cloud Kitchens, Street Food Businesses, and Every Professional Kitchen.';
    }

    if (!fuelType) {
      const match = (desc + ' ' + specs).match(/(?:fuel type|fuel)\s*:\s*([^:\n;]+)/i);
      if (match) fuelType = match[1].trim();
      else fuelType = 'Wood, Coconut shell & husk, Charcoal & Biomass';
    }

    if (!cookingSurface) {
      const match = (desc + ' ' + specs).match(/cooking surface\s*:\s*([^:\n;]+)/i);
      if (match) cookingSurface = match[1].trim();
      else cookingSurface = 'Flat';
    }

    if (!cookingCapacity) {
      const match = (desc + ' ' + specs).match(/(?:cooking capacity|capacity)\s*:\s*([^:\n;]+)/i);
      if (match) cookingCapacity = match[1].trim();
      else if (/m9|m10|12"|12 inch|dual stove/i.test(name)) cookingCapacity = 'Up to 90 kg (150 - 300+ Persons / Mega Commercial & Temples)';
      else if (/m8|10"|10 inch/i.test(name)) cookingCapacity = 'Up to 75 kg (100 - 150 Persons / Large Commercial)';
      else if (/m6|dual turbo/i.test(name)) cookingCapacity = 'Up to 50 kg (40 - 75 Persons / Dual Commercial)';
      else if (/m7|8"|8 inch/i.test(name)) cookingCapacity = 'Up to 40 kg (40 - 75 Persons / Commercial & Hotels)';
      else if (/m5/i.test(name)) cookingCapacity = 'Up to 30 kg (25 - 40 Persons / Commercial & Catering)';
      else if (/m4/i.test(name)) cookingCapacity = 'Up to 25 kg (15 - 25 Persons / Small Hotels & Homes)';
      else cookingCapacity = 'Up to 10 kg (4 - 8 Persons / Home Cooking)';
    }

    return { burnerSize, stoveWeight, dimensions, material, howToUse, usage, fuelType, cookingSurface, cookingCapacity };
  };

  const startEditProduct = async (listProduct) => {
    setEditingProductId(listProduct._id || listProduct.id);
    let p = listProduct;
    if (fetchProductDetails) {
      const full = await fetchProductDetails(listProduct._id || listProduct.id);
      if (full) p = full;
    }

    const defaults = extractProductDefaults(p);

    const cleanPrice = p.price ? p.price.toString().replace(/[₹,]/g, '').trim() : '';
    const numPrice = Number(cleanPrice) || 0;
    const numDisc = typeof p.discountPercent === 'number' ? p.discountPercent : (Number(p.discountPercent) || 0);

    let resolvedOriginalPrice = '';
    if (p.originalPrice && Number(p.originalPrice) > 0) {
      resolvedOriginalPrice = String(p.originalPrice);
    } else if (p.mrp && Number(p.mrp) > 0) {
      resolvedOriginalPrice = String(p.mrp);
    } else if (numDisc > 0 && numPrice > 0) {
      resolvedOriginalPrice = String(Math.round(numPrice / (1 - numDisc / 100)));
    }
    
    setEditProduct({
      name: p.name || '',
      price: cleanPrice,
      originalPrice: resolvedOriginalPrice,
      mrp: resolvedOriginalPrice,
      description: p.description || '',
      specifications: p.specifications || '',
      howToUse: p.howToUse || defaults.howToUse,
      burnerSize: p.burnerSize || defaults.burnerSize,
      stoveWeight: p.stoveWeight || defaults.stoveWeight,
      dimensions: p.dimensions || defaults.dimensions,
      material: p.material || defaults.material,
      usage: p.usage || defaults.usage,
      fuelType: p.fuelType || defaults.fuelType,
      cookingSurface: p.cookingSurface || defaults.cookingSurface,
      cookingCapacity: p.cookingCapacity || defaults.cookingCapacity,
      stock: typeof p.stock === 'number' ? p.stock : 0,
      shippingCharge: typeof p.shippingCharge === 'number' ? p.shippingCharge : 0,
      gstPercent: typeof p.gstPercent === 'number' ? p.gstPercent : 0,
      discountPercent: numDisc,
      courierOptions: Array.isArray(p.courierOptions) && p.courierOptions.length > 0 ? p.courierOptions : [
        { name: 'Rathimeena Parcel Service', price: 150 },
        { name: 'ST Couriers', price: 250 },
        { name: 'MML Express', price: 150 }
      ],
      category: p.category || categories[0]?.slug || categories[0]?.name || '',
      isNewArrival: p.isNewArrival || false,
      images: p.images || [],
      video: p.video || ''
    });
    setReplaceEditImages(false);
    // Scroll to top of products section
    setTimeout(() => document.getElementById('edit-product-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const cancelEditProduct = () => {
    setEditingProductId(null);
    setEditProduct({
      name: '', price: '', originalPrice: '', mrp: '', category: '',
      description: '', specifications: '', howToUse: '',
      burnerSize: '', stoveWeight: '', dimensions: '', material: '',
      usage: '', fuelType: '', cookingSurface: '', cookingCapacity: '',
      isNewArrival: false, images: [], video: '', shippingCharge: 0, discountPercent: 0, courierOptions: []
    });
    setReplaceEditImages(false);
  };

  const handleEditFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    if (files.length > 10) {
      alert('Maximum 10 images allowed per product.');
      return;
    }

    const maxAllowed = replaceEditImages ? 10 : 10 - editProduct.images.length;
    if (files.length > maxAllowed) {
      alert('Maximum 10 images allowed per product.');
      return;
    }

    setIsImageProcessing(true);
    const fileReaders = files.map(file => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        compressImageBase64(reader.result).then(resolve);
      };
      reader.readAsDataURL(file);
    }));

    Promise.all(fileReaders).then(results => {
      setEditProduct(prev => ({
        ...prev,
        images: replaceEditImages ? results : [...prev.images, ...results]
      }));
    }).finally(() => setIsImageProcessing(false));
  };

  const handleAddUrlToEditProduct = () => {
    const url = editProductImageUrl.trim();
    if (!url) return;
    if (editProduct.images.length >= 10 && !replaceEditImages) {
      alert('Maximum 10 images allowed per product.');
      return;
    }
    setEditProduct(prev => ({
      ...prev,
      images: replaceEditImages ? [url] : [...prev.images, url]
    }));
    setEditProductImageUrl('');
  };

  const removeEditImage = (index) => {
    setEditProduct(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!editingProductId) {
      alert('No product selected for editing.');
      return;
    }
    if (!editProduct.name || !editProduct.price || !editProduct.category || !editProduct.description) {
      alert('Please fill in all required fields before saving.');
      return;
    }
    if (isImageProcessing) {
      alert('Please wait while the new images are being prepared.');
      return;
    }

    const payload = {
      ...editProduct,
      burnerSize: String(editProduct.burnerSize || '').trim(),
      stoveWeight: String(editProduct.stoveWeight || '').trim(),
      dimensions: String(editProduct.dimensions || '').trim(),
      material: String(editProduct.material || '').trim(),
      usage: String(editProduct.usage || '').trim(),
      fuelType: String(editProduct.fuelType || '').trim(),
      cookingSurface: String(editProduct.cookingSurface || '').trim(),
      cookingCapacity: String(editProduct.cookingCapacity || '').trim(),
      originalPrice: Number(editProduct.originalPrice || editProduct.mrp || 0),
      mrp: Number(editProduct.originalPrice || editProduct.mrp || 0),
      discountPercent: Number(editProduct.discountPercent || 0),
      video: String(editProduct.video || '').trim(),
      images: (Array.isArray(editProduct.images) ? editProduct.images : []).map((img) => {
        if (typeof img !== 'string' || !img) return img;
        if (img.startsWith('data:')) return img;
        const separator = img.includes('?') ? '&' : '?';
        return `${img}${separator}t=${Date.now()}`;
      })
    };

    try {
      const success = await onUpdateProduct(editingProductId, payload);
      if (success) {
        cancelEditProduct();
      } else {
        alert('Failed to save changes. Please try again.');
      }
    } catch (err) {
      console.error('Error saving product changes:', err);
      alert('Failed to save changes. Please try again.');
    }
  };

  const handleDelete = (productId) => {
    onDeleteProduct(productId);
  };

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
  };

  const handleInventoryStockSave = async (productId, rawValue) => {
    const nextStock = Number(rawValue);
    if (!productId || !Number.isFinite(nextStock) || nextStock < 0) {
      return;
    }

    try {
      await onUpdateProduct(productId, { stock: nextStock });
    } catch (err) {
      console.error('Error updating inventory stock:', err);
    }
  };

  const menuItems = [
    { name: 'Overview', icon: 'fa-chart-line' },
    { name: 'Offers', icon: 'fa-bullhorn' },
    { name: 'All Products', icon: 'fa-boxes-stacked' },
    { name: 'Categories', icon: 'fa-list-ul' },
    { name: 'Inventory', icon: 'fa-warehouse' },
    { name: 'Customers', icon: 'fa-users' },
    { name: 'Orders', icon: 'fa-cart-shopping' },
    { name: 'Stove Enquiries', icon: 'fa-fire-burner' },
    { name: 'Coupons', icon: 'fa-ticket' },
    { name: 'Support', icon: 'fa-headset' },
    { name: 'Activity Logs', icon: 'fa-file-lines' },
  ];

  const getCustomerActivityFeed = () => {
    const feed = [];

    users.forEach((user) => {
      if (!user) return;
      const createdAt = user.createdAt || user.created_at;
      if (createdAt) {
        feed.push({
          id: `user-${user._id || user.id}`,
          type: 'Registration',
          title: 'Customer registered',
          description: `${user.name || user.email || 'A customer'} joined the store.`,
          timestamp: createdAt,
          customerName: user.name || user.email || 'Customer',
          customerEmail: user.email || '—',
          status: user.status || 'active'
        });
      }
    });

    orders.forEach((order) => {
      if (!order) return;
      const timestamp = order.createdAt || order.placedAt || order.updatedAt;
      feed.push({
        id: `order-${order._id || order.id}`,
        type: 'Order',
        title: `Order ${order.orderId || order.invoiceNumber || 'updated'}`,
        description: `${order.customerName || order.customerEmail || 'Customer'} has an order with status ${order.status || 'Pending'}.`,
        timestamp,
        customerName: order.customerName || order.customerEmail || 'Customer',
        customerEmail: order.customerEmail || '—',
        status: order.status || 'Pending'
      });
    });

    supportQueries.forEach((query) => {
      if (!query) return;
      feed.push({
        id: `support-${query._id || query.id}`,
        type: 'Support',
        title: `Support ${query.status || 'Open'}`,
        description: `${query.subject || 'Support request'} raised by ${query.customerName || query.email || 'a customer'}.`,
        timestamp: query.createdAt || query.updatedAt,
        customerName: query.customerName || query.email || 'Customer',
        customerEmail: query.email || '—',
        status: query.status || 'Open'
      });
    });

    returnRequests.forEach((request) => {
      if (!request) return;
      feed.push({
        id: `return-${request._id || request.id}`,
        type: 'Return',
        title: `Return ${request.status || 'Requested'}`,
        description: `${request.customerName || request.customerEmail || 'Customer'} requested a return for order ${request.orderId || request.orderNumber || '—'}.`,
        timestamp: request.createdAt || request.updatedAt,
        customerName: request.customerName || request.customerEmail || 'Customer',
        customerEmail: request.customerEmail || '—',
        status: request.status || 'Requested'
      });
    });

    refundRequests.forEach((request) => {
      if (!request) return;
      feed.push({
        id: `refund-${request._id || request.id}`,
        type: 'Refund',
        title: `Refund ${request.status || 'Pending'}`,
        description: `${request.customerName || request.customerEmail || 'Customer'} requested a refund for order ${request.orderId || request.orderNumber || '—'}.`,
        timestamp: request.createdAt || request.updatedAt,
        customerName: request.customerName || request.customerEmail || 'Customer',
        customerEmail: request.customerEmail || '—',
        status: request.status || 'Pending'
      });
    });

    return feed.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0)).slice(0, 120);
  };

  const customerActivityFeed = getCustomerActivityFeed();

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price || !newProduct.category || !newProduct.description) {
      alert('Please fill in all required fields before saving.');
      return;
    }
    if (isImageProcessing) {
      alert('Please wait while the new images are being prepared.');
      return;
    }

    const payload = {
      ...newProduct,
      name: String(newProduct.name || '').trim(),
      price: String(newProduct.price || '').trim(),
      originalPrice: Number(newProduct.originalPrice || newProduct.mrp || 0),
      mrp: Number(newProduct.originalPrice || newProduct.mrp || 0),
      category: String(newProduct.category || '').trim(),
      description: String(newProduct.description || '').trim(),
      specifications: String(newProduct.specifications || '').trim(),
      howToUse: String(newProduct.howToUse || '').trim(),
      burnerSize: String(newProduct.burnerSize || '').trim(),
      stoveWeight: String(newProduct.stoveWeight || '').trim(),
      dimensions: String(newProduct.dimensions || '').trim(),
      material: String(newProduct.material || '').trim(),
      usage: String(newProduct.usage || '').trim(),
      fuelType: String(newProduct.fuelType || '').trim(),
      cookingSurface: String(newProduct.cookingSurface || '').trim(),
      cookingCapacity: String(newProduct.cookingCapacity || '').trim(),
      stock: Number(newProduct.stock || 0),
      shippingCharge: Number(newProduct.shippingCharge || 0),
      gstPercent: Number(newProduct.gstPercent || 0),
      discountPercent: Number(newProduct.discountPercent || 0),
      icon: String(newProduct.icon || 'fa-box').trim(),
      isNewArrival: Boolean(newProduct.isNewArrival),
      video: String(newProduct.video || '').trim(),
      images: (Array.isArray(newProduct.images) ? newProduct.images : []).map((img) => {
        if (typeof img !== 'string' || !img) return img;
        if (img.startsWith('data:')) return img;
        const separator = img.includes('?') ? '&' : '?';
        return `${img}${separator}t=${Date.now()}`;
      })
    };

    try {
      const savedProduct = await onAddProduct(payload);
      if (savedProduct) {
        alert('Product added successfully!');
        setNewProduct({
          name: '', price: '', originalPrice: '', mrp: '', description: '', specifications: '', howToUse: '',
          burnerSize: '', stoveWeight: '', dimensions: '', material: '',
          usage: '', fuelType: '', cookingSurface: '', cookingCapacity: '',
          stock: 0, shippingCharge: 0, gstPercent: 0, discountPercent: 0,
          category: categories[0]?.slug || categories[0]?.name || 'stoves', icon: 'fa-box', isNewArrival: false, images: [], video: ''
        });

      } else {
        alert('Failed to add product. Please try again.');
      }
    } catch (err) {
      console.error('Error adding product:', err);
      alert('Failed to add product. Please try again.');
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    if (files.length + newProduct.images.length > 10) {
      alert('Maximum 10 images allowed per product.');
      return;
    }

    setIsImageProcessing(true);
    const fileReaders = files.map(file => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        compressImageBase64(reader.result).then(resolve);
      };
      reader.readAsDataURL(file);
    }));

    Promise.all(fileReaders).then(results => {
      setNewProduct(prev => ({
        ...prev,
        images: [...prev.images, ...results]
      }));
    }).finally(() => setIsImageProcessing(false));
  };

  const handleAddUrlToNewProduct = () => {
    const url = newProductImageUrl.trim();
    if (!url) return;
    if (newProduct.images.length >= 10) {
      alert('Maximum 10 images allowed per product.');
      return;
    }
    setNewProduct(prev => ({
      ...prev,
      images: [...prev.images, url]
    }));
    setNewProductImageUrl('');
  };

  const removeImage = (index) => {
    const updatedImages = newProduct.images.filter((_, i) => i !== index);
    setNewProduct({ ...newProduct, images: updatedImages });
  };

  const handleUpdateOffer = (e) => {
    e.preventDefault();
    const normalizedOffer = {
      ...offerForm,
      _id: offerForm._id || undefined,
      poster: offerForm.poster || (offerForm.images || [])[0] || '',
      images: (offerForm.images || []).filter(Boolean),
      originalPrice: Number(offerForm.originalPrice) || 0,
      offerPrice: Number(offerForm.offerPrice) || 0,
      mrpIllusion: Number(offerForm.mrpIllusion) || 0,
      discountPercent: Number(offerForm.discountPercent) || 0,
      discountValue: Number(offerForm.discountValue) || 0,
      stockUnits: Number(offerForm.stockUnits) || 0,
      rating: Number(offerForm.rating) || 0,
      priority: Number(offerForm.priority) || 0,
      isActive: Boolean(offerForm.isActive),
      isPublished: Boolean(offerForm.isPublished),
      category: offerForm.type === 'category' ? offerForm.targetValue : offerForm.category,
      productName: offerForm.type === 'product' ? offerForm.targetValue : offerForm.productName
    };
    onUpdateOffer(normalizedOffer);
    setEditingOfferId(null);
    setOfferForm(buildOfferFormState());
    alert('Offer saved successfully!');
  };

  const startOfferEdit = (offer) => {
    setEditingOfferId(offer._id || offer.id);
    setOfferForm(buildOfferFormState(offer));
  };

  const applyOfferToTarget = (type, targetValue) => {
    // find existing offer for this target
    const existing = (offers || []).find(o => {
      if (!o) return false;
      if ((o.type || 'product') !== type) return false;
      const tv = (o.targetValue || o.productName || o.category || '').toString();
      if (!tv) return false;
      return tv === String(targetValue) || tv === (targetValue._id || targetValue.id) || tv.toLowerCase() === String(targetValue).toLowerCase();
    });
    if (existing) {
      startOfferEdit(existing);
      window.scrollTo({ top: 200, behavior: 'smooth' });
      return;
    }
    // no existing offer: prefill form for new offer
    setEditingOfferId(null);
    const pre = buildOfferFormState({ type, targetValue: typeof targetValue === 'string' ? targetValue : (targetValue._id || targetValue.id || targetValue.name || '') });
    setOfferForm(pre);
    window.scrollTo({ top: 200, behavior: 'smooth' });
  };

  const resetOfferForm = () => {
    setEditingOfferId(null);
    setOfferForm(buildOfferFormState());
  };

  const filteredOffers = Array.isArray(offers)
    ? offers.filter(offer => {
        const haystack = `${offer.title || ''} ${offer.description || ''} ${offer.code || ''} ${offer.type || ''}`.toLowerCase();
        const matchesSearch = haystack.includes(offerSearch.toLowerCase());
        const status = offer.isPublished ? 'published' : 'draft';
        const matchesStatus = offerStatusFilter === 'all' || status === offerStatusFilter || (offerStatusFilter === 'active' && offer.isActive !== false);
        return matchesSearch && matchesStatus;
      }).sort((a, b) => {
        if (offerSort === 'title') return (a.title || '').localeCompare(b.title || '');
        if (offerSort === 'created') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        return (Number(b.priority) || 0) - (Number(a.priority) || 0);
      })
    : [];

  const addOfferImage = (e) => {
    if (e) e.preventDefault();
    const url = offerImageUrl.trim();
    if (!url) return;
    if ((offerForm.images || []).length >= 5) {
      alert('Maximum 5 images allowed for an offer.');
      return;
    }
    setOfferForm(prev => ({
      ...prev,
      images: [...(prev.images || []), url],
      poster: prev.poster || url
    }));
    setOfferImageUrl('');
  };

  const removeOfferImage = (index) => {
    setOfferForm(prev => {
      const nextImages = (prev.images || []).filter((_, i) => i !== index);
      return {
        ...prev,
        images: nextImages,
        poster: nextImages[0] || ''
      };
    });
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    if (editingCategoryId) {
      const categoryName = newCategory.trim();
      if (categories.some(cat => (cat._id || cat.id) !== editingCategoryId && (cat.name || '').toLowerCase() === categoryName.toLowerCase())) {
        alert('Category already exists!');
        return;
      }
      const success = await onUpdateCategory(editingCategoryId, categoryName);
      if (!success) {
        alert('Failed to update category. Please try again.');
        return;
      }
      setEditingCategoryId(null);
      setNewCategory('');
      alert('Category updated successfully!');
      return;
    }

    const slug = newCategory.toLowerCase().trim().replace(/\s+/g, '-');
    if (categories.some(cat => (cat.slug || cat.name || '').toLowerCase() === slug.toLowerCase())) {
      alert('Category already exists!');
      return;
    }
    const success = await onAddCategory(slug);
    if (!success) {
      alert('Failed to add category. Please try again.');
      return;
    }
    setNewCategory('');
    alert('Category added successfully!');
  };

  const startCategoryEdit = (cat) => {
    const categoryId = cat._id || cat.id;
    const categoryName = cat.name || '';
    setEditingCategoryId(categoryId);
    setNewCategory(categoryName);
    setTimeout(() => document.getElementById('category-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const cancelCategoryEdit = () => {
    setEditingCategoryId(null);
    setNewCategory('');
  };

  const handleCreateCoupon = (e) => {
    e.preventDefault();
    if (!newCoupon.code || !newCoupon.discountValue || !newCoupon.expiryDate) {
      alert('Please fill out all required coupon fields.');
      return;
    }
    
    const couponData = {
      code: newCoupon.code,
      discountType: newCoupon.discountType,
      discountValue: Number(newCoupon.discountValue),
      linkedProduct: newCoupon.linkedProduct || null,
      expiryDate: newCoupon.expiryDate
    };

    if (editingCouponId) {
      onUpdateCoupon(editingCouponId, couponData);
      setEditingCouponId(null);
    } else {
      onAddCoupon(couponData);
    }

    setNewCoupon({
      code: '',
      discountType: 'Percentage',
      discountValue: '',
      linkedProduct: '',
      expiryDate: ''
    });
  };

  const parsePrice = (priceStr) => {
    if (!priceStr) return 0;
    if (typeof priceStr === 'number') return priceStr;
    const cleaned = priceStr.toString().replace(/[₹$,\s]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  const inventoryStats = (() => {
    const safeProducts = Array.isArray(products) ? products : [];
    const totalProducts = safeProducts.length;
    const totalStockUnits = safeProducts.reduce((sum, product) => sum + (Number(product.stock) || 0), 0);
    const outOfStock = safeProducts.filter((product) => Number(product.stock) <= 0).length;
    const lowStock = safeProducts.filter((product) => Number(product.stock) > 0 && Number(product.stock) < 10).length;
    return { totalProducts, totalStockUnits, outOfStock, lowStock };
  })();

  const inventoryItems = (Array.isArray(products) ? products : [])
    .map((product) => ({
      ...product,
      stockValue: Number(product.stock) || 0
    }))
    .sort((a, b) => a.stockValue - b.stockValue);

  const getCustomerContact = (user) => {
    const phone = user?.phone || '';
    const email = user?.email || '';
    const parts = [phone, email].filter(Boolean);
    return parts.length > 0 ? parts.join(' / ') : '—';
  };

  const getCustomerAddress = (user) => {
    if (!user) return '—';

    const defaultAddress = Array.isArray(user.addresses)
      ? user.addresses.find((address) => address?.isDefault) || user.addresses[0]
      : null;

    const addressParts = [
      defaultAddress?.addressLine1,
      defaultAddress?.addressLine2,
      defaultAddress?.city,
      defaultAddress?.state,
      defaultAddress?.zipCode,
      defaultAddress?.country,
    ].filter(Boolean);

    if (addressParts.length > 0) {
      return addressParts.join(', ');
    }

    return user.address || '—';
  };

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <i className="fa-solid fa-gauge-high"></i>
          SRITECH <span>ADMIN</span>
        </div>
        <nav className="admin-nav-menu">
          {menuItems.map((item) => (
            <button
              key={item.name}
              type="button"
              className={`admin-nav-item ${activeTab === item.name ? 'active' : ''}`}
              onClick={() => {
                if (item.name === 'View Product') {
                  onViewPublicProducts?.();
                } else {
                  handleTabChange(item.name);
                }
              }}
            >
              <i className={`fa-solid ${item.icon}`}></i>
              <span>{item.name}</span>
              {item.name === 'Stove Enquiries' && (leads || []).filter(l => (l.status || 'New') === 'New').length > 0 && (
                <span style={{
                  marginLeft: 'auto',
                  background: '#EF4444',
                  color: '#fff',
                  borderRadius: '12px',
                  padding: '2px 8px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)'
                }}>
                  {(leads || []).filter(l => (l.status || 'New') === 'New').length}
                </span>
              )}
            </button>
          ))}
        </nav>
        <button 
          type="button"
          className="admin-visit-website-btn" 
          onClick={() => window.open('/', '_blank')}
          title="Open customer live website in a new tab without logging out"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: 'calc(100% - 2rem)',
            margin: '0 1rem 0.5rem 1rem',
            padding: '0.7rem 1rem',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
            transition: 'all 0.2s ease'
          }}
        >
          <i className="fa-solid fa-arrow-up-right-from-square"></i>
          <span>Visit Website</span>
        </button>
        <button className="admin-logout-btn" onClick={onLogout}>
          <i className="fa-solid fa-right-from-bracket"></i>
          <span>Logout</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        {/* Header */}
        <header className="admin-header">
          <h1>
            {activeTab} 
            <span style={{ marginLeft: '1rem', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>
              <span className="status-pulse-dot"></span> System Live
            </span>
          </h1>
          <div className="admin-profile">
            <button 
              type="button"
              className="admin-header-visit-btn" 
              onClick={() => window.open('/', '_blank')}
              title="Open customer website in a new tab (session preserved)"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0.45rem 0.9rem',
                background: '#f0fdf4',
                color: '#15803d',
                border: '1.5px solid #86efac',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <i className="fa-solid fa-store"></i> Visit Website
            </button>

            <button 
              className={`refresh-btn ${isRefreshing ? 'spinning' : ''}`} 
              onClick={onRefresh}
              title="Refresh Data"
            >
              <i className="fa-solid fa-arrows-rotate"></i> Refresh
            </button>
            
            <div style={{ width: '1.5px', height: '24px', background: 'rgba(0,0,0,0.08)', margin: '0 0.5rem' }}></div>
            <div className="admin-info">
              <span className="admin-name">Sankarganesh R</span>
              <span className="admin-role">CEO & Super Admin</span>
            </div>
            <div className="admin-avatar">
              <img
                src="/sri-tech-logo-final.png"
                alt="SriTech Logo"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  background: 'transparent',
                  filter: 'hue-rotate(12deg) saturate(1.08) drop-shadow(0 1px 2px rgba(0,0,0,0.08))'
                }}
              />
            </div>
          </div>
        </header>

        {/* Content Section */}
        <section className="admin-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Stats for Overview at the Top */}
          {activeTab === 'Overview' && (
            <div className="admin-stats-grid">
              <div className="stat-card" onClick={() => handleTabChange('Stove Enquiries')} style={{ cursor: 'pointer', borderLeft: '3px solid #ff7a00' }}>
                <span className="stat-label">Stove Inquiries <i className="fa-solid fa-fire-burner" style={{ color: '#ff7a00' }}></i></span>
                <span className="stat-value">{leads.length}</span>
                <div style={{ width: '100%', height: '4px', background: 'rgba(0,0,0,0.06)', borderRadius: '2px', overflow: 'hidden', margin: '4px 0' }}>
                  <div style={{ width: leads.length > 0 ? '75%' : '0%', height: '100%', background: 'linear-gradient(90deg, #ff7a00, #ff5500)', borderRadius: '2px' }}></div>
                </div>
                <span className="stat-change" style={{ color: '#ea580c', fontWeight: 600 }}>
                  {leads.filter(l => (l.status || 'New') === 'New').length} new customer leads
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Orders <i className="fa-solid fa-cart-shopping"></i></span>
                <span className="stat-value">{orders.length}</span>
                <div style={{ width: '100%', height: '4px', background: 'rgba(0,0,0,0.06)', borderRadius: '2px', overflow: 'hidden', margin: '4px 0' }}>
                  <div style={{ width: orders.length > 0 ? '65%' : '0%', height: '100%', background: 'linear-gradient(90deg, #4f46e5, #06b6d4)', borderRadius: '2px' }}></div>
                </div>
                <span className="stat-change">{orders.length > 0 ? 'Active store orders' : 'No orders yet'}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Products <i className="fa-solid fa-boxes-stacked"></i></span>
                <span className="stat-value">{products.length}</span>
                <div style={{ width: '100%', height: '4px', background: 'rgba(0,0,0,0.06)', borderRadius: '2px', overflow: 'hidden', margin: '4px 0' }}>
                  <div style={{ width: products.length > 0 ? '80%' : '0%', height: '100%', background: 'linear-gradient(90deg, #10b981, #34d399)', borderRadius: '2px' }}></div>
                </div>
                <span className="stat-change">Active item listings</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Queries <i className="fa-solid fa-headset"></i></span>
                <span className="stat-value">{supportQueries.length}</span>
                <div style={{ width: '100%', height: '4px', background: 'rgba(0,0,0,0.06)', borderRadius: '2px', overflow: 'hidden', margin: '4px 0' }}>
                  <div style={{ width: supportQueries.length > 0 ? '40%' : '0%', height: '100%', background: 'linear-gradient(90deg, #f59e0b, #fbbf24)', borderRadius: '2px' }}></div>
                </div>
                <span className="stat-change">{supportQueries.filter(q => q.status === 'Open').length} pending queries</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Coupons <i className="fa-solid fa-ticket"></i></span>
                <span className="stat-value">{coupons.length}</span>
                <div style={{ width: '100%', height: '4px', background: 'rgba(0,0,0,0.06)', borderRadius: '2px', overflow: 'hidden', margin: '4px 0' }}>
                  <div style={{ width: coupons.length > 0 ? '50%' : '0%', height: '100%', background: 'linear-gradient(90deg, #ec4899, #f43f5e)', borderRadius: '2px' }}></div>
                </div>
                <span className="stat-change">Active discount codes</span>
              </div>
            </div>
          )}

          {activeTab === 'Overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
              {/* Sales Summary visual block */}
              <div className="admin-card-glass">
                <h3>Store Performance Overview</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                      <span>Product Sales Target Completion</span>
                      <span style={{ fontWeight: 'bold', color: '#4f46e5' }}>78% Completed</span>
                    </div>
                    <div style={{ width: '100%', height: '10px', background: 'rgba(0,0,0,0.06)', borderRadius: '6px', overflow: 'hidden' }}>
                      <div style={{ width: '78%', height: '100%', background: 'linear-gradient(90deg, #4f46e5, #818cf8)', borderRadius: '6px' }}></div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                      <span>Order Fulfillment Rate</span>
                      <span style={{ fontWeight: 'bold', color: '#10b981' }}>92% Dispatched</span>
                    </div>
                    <div style={{ width: '100%', height: '10px', background: 'rgba(0,0,0,0.06)', borderRadius: '6px', overflow: 'hidden' }}>
                      <div style={{ width: '92%', height: '100%', background: 'linear-gradient(90deg, #10b981, #34d399)', borderRadius: '6px' }}></div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                      <span>System Resource Health</span>
                      <span style={{ fontWeight: 'bold', color: '#0284c7' }}>Optimal (99.8% Uptime)</span>
                    </div>
                    <div style={{ width: '100%', height: '10px', background: 'rgba(0,0,0,0.06)', borderRadius: '6px', overflow: 'hidden' }}>
                      <div style={{ width: '99%', height: '100%', background: 'linear-gradient(90deg, #0284c7, #38bdf8)', borderRadius: '6px' }}></div>
                    </div>
                  </div>
                </div>
                
              </div>

              {/* Quick Actions Panel */}
              <div className="admin-card-glass" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h3>Quick Management</h3>
                <button className="admin-btn admin-btn-primary" onClick={() => setActiveTab('All Products')} style={{ justifyContent: 'center' }}>
                  <i className="fa-solid fa-plus"></i> Add New Product
                </button>
                <button className="admin-btn admin-btn-primary" onClick={() => setActiveTab('Offers')} style={{ justifyContent: 'center', background: 'linear-gradient(135deg, #7c3aed, #9333ea)' }}>
                  <i className="fa-solid fa-bullhorn"></i> Update Banners
                </button>
                <button className="admin-btn admin-btn-primary" onClick={() => setActiveTab('Categories')} style={{ justifyContent: 'center', background: 'linear-gradient(135deg, #0d9488, #0f766e)' }}>
                  <i className="fa-solid fa-list-ul"></i> Edit Categories
                </button>
              </div>
            </div>
          )}

          {activeTab === 'All Products' && (
            <div className="admin-products-management">
              {/* Edit Product Panel */}
              {editingProductId && (
                <div id="edit-product-panel" className="admin-card-glass" style={{ border: '2px solid var(--primary-color)', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h3 style={{ color: 'var(--primary-dark)', margin: 0 }}>
                      <i className="fa-solid fa-pen-to-square" style={{ marginRight: '8px' }}></i>
                      Edit Product
                    </h3>
                    <button
                      type="button"
                      onClick={cancelEditProduct}
                      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626', borderRadius: '8px', padding: '0.4rem 1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                    >
                      <i className="fa-solid fa-xmark" style={{ marginRight: '5px' }}></i>Cancel
                    </button>
                  </div>
                  <form onSubmit={handleUpdateProduct}>
                    <div className="admin-form-grid" style={{ marginBottom: '1.25rem' }}>
                      <div className="admin-form-group">
                        <label htmlFor="editProductName">Product Name</label>
                        <input
                          id="editProductName"
                          type="text"
                          placeholder="Product name"
                          required
                          value={editProduct.name}
                          onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
                        />
                      </div>
                      {/* Product Pricing & Auto-Discount Calculator */}
                      <div style={{
                        gridColumn: '1 / -1',
                        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '14px',
                        padding: '1.25rem',
                        marginBottom: '0.5rem',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <label style={{ fontWeight: '700', fontSize: '1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                            <i className="fa-solid fa-calculator" style={{ color: 'var(--primary-color)' }}></i>
                            Product Pricing & Auto-Discount Calculator
                          </label>
                          <span style={{ fontSize: '0.8rem', background: '#dbeafe', color: '#1e40af', padding: '3px 10px', borderRadius: '12px', fontWeight: 600 }}>
                            E-Commerce Standard (MRP & Selling Price)
                          </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                          {/* Product Price / MRP */}
                          <div className="admin-form-group" style={{ margin: 0 }}>
                            <label htmlFor="editProductOriginalPrice" style={{ fontWeight: 600, fontSize: '0.85rem', color: '#334155' }}>
                              Product Price / MRP (₹) <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                              <span style={{ position: 'absolute', left: '0.9rem', color: '#64748b', fontWeight: 'bold' }}>₹</span>
                              <input
                                id="editProductOriginalPrice"
                                type="text"
                                placeholder="e.g. 5000"
                                value={editProduct.originalPrice || editProduct.mrp || ''}
                                onChange={(e) => handleEditProductPricingChange('originalPrice', e.target.value)}
                                style={{ paddingLeft: '2rem', width: '100%', borderColor: '#94a3b8' }}
                              />
                            </div>
                            <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px' }}>Original MRP (struck-through on store)</span>
                          </div>

                          {/* Selling Price */}
                          <div className="admin-form-group" style={{ margin: 0 }}>
                            <label htmlFor="editProductPrice" style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0f172a' }}>
                              Selling Price / Deal Price (₹) <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                              <span style={{ position: 'absolute', left: '0.9rem', color: '#16a34a', fontWeight: 'bold' }}>₹</span>
                              <input
                                id="editProductPrice"
                                type="text"
                                placeholder="e.g. 4500"
                                required
                                value={editProduct.price || ''}
                                onChange={(e) => handleEditProductPricingChange('price', e.target.value)}
                                style={{ paddingLeft: '2rem', width: '100%', borderColor: '#16a34a', fontWeight: 600 }}
                              />
                            </div>
                            <span style={{ fontSize: '0.72rem', color: '#16a34a', marginTop: '3px', fontWeight: 500 }}>Actual price paid by customer</span>
                          </div>

                          {/* Discount Rate (%) */}
                          <div className="admin-form-group" style={{ margin: 0 }}>
                            <label htmlFor="editProductDiscountPercent" style={{ fontWeight: 600, fontSize: '0.85rem', color: '#334155' }}>
                              Discount Rate (%) <span style={{ color: '#64748b', fontWeight: 400 }}>(Auto-calculated)</span>
                            </label>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                              <input
                                id="editProductDiscountPercent"
                                type="number"
                                min="0"
                                max="100"
                                placeholder="e.g. 10"
                                value={editProduct.discountPercent ?? ''}
                                onChange={(e) => handleEditProductPricingChange('discountPercent', e.target.value)}
                                style={{ paddingRight: '2rem', width: '100%' }}
                              />
                              <span style={{ position: 'absolute', right: '0.9rem', color: '#64748b', fontWeight: 'bold' }}>%</span>
                            </div>
                            <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px' }}>Auto-calculates from MRP & Selling Price</span>
                          </div>

                          {/* Customer Saves (₹) */}
                          <div className="admin-form-group" style={{ margin: 0 }}>
                            <label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#334155' }}>
                              Customer Savings (₹)
                            </label>
                            {(() => {
                              const mrpNum = parseFloat(editProduct.originalPrice || editProduct.mrp) || 0;
                              const sellingNum = parseFloat(editProduct.price) || 0;
                              const saveAmt = (mrpNum > sellingNum && sellingNum > 0) ? (mrpNum - sellingNum) : 0;
                              return (
                                <div style={{
                                  padding: '0.65rem 1rem',
                                  borderRadius: '8px',
                                  background: saveAmt > 0 ? '#ecfdf5' : '#f1f5f9',
                                  border: `1.5px solid ${saveAmt > 0 ? '#a7f3d0' : '#e2e8f0'}`,
                                  color: saveAmt > 0 ? '#047857' : '#64748b',
                                  fontWeight: 700,
                                  fontSize: '0.95rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}>
                                  <i className={saveAmt > 0 ? 'fa-solid fa-badge-percent' : 'fa-regular fa-circle-question'}></i>
                                  <span>{saveAmt > 0 ? `₹${saveAmt.toLocaleString('en-IN')} Saved` : 'No Savings (0%)'}</span>
                                </div>
                              );
                            })()}
                            <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px' }}>Difference between MRP and Selling Price</span>
                          </div>
                        </div>

                        {/* Live E-Commerce Store Preview Banner */}
                        {(() => {
                          const mrpNum = parseFloat(editProduct.originalPrice || editProduct.mrp) || 0;
                          const sellingNum = parseFloat(editProduct.price) || 0;
                          const saveAmt = (mrpNum > sellingNum && sellingNum > 0) ? (mrpNum - sellingNum) : 0;
                          const discNum = (mrpNum > sellingNum && sellingNum > 0) ? Math.round(((mrpNum - sellingNum) / mrpNum) * 100) : (Number(editProduct.discountPercent) || 0);
                          return (
                            <div style={{
                              background: '#ffffff',
                              border: '1px dashed #94a3b8',
                              borderRadius: '10px',
                              padding: '0.75rem 1rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: '0.75rem'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', fontWeight: 700 }}>
                                  Website Live Preview:
                                </span>
                                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                                  ₹{sellingNum.toLocaleString('en-IN')}
                                </span>
                                {saveAmt > 0 && (
                                  <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '0.95rem', fontWeight: 500 }}>
                                    ₹{mrpNum.toLocaleString('en-IN')}
                                  </span>
                                )}
                                {discNum > 0 && (
                                  <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700 }}>
                                    {discNum}% OFF
                                  </span>
                                )}
                              </div>
                              {saveAmt > 0 && (
                                <div style={{ background: '#fef3c7', color: '#b45309', padding: '3px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                                  <i className="fa-solid fa-circle-check"></i> Customer Saves ₹{saveAmt.toLocaleString('en-IN')}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                      <div className="admin-form-group">
                        <label htmlFor="editProductDescription">Description</label>
                        <textarea
                          id="editProductDescription"
                          placeholder="Short product description"
                          value={editProduct.description}
                          onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })}
                          style={{ minHeight: '100px' }}
                        />
                      </div>
                      <div className="admin-form-group">
                        <label htmlFor="editProductSpecifications">Specifications</label>
                        <textarea
                          id="editProductSpecifications"
                          placeholder="Product specifications"
                          value={editProduct.specifications}
                          onChange={(e) => setEditProduct({ ...editProduct, specifications: e.target.value })}
                          style={{ minHeight: '100px' }}
                        />
                      </div>
                      <div className="admin-form-group">
                        <label htmlFor="editProductHowToUse">How to Use</label>
                        <textarea
                          id="editProductHowToUse"
                          placeholder="Instructions on how to use the product"
                          value={editProduct.howToUse}
                          onChange={(e) => setEditProduct({ ...editProduct, howToUse: e.target.value })}
                        ></textarea>
                      </div>
                      <div className="admin-form-group">
                        <label htmlFor="editProductBurnerSize">Burner Size</label>
                        <input id="editProductBurnerSize" type="text" placeholder="e.g. 12 Inches" value={editProduct.burnerSize} onChange={(e) => setEditProduct({ ...editProduct, burnerSize: e.target.value })} />
                      </div>
                      <div className="admin-form-group">
                        <label htmlFor="editProductStoveWeight">Stove Weight</label>
                        <input id="editProductStoveWeight" type="text" placeholder="e.g. 35 to 38 kg" value={editProduct.stoveWeight} onChange={(e) => setEditProduct({ ...editProduct, stoveWeight: e.target.value })} />
                      </div>
                      <div className="admin-form-group">
                        <label htmlFor="editProductDimensions">Dimensions</label>
                        <input id="editProductDimensions" type="text" placeholder="e.g. 18 × 18 × 19 Inches" value={editProduct.dimensions} onChange={(e) => setEditProduct({ ...editProduct, dimensions: e.target.value })} />
                      </div>
                      <div className="admin-form-group">
                        <label htmlFor="editProductMaterial">Material</label>
                        <input id="editProductMaterial" type="text" placeholder="e.g. Mild Steel (MS)" value={editProduct.material} onChange={(e) => setEditProduct({ ...editProduct, material: e.target.value })} />
                      </div>
                      <div className="admin-form-group" style={{ gridColumn: '1 / -1' }}>
                        <label htmlFor="editProductUsage">Usage (Crafted for / Suitable for)</label>
                        <textarea
                          id="editProductUsage"
                          placeholder="e.g. Crafted for Temples, Hotels, Restaurants, Bakeries, Cafes, Tea Shops, Catering Services, Cloud Kitchens, Street Food Businesses, and Every Professional Kitchen."
                          value={editProduct.usage}
                          onChange={(e) => setEditProduct({ ...editProduct, usage: e.target.value })}
                          style={{ minHeight: '75px' }}
                        />
                      </div>
                      <div className="admin-form-group">
                        <label htmlFor="editProductFuelType">Fuel Type</label>
                        <input id="editProductFuelType" type="text" placeholder="e.g. Wood, Coconut shell & husk, Charcoal & Biomass" value={editProduct.fuelType} onChange={(e) => setEditProduct({ ...editProduct, fuelType: e.target.value })} />
                      </div>
                      <div className="admin-form-group">
                        <label htmlFor="editProductCookingSurface">Cooking Surface</label>
                        <input id="editProductCookingSurface" type="text" placeholder="e.g. Flat / Heavy-Duty Top" value={editProduct.cookingSurface} onChange={(e) => setEditProduct({ ...editProduct, cookingSurface: e.target.value })} />
                      </div>
                      <div className="admin-form-group">
                        <label htmlFor="editProductCookingCapacity">Cooking Capacity</label>
                        <input id="editProductCookingCapacity" type="text" placeholder="e.g. Up to 40 kg (40 - 75 Persons / Commercial & Hotels)" value={editProduct.cookingCapacity} onChange={(e) => setEditProduct({ ...editProduct, cookingCapacity: e.target.value })} />
                      </div>
                      <div className="admin-form-group">
                        <label htmlFor="editProductStock">Stock</label>
                        <input
                          id="editProductStock"
                          type="number"
                          min="0"
                          placeholder="Stock quantity"
                          value={editProduct.stock}
                          onChange={(e) => setEditProduct({ ...editProduct, stock: Number(e.target.value) })}
                        />
                      </div>
                      <div className="admin-form-group">
                        <label htmlFor="editProductShippingCharge">Shipping Charge (₹)</label>
                        <input
                          id="editProductShippingCharge"
                          type="number"
                          min="0"
                          placeholder="Shipping charge in ₹"
                          value={editProduct.shippingCharge}
                          onChange={(e) => setEditProduct({ ...editProduct, shippingCharge: Number(e.target.value) })}
                        />
                      </div>
                      <div className="admin-form-group">
                        <label htmlFor="editProductGstPercent">GST Rate (% - Optional)</label>
                        <input
                          id="editProductGstPercent"
                          type="number"
                          min="0"
                          max="100"
                          placeholder="e.g. 0 or 18"
                          value={editProduct.gstPercent}
                          onChange={(e) => setEditProduct({ ...editProduct, gstPercent: Number(e.target.value) })}
                        />
                      </div>
                      <div className="admin-form-group">
                        <label htmlFor="editProductCategory">Category</label>
                        <select
                          id="editProductCategory"
                          value={editProduct.category}
                          onChange={(e) => setEditProduct({ ...editProduct, category: e.target.value })}
                        >
                          {categories.map(cat => {
                            const value = typeof cat === 'string' ? cat : (cat.slug || cat.name || '').toString();
                            const label = typeof cat === 'string' ? cat : (cat.name || cat.slug || '').toString();
                            return (
                              <option key={value} value={value}>
                                {label.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      <div className="admin-form-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.5rem', marginTop: '1.8rem' }}>
                        <input
                          type="checkbox"
                          id="editNewArrival"
                          checked={editProduct.isNewArrival}
                          onChange={(e) => setEditProduct({ ...editProduct, isNewArrival: e.target.checked })}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <label htmlFor="editNewArrival" style={{ cursor: 'pointer' }}>Mark as New Arrival</label>
                      </div>
                    </div>

                    <div className="admin-form-group" style={{ marginBottom: '1.5rem' }}>
                      <div>Product Images (Max 10 - Upload Files or Paste URLs)</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input
                            type="url"
                            value={editProductImageUrl}
                            onChange={(e) => setEditProductImageUrl(e.target.value)}
                            placeholder="Paste direct image URL (https://...)"
                            className="admin-form-control"
                            style={{ flex: 1 }}
                          />
                          <button type="button" className="admin-btn admin-btn-small" onClick={handleAddUrlToEditProduct}>
                            Add URL
                          </button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <input
                            type="checkbox"
                            id="replaceEditImages"
                            checked={replaceEditImages}
                            onChange={(e) => setReplaceEditImages(e.target.checked)}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                          />
                          <label htmlFor="replaceEditImages" style={{ cursor: 'pointer', fontSize: '0.95rem' }}>
                            Replace existing images with uploaded files/URLs
                          </label>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                          {editProduct.images.map((src, index) => (
                            <div key={index} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '2px solid var(--primary-light)' }}>
                              <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <button
                                type="button"
                                onClick={() => removeEditImage(index)}
                                style={{ position: 'absolute', top: '2px', right: '2px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                &times;
                              </button>
                            </div>
                          ))}
                          {(replaceEditImages || editProduct.images.length < 10) && (
                            <label htmlFor="editProductImageUpload" style={{ width: '80px', height: '80px', borderRadius: '8px', border: '2px dashed var(--primary-light)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}>
                              <i className="fa-solid fa-plus" style={{ color: 'var(--primary-color)', fontSize: '1.2rem' }}></i>
                              <span style={{ fontSize: '0.65rem', color: 'var(--primary-color)', marginTop: '4px' }}>Upload Files</span>
                              <input id="editProductImageUpload" name="editProductImageUpload" type="file" accept="image/*" multiple onChange={handleEditFileChange} style={{ display: 'none' }} />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="admin-form-group" style={{ marginBottom: '1.5rem' }}>
                      <div>Product Video (Upload File or Enter URL)</div>
                      <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <input 
                          type="text" 
                          placeholder="Paste YouTube, Vimeo, or direct video URL here..." 
                          value={editProduct.video && !editProduct.video.startsWith('data:') ? editProduct.video : ''}
                          onChange={(e) => setEditProduct({...editProduct, video: e.target.value})}
                          style={{ width: '100%' }}
                        />
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <label htmlFor="editProductVideoUpload" className="admin-btn admin-btn-outline" style={{ cursor: 'pointer', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                            <i className="fa-solid fa-video" style={{ marginRight: '6px' }}></i>
                            Upload Video File
                            <input 
                              id="editProductVideoUpload" 
                              name="editProductVideoUpload" 
                              type="file" 
                              accept="video/*" 
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (!file) return;
                                if (file.size > 25 * 1024 * 1024) { // 25MB limit
                                  alert('Video file size exceeds 25MB limit.');
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setEditProduct({...editProduct, video: reader.result});
                                };
                                reader.readAsDataURL(file);
                              }} 
                              style={{ display: 'none' }} 
                            />
                          </label>
                          
                          {editProduct.video && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>
                                {editProduct.video.startsWith('data:') ? '✓ Video File Loaded' : '✓ Video Link Set'}
                              </span>
                              <button 
                                type="button" 
                                onClick={() => setEditProduct({...editProduct, video: ''})}
                                style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer', fontSize: '0.75rem' }}
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {editProduct.video && editProduct.video.startsWith('data:') && (
                          <div style={{ marginTop: '0.5rem', width: '100%', maxWidth: '280px' }}>
                            <video src={editProduct.video} controls style={{ width: '100%', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }} />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="admin-form-group" style={{ gridColumn: '1 / -1', background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                      <label style={{ fontWeight: '700', fontSize: '0.95rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <i className="fa-solid fa-truck-fast" style={{ color: '#ff7a00' }} />
                        Courier Partner Options & Shipping Charges
                      </label>
                      <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.75rem' }}>
                        Define available courier services and rates selectable by customers during checkout.
                      </span>
                      {(editProduct.courierOptions || []).map((courier, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                          <input
                            type="text"
                            placeholder="Courier Name (e.g. ST Couriers)"
                            value={courier.name}
                            onChange={(e) => {
                              const updated = (editProduct.courierOptions || []).map((c, i) => i === idx ? { ...c, name: e.target.value } : c);
                              setEditProduct({ ...editProduct, courierOptions: updated });
                            }}
                            style={{ flex: 2, padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a' }}
                          />
                          <input
                            type="number"
                            placeholder="Price (₹)"
                            value={courier.price}
                            onChange={(e) => {
                              const updated = (editProduct.courierOptions || []).map((c, i) => i === idx ? { ...c, price: Number(e.target.value) } : c);
                              setEditProduct({ ...editProduct, courierOptions: updated });
                            }}
                            style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a' }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = (editProduct.courierOptions || []).filter((_, i) => i !== idx);
                              setEditProduct({ ...editProduct, courierOptions: updated });
                            }}
                            style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', padding: '0.5rem 0.75rem', cursor: 'pointer' }}
                          >
                            <i className="fa-solid fa-trash" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setEditProduct({
                            ...editProduct,
                            courierOptions: [...(editProduct.courierOptions || []), { name: '', price: 0 }]
                          });
                        }}
                        style={{ background: '#e2e8f0', color: '#0f172a', border: 'none', borderRadius: '6px', padding: '0.4rem 0.8rem', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer', marginTop: '0.25rem' }}
                      >
                        + Add Courier Partner Option
                      </button>
                    </div>

                    <button type="submit" className="admin-btn admin-btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.8rem' }}>
                      <i className="fa-solid fa-floppy-disk" style={{ marginRight: '6px' }}></i>
                      Save Changes
                    </button>
                  </form>
                </div>
              )}

              <div className="admin-card-glass">
                <h3>Add New Product</h3>
                <form onSubmit={handleAddProduct}>
                  <div className="admin-form-grid" style={{ marginBottom: '1.25rem' }}>
                    <div className="admin-form-group">
                      <label htmlFor="newProductName">Product Name</label>
                      <input 
                        id="newProductName"
                        type="text" 
                        placeholder="e.g. Sustainable Rocket Stove" 
                        required 
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                      />
                    </div>
                    {/* Product Pricing & Auto-Discount Calculator */}
                    <div style={{
                      gridColumn: '1 / -1',
                      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '14px',
                      padding: '1.25rem',
                      marginBottom: '0.5rem',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <label style={{ fontWeight: '700', fontSize: '1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                          <i className="fa-solid fa-calculator" style={{ color: 'var(--primary-color)' }}></i>
                          Product Pricing & Auto-Discount Calculator
                        </label>
                        <span style={{ fontSize: '0.8rem', background: '#dbeafe', color: '#1e40af', padding: '3px 10px', borderRadius: '12px', fontWeight: 600 }}>
                          E-Commerce Standard (MRP & Selling Price)
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                        {/* Product Price / MRP */}
                        <div className="admin-form-group" style={{ margin: 0 }}>
                          <label htmlFor="newProductOriginalPrice" style={{ fontWeight: 600, fontSize: '0.85rem', color: '#334155' }}>
                            Product Price / MRP (₹) <span style={{ color: '#ef4444' }}>*</span>
                          </label>
                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <span style={{ position: 'absolute', left: '0.9rem', color: '#64748b', fontWeight: 'bold' }}>₹</span>
                            <input
                              id="newProductOriginalPrice"
                              type="text"
                              placeholder="e.g. 5000"
                              value={newProduct.originalPrice || newProduct.mrp || ''}
                              onChange={(e) => handleNewProductPricingChange('originalPrice', e.target.value)}
                              style={{ paddingLeft: '2rem', width: '100%', borderColor: '#94a3b8' }}
                            />
                          </div>
                          <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px' }}>Original MRP (struck-through on store)</span>
                        </div>

                        {/* Selling Price */}
                        <div className="admin-form-group" style={{ margin: 0 }}>
                          <label htmlFor="newProductPrice" style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0f172a' }}>
                            Selling Price / Deal Price (₹) <span style={{ color: '#ef4444' }}>*</span>
                          </label>
                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <span style={{ position: 'absolute', left: '0.9rem', color: '#16a34a', fontWeight: 'bold' }}>₹</span>
                            <input
                              id="newProductPrice"
                              type="text"
                              placeholder="e.g. 4500"
                              required
                              value={newProduct.price || ''}
                              onChange={(e) => handleNewProductPricingChange('price', e.target.value)}
                              style={{ paddingLeft: '2rem', width: '100%', borderColor: '#16a34a', fontWeight: 600 }}
                            />
                          </div>
                          <span style={{ fontSize: '0.72rem', color: '#16a34a', marginTop: '3px', fontWeight: 500 }}>Actual price paid by customer</span>
                        </div>

                        {/* Discount Rate (%) */}
                        <div className="admin-form-group" style={{ margin: 0 }}>
                          <label htmlFor="newProductDiscountPercent" style={{ fontWeight: 600, fontSize: '0.85rem', color: '#334155' }}>
                            Discount Rate (%) <span style={{ color: '#64748b', fontWeight: 400 }}>(Auto-calculated)</span>
                          </label>
                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <input
                              id="newProductDiscountPercent"
                              type="number"
                              min="0"
                              max="100"
                              placeholder="e.g. 10"
                              value={newProduct.discountPercent ?? ''}
                              onChange={(e) => handleNewProductPricingChange('discountPercent', e.target.value)}
                              style={{ paddingRight: '2rem', width: '100%' }}
                            />
                            <span style={{ position: 'absolute', right: '0.9rem', color: '#64748b', fontWeight: 'bold' }}>%</span>
                          </div>
                          <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px' }}>Auto-calculates from MRP & Selling Price</span>
                        </div>

                        {/* Customer Saves (₹) */}
                        <div className="admin-form-group" style={{ margin: 0 }}>
                          <label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#334155' }}>
                            Customer Savings (₹)
                          </label>
                          {(() => {
                            const mrpNum = parseFloat(newProduct.originalPrice || newProduct.mrp) || 0;
                            const sellingNum = parseFloat(newProduct.price) || 0;
                            const saveAmt = (mrpNum > sellingNum && sellingNum > 0) ? (mrpNum - sellingNum) : 0;
                            return (
                              <div style={{
                                padding: '0.65rem 1rem',
                                borderRadius: '8px',
                                background: saveAmt > 0 ? '#ecfdf5' : '#f1f5f9',
                                border: `1.5px solid ${saveAmt > 0 ? '#a7f3d0' : '#e2e8f0'}`,
                                color: saveAmt > 0 ? '#047857' : '#64748b',
                                fontWeight: 700,
                                fontSize: '0.95rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}>
                                <i className={saveAmt > 0 ? 'fa-solid fa-badge-percent' : 'fa-regular fa-circle-question'}></i>
                                <span>{saveAmt > 0 ? `₹${saveAmt.toLocaleString('en-IN')} Saved` : 'No Savings (0%)'}</span>
                              </div>
                            );
                          })()}
                          <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px' }}>Difference between MRP and Selling Price</span>
                        </div>
                      </div>

                      {/* Live E-Commerce Store Preview Banner */}
                      {(() => {
                        const mrpNum = parseFloat(newProduct.originalPrice || newProduct.mrp) || 0;
                        const sellingNum = parseFloat(newProduct.price) || 0;
                        const saveAmt = (mrpNum > sellingNum && sellingNum > 0) ? (mrpNum - sellingNum) : 0;
                        const discNum = (mrpNum > sellingNum && sellingNum > 0) ? Math.round(((mrpNum - sellingNum) / mrpNum) * 100) : (Number(newProduct.discountPercent) || 0);
                        return (
                          <div style={{
                            background: '#ffffff',
                            border: '1px dashed #94a3b8',
                            borderRadius: '10px',
                            padding: '0.75rem 1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '0.75rem'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', fontWeight: 700 }}>
                                Website Live Preview:
                              </span>
                              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                                ₹{sellingNum.toLocaleString('en-IN')}
                              </span>
                              {saveAmt > 0 && (
                                <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '0.95rem', fontWeight: 500 }}>
                                  ₹{mrpNum.toLocaleString('en-IN')}
                                </span>
                              )}
                              {discNum > 0 && (
                                <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700 }}>
                                  {discNum}% OFF
                                </span>
                              )}
                            </div>
                            {saveAmt > 0 && (
                              <div style={{ background: '#fef3c7', color: '#b45309', padding: '3px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <i className="fa-solid fa-circle-check"></i> Customer Saves ₹{saveAmt.toLocaleString('en-IN')}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                    <div className="admin-form-group">
                      <label htmlFor="newProductDescription">Description</label>
                      <textarea
                        id="newProductDescription"
                        placeholder="Short product description"
                        required
                        value={newProduct.description}
                        onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                        style={{ minHeight: '100px' }}
                      />
                    </div>
                    <div className="admin-form-group">
                      <label htmlFor="newProductSpecifications">Specifications</label>
                      <textarea
                        id="newProductSpecifications"
                        placeholder="Product specifications"
                        value={newProduct.specifications}
                        onChange={(e) => setNewProduct({...newProduct, specifications: e.target.value})}
                        style={{ minHeight: '100px' }}
                      />
                    </div>
                    <div className="admin-form-group">
                      <label htmlFor="newProductHowToUse">How to Use</label>
                      <textarea
                        id="newProductHowToUse"
                        placeholder="Instructions on how to use the product"
                        value={newProduct.howToUse}
                        onChange={(e) => setNewProduct({...newProduct, howToUse: e.target.value})}
                      ></textarea>
                    </div>
                    <div className="admin-form-group">
                      <label htmlFor="newProductBurnerSize">Burner Size</label>
                      <input id="newProductBurnerSize" type="text" placeholder="e.g. 12 Inches" value={newProduct.burnerSize} onChange={(e) => setNewProduct({ ...newProduct, burnerSize: e.target.value })} />
                    </div>
                    <div className="admin-form-group">
                      <label htmlFor="newProductStoveWeight">Stove Weight</label>
                      <input id="newProductStoveWeight" type="text" placeholder="e.g. 35 to 38 kg" value={newProduct.stoveWeight} onChange={(e) => setNewProduct({ ...newProduct, stoveWeight: e.target.value })} />
                    </div>
                    <div className="admin-form-group">
                      <label htmlFor="newProductDimensions">Dimensions</label>
                      <input id="newProductDimensions" type="text" placeholder="e.g. 18 × 18 × 19 Inches" value={newProduct.dimensions} onChange={(e) => setNewProduct({ ...newProduct, dimensions: e.target.value })} />
                    </div>
                    <div className="admin-form-group">
                      <label htmlFor="newProductMaterial">Material</label>
                      <input id="newProductMaterial" type="text" placeholder="e.g. Mild Steel (MS)" value={newProduct.material} onChange={(e) => setNewProduct({ ...newProduct, material: e.target.value })} />
                    </div>
                    <div className="admin-form-group" style={{ gridColumn: '1 / -1' }}>
                      <label htmlFor="newProductUsage">Usage (Crafted for / Suitable for)</label>
                      <textarea
                        id="newProductUsage"
                        placeholder="e.g. Crafted for Temples, Hotels, Restaurants, Bakeries, Cafes, Tea Shops, Catering Services, Cloud Kitchens, Street Food Businesses, and Every Professional Kitchen."
                        value={newProduct.usage}
                        onChange={(e) => setNewProduct({ ...newProduct, usage: e.target.value })}
                        style={{ minHeight: '75px' }}
                      />
                    </div>
                    <div className="admin-form-group">
                      <label htmlFor="newProductFuelType">Fuel Type</label>
                      <input id="newProductFuelType" type="text" placeholder="e.g. Wood, Coconut shell & husk, Charcoal & Biomass" value={newProduct.fuelType} onChange={(e) => setNewProduct({ ...newProduct, fuelType: e.target.value })} />
                    </div>
                    <div className="admin-form-group">
                      <label htmlFor="newProductCookingSurface">Cooking Surface</label>
                      <input id="newProductCookingSurface" type="text" placeholder="e.g. Flat / Heavy-Duty Top" value={newProduct.cookingSurface} onChange={(e) => setNewProduct({ ...newProduct, cookingSurface: e.target.value })} />
                    </div>
                    <div className="admin-form-group">
                      <label htmlFor="newProductCookingCapacity">Cooking Capacity</label>
                      <input id="newProductCookingCapacity" type="text" placeholder="e.g. Up to 40 kg (40 - 75 Persons / Commercial & Hotels)" value={newProduct.cookingCapacity} onChange={(e) => setNewProduct({ ...newProduct, cookingCapacity: e.target.value })} />
                    </div>
                    <div className="admin-form-group">
                      <label htmlFor="newProductStock">Stock</label>
                      <input
                        id="newProductStock"
                        type="number"
                        min="0"
                        placeholder="Stock quantity"
                        value={newProduct.stock}
                        onChange={(e) => setNewProduct({...newProduct, stock: Number(e.target.value)})}
                      />
                    </div>
                    <div className="admin-form-group">
                      <label htmlFor="newProductShippingCharge">Base Shipping Charge (₹)</label>
                      <input
                        id="newProductShippingCharge"
                        type="number"
                        min="0"
                        placeholder="Shipping charge in ₹"
                        value={newProduct.shippingCharge}
                        onChange={(e) => setNewProduct({...newProduct, shippingCharge: Number(e.target.value)})}
                      />
                    </div>
                    <div className="admin-form-group">
                      <label htmlFor="newProductGstPercent">GST Rate (% - Optional)</label>
                      <input
                        id="newProductGstPercent"
                        type="number"
                        min="0"
                        max="100"
                        placeholder="e.g. 0 or 18"
                        value={newProduct.gstPercent}
                        onChange={(e) => setNewProduct({...newProduct, gstPercent: Number(e.target.value)})}
                      />
                      <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>Leave 0 to omit GST charge from customer checkout.</span>
                    </div>
                    <div className="admin-form-group" style={{ gridColumn: '1 / -1', background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <label style={{ fontWeight: '700', fontSize: '0.95rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <i className="fa-solid fa-truck-fast" style={{ color: '#ff7a00' }} />
                        Courier Partner Options & Shipping Charges
                      </label>
                      <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.75rem' }}>
                        Define available courier services and rates selectable by customers during checkout.
                      </span>
                      {(newProduct.courierOptions || []).map((courier, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                          <input
                            type="text"
                            placeholder="Courier Name (e.g. ST Couriers)"
                            value={courier.name}
                            onChange={(e) => {
                              const updated = (newProduct.courierOptions || []).map((c, i) => i === idx ? { ...c, name: e.target.value } : c);
                              setNewProduct({ ...newProduct, courierOptions: updated });
                            }}
                            style={{ flex: 2, padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                          />
                          <input
                            type="number"
                            placeholder="Price (₹)"
                            value={courier.price}
                            onChange={(e) => {
                              const updated = (newProduct.courierOptions || []).map((c, i) => i === idx ? { ...c, price: Number(e.target.value) } : c);
                              setNewProduct({ ...newProduct, courierOptions: updated });
                            }}
                            style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = (newProduct.courierOptions || []).filter((_, i) => i !== idx);
                              setNewProduct({ ...newProduct, courierOptions: updated });
                            }}
                            style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', padding: '0.5rem 0.75rem', cursor: 'pointer' }}
                          >
                            <i className="fa-solid fa-trash" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setNewProduct({
                            ...newProduct,
                            courierOptions: [...(newProduct.courierOptions || []), { name: '', price: 0 }]
                          });
                        }}
                        style={{ background: '#e2e8f0', color: '#0f172a', border: 'none', borderRadius: '6px', padding: '0.4rem 0.8rem', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer', marginTop: '0.25rem' }}
                      >
                        + Add Courier Partner Option
                      </button>
                    </div>
                    <div className="admin-form-group">
                      <label htmlFor="newProductCategory">Category</label>
                      <select 
                        id="newProductCategory"
                        value={newProduct.category}
                        onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                      >
                        {categories.map(cat => {
                          const optionValue = typeof cat === 'string' ? cat : (cat.slug || cat.name || '').toString();
                          const optionLabel = typeof cat === 'string' ? cat : (cat.name || cat.slug || '').toString();
                          return (
                            <option key={optionValue} value={optionValue}>
                              {optionLabel.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div className="admin-form-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.5rem', marginTop: '1.8rem' }}>
                      <input 
                        type="checkbox" 
                        id="newArrival" 
                        checked={newProduct.isNewArrival}
                        onChange={(e) => setNewProduct({...newProduct, isNewArrival: e.target.checked})}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <label htmlFor="newArrival" style={{ cursor: 'pointer' }}>Mark as New Arrival</label>
                    </div>
                  </div>

                  <div className="admin-form-group" style={{ marginBottom: '1.5rem' }}>
                    <div>Product Images (Max 10 - Upload Files or Paste URLs)</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                          type="url"
                          value={newProductImageUrl}
                          onChange={(e) => setNewProductImageUrl(e.target.value)}
                          placeholder="Paste direct image URL (https://...)"
                          className="admin-form-control"
                          style={{ flex: 1 }}
                        />
                        <button type="button" className="admin-btn admin-btn-small" onClick={handleAddUrlToNewProduct}>
                          Add URL
                        </button>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                        {newProduct.images.map((base64, index) => (
                          <div key={index} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '2px solid #818cf8' }}>
                            <img src={base64} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button 
                              type="button" 
                              onClick={() => removeImage(index)}
                              style={{ position: 'absolute', top: '2px', right: '2px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                        {newProduct.images.length < 10 && (
                          <label htmlFor="newProductImageUpload" style={{ 
                            width: '80px', height: '80px', borderRadius: '8px', border: '2px dashed rgba(0,0,0,0.1)', 
                            display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', 
                            cursor: 'pointer', transition: 'var(--transition)' 
                          }} className="upload-btn">
                            <i className="fa-solid fa-plus" style={{ color: '#64748b', fontSize: '1.2rem' }}></i>
                            <span style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '4px' }}>Upload Files</span>
                            <input id="newProductImageUpload" name="newProductImageUpload" type="file" accept="image/*" multiple onChange={handleFileChange} style={{ display: 'none' }} />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="admin-form-group" style={{ marginBottom: '1.5rem' }}>
                    <div>Product Video (Upload File or Enter URL)</div>
                    <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <input 
                        type="text" 
                        placeholder="Paste YouTube, Vimeo, or direct video URL here..." 
                        value={newProduct.video && !newProduct.video.startsWith('data:') ? newProduct.video : ''}
                        onChange={(e) => setNewProduct({...newProduct, video: e.target.value})}
                        style={{ width: '100%' }}
                      />
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <label htmlFor="newProductVideoUpload" className="admin-btn admin-btn-outline" style={{ cursor: 'pointer', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                          <i className="fa-solid fa-video" style={{ marginRight: '6px' }}></i>
                          Upload Video File
                          <input 
                            id="newProductVideoUpload" 
                            name="newProductVideoUpload" 
                            type="file" 
                            accept="video/*" 
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (!file) return;
                              if (file.size > 25 * 1024 * 1024) { // 25MB limit
                                alert('Video file size exceeds 25MB limit.');
                                return;
                              }
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setNewProduct({...newProduct, video: reader.result});
                              };
                              reader.readAsDataURL(file);
                            }} 
                            style={{ display: 'none' }} 
                          />
                        </label>
                        
                        {newProduct.video && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>
                              {newProduct.video.startsWith('data:') ? '✓ Video File Loaded' : '✓ Video Link Set'}
                            </span>
                            <button 
                              type="button" 
                              onClick={() => setNewProduct({...newProduct, video: ''})}
                              style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer', fontSize: '0.75rem' }}
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {newProduct.video && newProduct.video.startsWith('data:') && (
                        <div style={{ marginTop: '0.5rem', width: '100%', maxWidth: '280px' }}>
                          <video src={newProduct.video} controls style={{ width: '100%', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }} />
                        </div>
                      )}
                    </div>
                  </div>

                  <button type="submit" className="admin-btn admin-btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.8rem' }}>
                    Add Product to Catalog
                  </button>
                </form>
              </div>

              <div className="admin-card-glass">
                <h3>Current Inventory ({products.length} products)</h3>
                {products.length > 0 ? (
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Preview</th>
                          <th>Name</th>
                          <th>Category</th>
                          <th>Price</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map(p => (
                          <tr key={p._id || p.id} style={editingProductId === (p._id || p.id) ? { background: 'rgba(22,163,74,0.06)' } : {}}>
                            <td>
                              <div className="table-img-circle">
                                {p.images && p.images.length > 0 ? (
                                  <img src={p.images[0]} alt={p.name} />
                                ) : (
                                  <i className={`fa-solid ${p.icon || 'fa-box'}`} style={{ color: 'var(--primary-color)' }}></i>
                                )}
                              </div>
                            </td>
                            <td style={{ fontWeight: 600 }}>{p.name}</td>
                            <td>{String(p.category || '').replace(/-/g, ' ')}</td>
                            <td style={{ fontWeight: 'bold', color: 'var(--primary-dark)' }}>
                              {p.price.toString().startsWith('₹') ? p.price : `₹${p.price}`}
                            </td>
                            <td>
                              {p.isNewArrival ? (
                                <span className="status-pill active">New Arrival</span>
                              ) : (
                                <span className="status-pill" style={{ color: '#94a3b8', background: 'rgba(0,0,0,0.03)', border: '1px solid #e2e8f0' }}>Standard</span>
                              )}
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <button
                                  className="admin-btn admin-btn-success"
                                  onClick={() => startEditProduct(p)}
                                  title="Edit Product"
                                  style={editingProductId === (p._id || p.id) ? { background: 'var(--primary-color)', color: 'white', borderColor: 'var(--primary-color)' } : {}}
                                >
                                  <i className="fa-solid fa-pen"></i> Edit
                                </button>
                                <button
                                  className="admin-btn admin-btn-danger"
                                  onClick={() => handleDelete(p._id || p.id)}
                                  title="Delete Product"
                                >
                                  <i className="fa-solid fa-trash"></i> Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="admin-empty-state">No products in inventory yet.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'Categories' && (
            <div className="admin-categories-management">
              <div className="admin-card-glass">
                <h3>{editingCategoryId ? 'Edit Category' : 'Add New Category'}</h3>
                <form id="category-form" onSubmit={handleAddCategory} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div className="admin-form-group" style={{ flex: 1, minWidth: '220px' }}>
                    <label htmlFor="newCategoryInput">Category Name</label>
                    <input 
                      id="newCategoryInput"
                      type="text" 
                      placeholder="e.g. Electronics & Gadgets" 
                      required 
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="admin-btn admin-btn-primary" style={{ height: '44px', marginBottom: '2px' }}>
                    {editingCategoryId ? 'Save Category' : 'Add Category'}
                  </button>
                  {editingCategoryId && (
                    <button type="button" className="admin-btn admin-btn-danger" onClick={cancelCategoryEdit} style={{ height: '44px', marginBottom: '2px' }}>
                      Cancel
                    </button>
                  )}
                </form>
              </div>

              <div className="admin-card-glass">
                <h3>Category Overview</h3>
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map(cat => {
                        const categoryProducts = (Array.isArray(products) ? products : []).filter(product => {
                          const productCategory = (typeof product.category === 'object' ? (product.category.name || product.category.slug || '') : (product.category || '')).toString().toLowerCase();
                          const categoryName = (cat.name || cat.slug || '').toString().toLowerCase();
                          return productCategory === categoryName || productCategory.includes(categoryName) || categoryName.includes(productCategory);
                        });
                        const categoryPrice = categoryProducts.length > 0
                          ? Math.min(...categoryProducts.map(product => Number(product.price) || 0))
                          : 0;
                        const hasStock = categoryProducts.some(product => Number(product.stock) > 0);
                        const status = hasStock ? 'Active' : 'Out of Stock';
                        return (
                          <tr key={cat._id || cat.id}>
                            <td style={{ fontWeight: '600', color: '#0f172a' }}>{cat.name}</td>
                            <td>₹{categoryPrice}</td>
                            <td>
                              <span className={`status-pill ${hasStock ? 'active' : 'blocked'}`}>{status}</span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                  type="button"
                                  className="admin-btn admin-btn-small"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    startCategoryEdit(cat);
                                  }}
                                  title={`Edit ${cat.name || 'category'}`}
                                  aria-label={`Edit ${cat.name || 'category'}`}
                                >
                                  <i className="fa-solid fa-pen"></i>
                                </button>
                                <button className="admin-btn admin-btn-small admin-btn-danger" onClick={() => onDeleteCategory(cat._id || cat.id)} title="Delete Category"><i className="fa-solid fa-trash"></i></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Offers' && (
            <div className="admin-offers-management">
              <div className="admin-card-glass" style={{ display: 'grid', gap: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div>
                    <h3>{editingOfferId ? 'Edit Offer' : 'Create New Offer'}</h3>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Create, schedule, and manage product, category, and store-wide offers from one place.</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button type="button" className="admin-btn admin-btn-small" onClick={resetOfferForm}>New Offer</button>
                  </div>
                </div>

                <form onSubmit={handleUpdateOffer} style={{ display: 'grid', gap: '2rem' }}>
                  {/* OFFER IMAGES SECTION */}
                  <div className="admin-form-group">
                    <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Offer Images (Up to 5)</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                      {[0, 1, 2, 3, 4].map(index => (
                        <div key={index} style={{
                          aspect: '1',
                          border: '2px dashed #cbd5e1',
                          borderRadius: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#f8fafc',
                          cursor: 'pointer',
                          overflow: 'hidden',
                          position: 'relative'
                        }}>
                          {(offerForm.images || [])[index] ? (
                            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                              <img src={(offerForm.images || [])[index]} alt={`Offer ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <button type="button" onClick={() => removeOfferImage(index)} style={{
                                position: 'absolute',
                                top: '4px',
                                right: '4px',
                                background: 'rgba(0,0,0,0.7)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: '24px',
                                height: '24px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <i className="fa-solid fa-xmark" style={{ fontSize: '12px' }}></i>
                              </button>
                            </div>
                          ) : (
                            <div style={{ textAlign: 'center', color: '#cbd5e1', fontSize: '1.5rem' }}>
                              <i className="fa-solid fa-image"></i>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>
                      Paste Image URL
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                      <input type="url" value={offerImageUrl} onChange={(e) => setOfferImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" style={{ flex: 1 }} />
                      <button type="button" className="admin-btn admin-btn-small" onClick={addOfferImage}>Add</button>
                    </div>
                  </div>

                  {/* PRODUCT DETAILS TABLE-LIKE SECTION */}
                  <div style={{ overflowX: 'auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', minWidth: '100%' }}>
                      {/* Row 1: Product Name, Category, Condition, Badge Label, Original Price */}
                      <div className="admin-form-group" style={{ marginBottom: 0 }}>
                        <label htmlFor="offerProductName" style={{ fontSize: '0.75rem', color: '#0f172a', fontWeight: '600' }}>Product Name *</label>
                        <input id="offerProductName" type="text" value={offerForm.productName} onChange={(e) => setOfferForm({...offerForm, productName: e.target.value})} placeholder="Please fill out this field" required />
                      </div>
                      <div className="admin-form-group" style={{ marginBottom: 0 }}>
                        <label htmlFor="offerCategory" style={{ fontSize: '0.75rem', color: '#0f172a', fontWeight: '600' }}>Category</label>
                        <select id="offerCategory" value={offerForm.category} onChange={(e) => setOfferForm({...offerForm, category: e.target.value})}>
                          <option value="">Select Category</option>
                          {products.map(p => p.category).filter((v, i, a) => a.indexOf(v) === i).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div className="admin-form-group" style={{ marginBottom: 0 }}>
                        <label htmlFor="offerCondition" style={{ fontSize: '0.75rem', color: '#0f172a', fontWeight: '600' }}>Condition</label>
                        <input id="offerCondition" type="text" value={offerForm.condition} onChange={(e) => setOfferForm({...offerForm, condition: e.target.value})} placeholder="e.g. First 60 customers only" />
                      </div>
                      <div className="admin-form-group" style={{ marginBottom: 0 }}>
                        <label htmlFor="offerBadgeLabel" style={{ fontSize: '0.75rem', color: '#0f172a', fontWeight: '600' }}>Badge Label</label>
                        <input id="offerBadgeLabel" type="text" value={offerForm.badgeLabel} onChange={(e) => setOfferForm({...offerForm, badgeLabel: e.target.value})} placeholder="e.g. Limited Offer" />
                      </div>
                      <div className="admin-form-group" style={{ marginBottom: 0 }}>
                        <label htmlFor="offerOriginalPrice" style={{ fontSize: '0.75rem', color: '#0f172a', fontWeight: '600' }}>Original Price (₹) *</label>
                        <input id="offerOriginalPrice" type="number" value={offerForm.originalPrice} onChange={(e) => setOfferForm({...offerForm, originalPrice: e.target.value})} placeholder="e.g. 500" required />
                      </div>
                    </div>

                    {/* Row 2: Offer Price, MRP Illusion, Discount %, Stock Units, Rating */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginTop: '1rem', minWidth: '100%' }}>
                      <div className="admin-form-group" style={{ marginBottom: 0 }}>
                        <label htmlFor="offerPrice" style={{ fontSize: '0.75rem', color: '#0f172a', fontWeight: '600' }}>Offer Price (₹) *</label>
                        <input id="offerPrice" type="number" value={offerForm.offerPrice} onChange={(e) => setOfferForm({...offerForm, offerPrice: e.target.value})} placeholder="e.g. 550" required />
                      </div>
                      <div className="admin-form-group" style={{ marginBottom: 0 }}>
                        <label htmlFor="offerMrpIllusion" style={{ fontSize: '0.75rem', color: '#0f172a', fontWeight: '600' }}>MRP Illusion (₹)</label>
                        <input id="offerMrpIllusion" type="number" value={offerForm.mrpIllusion} onChange={(e) => setOfferForm({...offerForm, mrpIllusion: e.target.value})} placeholder="Displayed strikethrough" />
                      </div>
                      <div className="admin-form-group" style={{ marginBottom: 0 }}>
                        <label htmlFor="offerDiscount" style={{ fontSize: '0.75rem', color: '#0f172a', fontWeight: '600' }}>Discount (%)</label>
                        <input id="offerDiscount" type="number" value={offerForm.discountPercent} onChange={(e) => setOfferForm({...offerForm, discountPercent: e.target.value})} placeholder="Auto-calculated or set" />
                      </div>
                      <div className="admin-form-group" style={{ marginBottom: 0 }}>
                        <label htmlFor="offerStockUnits" style={{ fontSize: '0.75rem', color: '#0f172a', fontWeight: '600' }}>Stock Units *</label>
                        <input id="offerStockUnits" type="number" value={offerForm.stockUnits} onChange={(e) => setOfferForm({...offerForm, stockUnits: e.target.value})} placeholder="e.g. 60" required />
                      </div>
                      <div className="admin-form-group" style={{ marginBottom: 0 }}>
                        <label htmlFor="offerRating" style={{ fontSize: '0.75rem', color: '#0f172a', fontWeight: '600' }}>Rating (0-5)</label>
                        <input id="offerRating" type="number" min="0" max="5" step="0.1" value={offerForm.rating} onChange={(e) => setOfferForm({...offerForm, rating: e.target.value})} placeholder="e.g. 4.5" />
                      </div>
                    </div>
                  </div>

                  {/* DATE RANGE SECTION */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="admin-form-group">
                      <label htmlFor="offerStartDate" style={{ fontSize: '0.75rem', color: '#0f172a', fontWeight: '600' }}>Start Date *</label>
                      <input id="offerStartDate" type="date" value={offerForm.startDate} onChange={(e) => setOfferForm({...offerForm, startDate: e.target.value})} required />
                    </div>
                    <div className="admin-form-group">
                      <label htmlFor="offerEndDate" style={{ fontSize: '0.75rem', color: '#0f172a', fontWeight: '600' }}>End Date *</label>
                      <input id="offerEndDate" type="date" value={offerForm.endDate} onChange={(e) => setOfferForm({...offerForm, endDate: e.target.value})} required />
                    </div>
                  </div>

                  {/* ADDITIONAL FIELDS */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="admin-form-group">
                      <label htmlFor="offerTitle">Offer Title</label>
                      <input id="offerTitle" type="text" value={offerForm.title} onChange={(e) => setOfferForm({...offerForm, title: e.target.value})} placeholder="e.g. Grand Monsoon Sale!" />
                    </div>
                    <div className="admin-form-group">
                      <label htmlFor="offerCode">Promo Code</label>
                      <input id="offerCode" type="text" value={offerForm.code} onChange={(e) => setOfferForm({...offerForm, code: e.target.value})} placeholder="e.g. MONSOON30" />
                    </div>
                  </div>

                  {/* DESCRIPTION */}
                  <div className="admin-form-group">
                    <label htmlFor="offerDescription">Description *</label>
                    <textarea id="offerDescription" value={offerForm.description} onChange={(e) => setOfferForm({...offerForm, description: e.target.value})} placeholder="Describe the offer details..." style={{ minHeight: '100px' }} required />
                  </div>

                  {/* TOGGLES & SUBMIT */}
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <label className="offer-toggle" htmlFor="offerPublish">
                      <input id="offerPublish" type="checkbox" checked={offerForm.isPublished} onChange={(e) => setOfferForm({...offerForm, isPublished: e.target.checked})} />
                      <span>Publish on storefront</span>
                    </label>
                    <label className="offer-toggle" htmlFor="offerActive">
                      <input id="offerActive" type="checkbox" checked={offerForm.isActive} onChange={(e) => setOfferForm({...offerForm, isActive: e.target.checked})} />
                      <span>Active now</span>
                    </label>
                    <button type="submit" className="admin-btn admin-btn-primary" style={{ marginLeft: 'auto' }}>
                      {editingOfferId ? 'Save Offer' : 'Publish Offer'}
                    </button>
                  </div>
                </form>
              </div>
              <div className="admin-card-glass" style={{ marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3>Offer Library</h3>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <input type="search" value={offerSearch} onChange={(e) => setOfferSearch(e.target.value)} placeholder="Search offers" style={{ minWidth: '180px' }} />
                    <select value={offerStatusFilter} onChange={(e) => setOfferStatusFilter(e.target.value)}>
                      <option value="all">All</option>
                      <option value="active">Active</option>
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                    </select>
                    <select value={offerSort} onChange={(e) => setOfferSort(e.target.value)}>
                      <option value="priority">Priority</option>
                      <option value="title">Title</option>
                      <option value="created">Recently Added</option>
                    </select>
                  </div>
                </div>
                {filteredOffers.length > 0 ? (
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Offer</th>
                          <th>Scope</th>
                          <th>Status</th>
                          <th>Priority</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOffers.map(offer => {
                          const offerId = offer._id || offer.id;
                          const status = offer.isPublished ? 'Published' : 'Draft';
                          return (
                            <tr key={offerId}>
                              <td>
                                <div style={{ fontWeight: 600, color: '#0f172a' }}>{offer.title}</div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{offer.code}</div>
                              </td>
                              <td>{offer.type || 'product'}</td>
                              <td>
                                <span className={`status-pill ${offer.isPublished ? 'active' : 'blocked'}`}>{status}</span>
                              </td>
                              <td>{offer.priority || 0}</td>
                              <td>
                                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                  <button type="button" className="admin-btn admin-btn-small" onClick={() => startOfferEdit(offer)}><i className="fa-solid fa-pen"></i></button>
                                  <button type="button" className="admin-btn admin-btn-small" onClick={() => onToggleOffer(offerId)}><i className="fa-solid fa-power-off"></i></button>
                                  <button type="button" className="admin-btn admin-btn-small" onClick={() => onDuplicateOffer(offer)}><i className="fa-solid fa-copy"></i></button>
                                  <button type="button" className="admin-btn admin-btn-small admin-btn-danger" onClick={() => onDeleteOffer(offerId)}><i className="fa-solid fa-trash"></i></button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="admin-empty-state">No offers match the current search or filters.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'Orders' && (
            <div className="admin-orders-management">
              <div style={{ display: 'grid', gridTemplateColumns: selectedOrder ? '1.4fr 1fr' : '1fr', gap: '1.5rem' }}>
                <div className="admin-card-glass">
                  <h3>Recent Orders</h3>
                  {orders.length > 0 ? (
                    <div className="admin-table-wrapper">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.map(o => (
                            <tr
                              key={o._id || o.id}
                              onClick={() => handleSelectOrder(o)}
                              style={{ cursor: 'pointer', background: selectedOrderId === (o._id || o.id) ? 'rgba(79, 70, 229, 0.08)' : 'transparent' }}
                            >
                              <td style={{ fontWeight: '700', color: '#818cf8' }}>#{o.orderId}</td>
                              <td>{o.customerName}</td>
                              <td style={{ fontWeight: 'bold', color: 'black' }}>
                                {o.totalAmount?.toString().startsWith('₹') ? o.totalAmount : `₹${o.totalAmount}`}
                              </td>
                              <td>
                                <span className={`status-pill ${o.status === 'Delivered' ? 'delivered' : 'processing'}`}>
                                  {o.status}
                                </span>
                              </td>
                              <td style={{ color: '#94a3b8' }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="admin-empty-state">No orders placed yet.</div>
                  )}
                </div>

                {selectedOrder ? (
                  <div className="admin-card-glass" style={{ minWidth: '320px' }}>
                    <h3>Order Progress</h3>
                    <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1rem' }}>
                      {orderProgressStages.map((stage, index) => {
                        const stageIndex = getOrderProgressIndex(selectedOrder.status);
                        const isCompleted = stageIndex >= index + 1;
                        const isActive = stageIndex === index;
                        const isCancelled = stageIndex < 0;
                        return (
                          <div key={stage.key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 0.8rem', borderRadius: '0.9rem', background: isCompleted ? 'rgba(22, 163, 74, 0.12)' : isActive ? 'rgba(79, 70, 229, 0.14)' : 'rgba(15, 23, 42, 0.04)', border: isCompleted ? '1px solid rgba(22, 163, 74, 0.25)' : isActive ? '1px solid rgba(79, 70, 229, 0.25)' : '1px solid rgba(15, 23, 42, 0.08)' }}>
                            <div style={{ width: '2rem', height: '2rem', borderRadius: '999px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: isCompleted || isActive ? '#fff' : '#475569', background: isCompleted ? 'linear-gradient(135deg, #16a34a, #22c55e)' : isActive ? 'linear-gradient(135deg, #4f46e5, #818cf8)' : '#e2e8f0' }}>
                              {isCompleted ? '✓' : index + 1}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: '#0f172a' }}>{stage.label}</div>
                              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                {isCancelled ? 'Order ended' : isCompleted ? 'Completed' : isActive ? 'Current step' : 'Pending'}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <h3 style={{ marginTop: '1rem' }}>Update Shipping / Status</h3>
                    <form onSubmit={handleUpdateOrder} style={{ display: 'grid', gap: '1rem' }}>
                      <div className="admin-form-group">
                        <label htmlFor="orderStatus">Status</label>
                        <select
                          id="orderStatus"
                          value={orderShippingForm.status}
                          onChange={(e) => updateShippingFormField('status', e.target.value)}
                        >
                          <option value="">Select status</option>
                          {orderStatusOptions.map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </div>

                      <div className="admin-form-group">
                        <label htmlFor="courierPartner">Courier Partner</label>
                        <input
                          id="courierPartner"
                          type="text"
                          value={orderShippingForm.courierPartner}
                          onChange={(e) => updateShippingFormField('courierPartner', e.target.value)}
                          placeholder="e.g. XYZ Couriers"
                        />
                      </div>

                      <div className="admin-form-group">
                        <label htmlFor="trackingNumber">Tracking Number</label>
                        <input
                          id="trackingNumber"
                          type="text"
                          value={orderShippingForm.trackingNumber}
                          onChange={(e) => updateShippingFormField('trackingNumber', e.target.value)}
                          placeholder="AWB / consignment no"
                        />
                      </div>

                      <div className="admin-form-group">
                        <label htmlFor="trackingUrl">Tracking URL</label>
                        <input
                          id="trackingUrl"
                          type="text"
                          value={orderShippingForm.trackingUrl}
                          onChange={(e) => updateShippingFormField('trackingUrl', e.target.value)}
                          placeholder="https://track.example.com/awb"
                        />
                      </div>

                      <div className="admin-form-group">
                        <label htmlFor="shipmentDate">Shipment Date</label>
                        <input
                          id="shipmentDate"
                          type="date"
                          value={orderShippingForm.shipmentDate}
                          onChange={(e) => updateShippingFormField('shipmentDate', e.target.value)}
                        />
                      </div>

                      <div className="admin-form-group">
                        <label htmlFor="estimatedDelivery">Estimated Delivery</label>
                        <input
                          id="estimatedDelivery"
                          type="date"
                          value={orderShippingForm.estimatedDelivery}
                          onChange={(e) => updateShippingFormField('estimatedDelivery', e.target.value)}
                        />
                      </div>

                      <div className="admin-form-group">
                        <label htmlFor="currentLocation">Current Location</label>
                        <input
                          id="currentLocation"
                          type="text"
                          value={orderShippingForm.currentLocation}
                          onChange={(e) => updateShippingFormField('currentLocation', e.target.value)}
                          placeholder="Current transit location"
                        />
                      </div>

                      <div className="admin-form-group">
                        <label htmlFor="deliveryPersonName">Delivery Agent</label>
                        <input
                          id="deliveryPersonName"
                          type="text"
                          value={orderShippingForm.deliveryPersonName}
                          onChange={(e) => updateShippingFormField('deliveryPersonName', e.target.value)}
                          placeholder="Agent name"
                        />
                      </div>

                      <div className="admin-form-group">
                        <label htmlFor="deliveryPhone">Agent Phone</label>
                        <input
                          id="deliveryPhone"
                          type="tel"
                          value={orderShippingForm.deliveryPhone}
                          onChange={(e) => updateShippingFormField('deliveryPhone', e.target.value)}
                          placeholder="Agent contact number"
                        />
                      </div>

                      <div className="admin-form-group">
                        <label htmlFor="orderNote">Update Note</label>
                        <textarea
                          id="orderNote"
                          rows="3"
                          value={orderShippingForm.note}
                          onChange={(e) => updateShippingFormField('note', e.target.value)}
                          placeholder="Optional note for the customer"
                        />
                      </div>

                      <button type="submit" className="admin-btn admin-btn-primary" style={{ justifyContent: 'center' }}>
                        Save order update
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="admin-card-glass" style={{ minWidth: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                    <div style={{ textAlign: 'center', color: '#475569' }}>
                      <h4 style={{ marginBottom: '0.5rem' }}>Select an order</h4>
                      <p>Click an order row to update courier tracking and shipment details.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}


          {activeTab === 'Stove Enquiries' && (() => {
            const allLeads = leads || [];
            const newCount = allLeads.filter(l => (l.status || 'New') === 'New').length;
            const contactedCount = allLeads.filter(l => l.status === 'Contacted').length;
            const discussionCount = allLeads.filter(l => l.status === 'In Discussion').length;
            const convertedCount = allLeads.filter(l => l.status === 'Converted').length;

            const filteredLeads = allLeads.filter(lead => {
              const matchesStatus = leadStatusFilter === 'All' ? true : (lead.status || 'New') === leadStatusFilter;
              const q = leadSearchTerm.trim().toLowerCase();
              if (!q) return matchesStatus;
              const name = (lead.name || '').toLowerCase();
              const phone = (lead.whatsapp || lead.phone || '').toLowerCase();
              const city = (lead.location || '').toLowerCase();
              const purpose = (lead.purpose || '').toLowerCase();
              const stove = (lead.stoveModel || '').toLowerCase();
              const fuel = (lead.fuelType || '').toLowerCase();
              return matchesStatus && (name.includes(q) || phone.includes(q) || city.includes(q) || purpose.includes(q) || stove.includes(q) || fuel.includes(q));
            });

            const getPurposeColor = (pur = '') => {
              const p = pur.toLowerCase();
              if (p.includes('hotel') || p.includes('restaurant')) return { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' };
              if (p.includes('temple') || p.includes('annadhanam')) return { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' };
              if (p.includes('catering')) return { bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE' };
              if (p.includes('cloud') || p.includes('fast food')) return { bg: '#FDF2F8', text: '#BE185D', border: '#FBCFE8' };
              if (p.includes('bakery') || p.includes('tea')) return { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' };
              if (p.includes('domestic') || p.includes('farm')) return { bg: '#F0FDFA', text: '#0F766E', border: '#99F6E4' };
              return { bg: '#F8FAFC', text: '#475569', border: '#E2E8F0' };
            };

            const getWhatsAppLink = (lead) => {
              const rawNum = String(lead.whatsapp || lead.phone || '').replace(/[^0-9]/g, '');
              const cleanPhone = rawNum.startsWith('91') && rawNum.length === 12 ? rawNum : (rawNum.length === 10 ? '91' + rawNum : rawNum);
              const text = `Hello ${lead.name || 'Customer'}, thank you for contacting Sri Tech regarding your ${lead.stoveModel || 'Rocket Stove'} inquiry (${lead.purpose || 'Commercial'}). We would be glad to share catalog, pricing and delivery options with you.`;
              return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
            };

            return (
              <div className="admin-stove-enquiries" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Header & Quick Action */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem' }}>
                      Customer Stove Enquiries & Leads
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
                      Manage commercial kitchen inquiries, custom stove fabrication requests, and follow-ups.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      type="button"
                      className="admin-btn"
                      onClick={onRefresh}
                      disabled={isRefreshing}
                      style={{
                        background: '#f8fafc',
                        border: '1.5px solid #cbd5e1',
                        color: '#334155',
                        borderRadius: '10px',
                        padding: '0.6rem 1.1rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <i className={`fa-solid fa-arrows-rotate ${isRefreshing ? 'fa-spin' : ''}`}></i>
                      Refresh
                    </button>
                  </div>
                </div>

                {/* KPI Metrics Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div className="admin-card-glass" style={{ padding: '1.25rem', borderLeft: '4px solid #3B82F6', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>Total Enquiries</span>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6' }}>
                        <i className="fa-solid fa-clipboard-list"></i>
                      </div>
                    </div>
                    <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', marginTop: '0.4rem' }}>{allLeads.length}</div>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>All received inquiries</span>
                  </div>

                  <div className="admin-card-glass" style={{ padding: '1.25rem', borderLeft: '4px solid #EF4444', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>New & Pending</span>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
                        <i className="fa-solid fa-bell"></i>
                      </div>
                    </div>
                    <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#DC2626', marginTop: '0.4rem' }}>{newCount}</div>
                    <span style={{ fontSize: '0.78rem', color: '#EF4444', fontWeight: 600 }}>Requires attention</span>
                  </div>

                  <div className="admin-card-glass" style={{ padding: '1.25rem', borderLeft: '4px solid #8B5CF6', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>In Discussion</span>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B5CF6' }}>
                        <i className="fa-solid fa-comments"></i>
                      </div>
                    </div>
                    <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#7C3AED', marginTop: '0.4rem' }}>{contactedCount + discussionCount}</div>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Under active consultation</span>
                  </div>

                  <div className="admin-card-glass" style={{ padding: '1.25rem', borderLeft: '4px solid #10B981', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>Converted to Order</span>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                        <i className="fa-solid fa-circle-check"></i>
                      </div>
                    </div>
                    <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#059669', marginTop: '0.4rem' }}>{convertedCount}</div>
                    <span style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 600 }}>Successful purchases</span>
                  </div>
                </div>

                {/* Filter Tabs & Search Bar */}
                <div className="admin-card-glass" style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {['All', 'New', 'Contacted', 'In Discussion', 'Converted', 'Closed'].map(st => {
                      const count = st === 'All' ? allLeads.length : allLeads.filter(l => (l.status || 'New') === st).length;
                      const isActive = leadStatusFilter === st;
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setLeadStatusFilter(st)}
                          style={{
                            padding: '0.45rem 0.85rem',
                            borderRadius: '10px',
                            border: '1.5px solid',
                            borderColor: isActive ? '#ff7a00' : '#e2e8f0',
                            background: isActive ? '#fff7ed' : '#ffffff',
                            color: isActive ? '#ea580c' : '#475569',
                            fontWeight: isActive ? 700 : 500,
                            fontSize: '0.84rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <span>{st}</span>
                          <span style={{
                            background: isActive ? '#ea580c' : '#f1f5f9',
                            color: isActive ? '#ffffff' : '#64748b',
                            borderRadius: '8px',
                            padding: '1px 6px',
                            fontSize: '0.72rem',
                            fontWeight: 700
                          }}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ position: 'relative', minWidth: '260px', flex: '1 1 260px', maxWidth: '420px' }}>
                    <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
                    <input
                      type="text"
                      value={leadSearchTerm}
                      onChange={e => setLeadSearchTerm(e.target.value)}
                      placeholder="Search by name, phone, city, stove..."
                      style={{
                        width: '100%',
                        padding: '0.6rem 1rem 0.6rem 2.5rem',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.88rem',
                        background: '#ffffff'
                      }}
                    />
                  </div>
                </div>

                {/* Inquiries Table */}
                <div className="admin-card-glass" style={{ padding: '0', borderRadius: '16px', overflow: 'hidden' }}>
                  {filteredLeads.length > 0 ? (
                    <div className="admin-table-wrapper" style={{ margin: 0 }}>
                      <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                            <th style={{ padding: '0.9rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Customer</th>
                            <th style={{ padding: '0.9rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Purpose</th>
                            <th style={{ padding: '0.9rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Requested Stove & Fuel</th>
                            <th style={{ padding: '0.9rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Capacity & Location</th>
                            <th style={{ padding: '0.9rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Date</th>
                            <th style={{ padding: '0.9rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Status</th>
                            <th style={{ padding: '0.9rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: '#475569', textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredLeads.map((lead) => {
                            const purposeStyle = getPurposeColor(lead.purpose);
                            const leadStatus = lead.status || 'New';
                            return (
                              <tr
                                key={lead._id || lead.id}
                                style={{
                                  borderBottom: '1px solid #f1f5f9',
                                  transition: 'background 0.15s ease'
                                }}
                              >
                                {/* Customer */}
                                <td style={{ padding: '1rem' }}>
                                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>
                                    {lead.name}
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#16a34a', fontSize: '0.82rem', fontWeight: 600, marginTop: '2px' }}>
                                    <i className="fa-brands fa-whatsapp"></i>
                                    <span>{lead.whatsapp || lead.phone || '—'}</span>
                                  </div>
                                  {lead.email && (
                                    <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '1px' }}>
                                      {lead.email}
                                    </div>
                                  )}
                                </td>

                                {/* Purpose */}
                                <td style={{ padding: '1rem' }}>
                                  <span style={{
                                    display: 'inline-block',
                                    background: purposeStyle.bg,
                                    color: purposeStyle.text,
                                    border: `1px solid ${purposeStyle.border}`,
                                    borderRadius: '8px',
                                    padding: '3px 8px',
                                    fontSize: '0.8rem',
                                    fontWeight: 700
                                  }}>
                                    {lead.purpose || 'Commercial'}
                                  </span>
                                </td>

                                {/* Stove Model & Fuel */}
                                <td style={{ padding: '1rem' }}>
                                  <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.88rem' }}>
                                    {lead.stoveModel || 'Rocket Stove'}
                                  </div>
                                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#f1f5f9', color: '#475569', borderRadius: '6px', padding: '2px 6px', fontSize: '0.76rem', marginTop: '3px' }}>
                                    <i className="fa-solid fa-fire" style={{ color: '#ea580c', fontSize: '0.7rem' }}></i>
                                    <span>{lead.fuelType || 'Biomass'}</span>
                                  </div>
                                </td>

                                {/* Capacity & Location */}
                                <td style={{ padding: '1rem' }}>
                                  <div style={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: 600 }}>
                                    {lead.capacity || 'Commercial'}
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#64748b', fontSize: '0.8rem', marginTop: '2px' }}>
                                    <i className="fa-solid fa-location-dot" style={{ color: '#ef4444', fontSize: '0.75rem' }}></i>
                                    <span>{lead.location || 'Tamil Nadu'}</span>
                                  </div>
                                </td>

                                {/* Date */}
                                <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                                  {new Date(lead.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                    {new Date(lead.createdAt || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </td>

                                {/* Status Selector */}
                                <td style={{ padding: '1rem' }}>
                                  <select
                                    value={leadStatus}
                                    onChange={(e) => onUpdateLeadStatus && onUpdateLeadStatus(lead._id || lead.id, e.target.value, lead.adminNotes)}
                                    style={{
                                      padding: '0.35rem 0.65rem',
                                      borderRadius: '8px',
                                      fontWeight: 700,
                                      fontSize: '0.8rem',
                                      cursor: 'pointer',
                                      border: '1.5px solid',
                                      borderColor: leadStatus === 'Converted' ? '#10B981' : leadStatus === 'New' ? '#EF4444' : leadStatus === 'Contacted' ? '#3B82F6' : leadStatus === 'In Discussion' ? '#8B5CF6' : '#64748B',
                                      background: leadStatus === 'Converted' ? '#ECFDF5' : leadStatus === 'New' ? '#FEF2F2' : leadStatus === 'Contacted' ? '#EFF6FF' : leadStatus === 'In Discussion' ? '#F5F3FF' : '#F8FAFC',
                                      color: leadStatus === 'Converted' ? '#047857' : leadStatus === 'New' ? '#B91C1C' : leadStatus === 'Contacted' ? '#1D4ED8' : leadStatus === 'In Discussion' ? '#6D28D9' : '#475569'
                                    }}
                                  >
                                    <option value="New">🔴 New</option>
                                    <option value="Contacted">🔵 Contacted</option>
                                    <option value="In Discussion">🟣 In Discussion</option>
                                    <option value="Converted">🟢 Converted</option>
                                    <option value="Closed">⚪ Closed</option>
                                  </select>
                                </td>

                                {/* Actions */}
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                  <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                                    <a
                                      href={getWhatsAppLink(lead)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="admin-btn"
                                      title="Chat on WhatsApp"
                                      style={{
                                        background: '#25D366',
                                        color: '#fff',
                                        padding: '0.4rem 0.65rem',
                                        borderRadius: '8px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.3rem',
                                        fontSize: '0.78rem',
                                        fontWeight: 700,
                                        textDecoration: 'none'
                                      }}
                                    >
                                      <i className="fa-brands fa-whatsapp"></i> WhatsApp
                                    </a>

                                    <a
                                      href={`tel:${lead.whatsapp || lead.phone}`}
                                      className="admin-btn"
                                      title="Call Customer"
                                      style={{
                                        background: '#3B82F6',
                                        color: '#fff',
                                        padding: '0.4rem 0.6rem',
                                        borderRadius: '8px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.3rem',
                                        fontSize: '0.78rem',
                                        fontWeight: 700,
                                        textDecoration: 'none'
                                      }}
                                    >
                                      <i className="fa-solid fa-phone"></i>
                                    </a>

                                    <button
                                      type="button"
                                      className="admin-btn"
                                      onClick={() => {
                                        setSelectedLead(lead);
                                        setLeadAdminNotesInput(lead.adminNotes || '');
                                      }}
                                      title="View Full Details"
                                      style={{
                                        background: '#F1F5F9',
                                        color: '#334155',
                                        padding: '0.4rem 0.6rem',
                                        borderRadius: '8px',
                                        border: '1px solid #CBD5E1',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      <i className="fa-regular fa-eye"></i>
                                    </button>

                                    <button
                                      type="button"
                                      className="admin-btn"
                                      onClick={() => {
                                        if (window.confirm(`Delete inquiry from ${lead.name}?`)) {
                                          onDeleteLead && onDeleteLead(lead._id || lead.id);
                                        }
                                      }}
                                      title="Delete Inquiry"
                                      style={{
                                        background: '#FEE2E2',
                                        color: '#DC2626',
                                        padding: '0.4rem 0.6rem',
                                        borderRadius: '8px',
                                        border: '1px solid #FECACA',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      <i className="fa-regular fa-trash-can"></i>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: '#64748b' }}>
                      <div style={{ fontSize: '2.5rem', color: '#cbd5e1', marginBottom: '0.75rem' }}>
                        <i className="fa-solid fa-inbox"></i>
                      </div>
                      <h4 style={{ color: '#1e293b', marginBottom: '0.4rem' }}>No Enquiries Found</h4>
                      <p style={{ margin: 0, fontSize: '0.9rem' }}>
                        {leadSearchTerm ? 'No inquiries matched your search filter.' : 'Customer stove inquiries will appear here automatically when submitted.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* View Details Modal */}
                {selectedLead && (
                  <div className="modal-overlay active" style={{ zIndex: 9999 }}>
                    <div className="modal-content" style={{ maxWidth: '640px', width: '95%', borderRadius: '20px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                        <div>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ff7a00', textTransform: 'uppercase' }}>Inquiry Details</span>
                          <h3 style={{ margin: '0.2rem 0 0', color: '#0f172a', fontSize: '1.35rem' }}>{selectedLead.name}</h3>
                        </div>
                        <button
                          type="button"
                          className="close-modal"
                          onClick={() => setSelectedLead(null)}
                          style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          &times;
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
                        <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '10px' }}>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>CONTACT NUMBER</span>
                          <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px', fontSize: '0.95rem' }}>
                            {selectedLead.whatsapp || selectedLead.phone || '—'}
                          </div>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '10px' }}>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>LOCATION / CITY</span>
                          <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px', fontSize: '0.95rem' }}>
                            {selectedLead.location || 'Tamil Nadu'}
                          </div>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '10px' }}>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>PURPOSE OF USE</span>
                          <div style={{ fontWeight: 700, color: '#2563eb', marginTop: '2px', fontSize: '0.95rem' }}>
                            {selectedLead.purpose || 'Commercial Kitchen'}
                          </div>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '10px' }}>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>STOVE MODEL</span>
                          <div style={{ fontWeight: 700, color: '#ea580c', marginTop: '2px', fontSize: '0.95rem' }}>
                            {selectedLead.stoveModel || 'Rocket Stove'}
                          </div>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '10px' }}>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>FUEL PREFERENCE</span>
                          <div style={{ fontWeight: 700, color: '#16a34a', marginTop: '2px', fontSize: '0.95rem' }}>
                            {selectedLead.fuelType || 'Wood & Biomass'}
                          </div>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '10px' }}>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>COOKING CAPACITY</span>
                          <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px', fontSize: '0.95rem' }}>
                            {selectedLead.capacity || 'Commercial'}
                          </div>
                        </div>
                      </div>

                      {/* Customer Notes */}
                      {selectedLead.notes && (
                        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', padding: '0.85rem 1rem', borderRadius: '10px', marginBottom: '1.25rem' }}>
                          <span style={{ fontSize: '0.75rem', color: '#ea580c', fontWeight: 700 }}>CUSTOMER SPECIAL REQUIREMENTS</span>
                          <p style={{ margin: '0.35rem 0 0', color: '#7c2d12', fontSize: '0.9rem', lineHeight: 1.5 }}>
                            {selectedLead.notes}
                          </p>
                        </div>
                      )}

                      {/* Admin Internal Notes Form */}
                      <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: '0.4rem' }}>
                          Internal Admin Follow-up Notes:
                        </label>
                        <textarea
                          rows={3}
                          value={leadAdminNotesInput}
                          onChange={(e) => setLeadAdminNotesInput(e.target.value)}
                          placeholder="e.g. Called customer on March 17. Sent 2-burner catalog PDF. Customer prefers delivery to Madurai hotel."
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '10px',
                            border: '1.5px solid #cbd5e1',
                            fontSize: '0.9rem',
                            resize: 'vertical'
                          }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.4rem' }}>
                          <button
                            type="button"
                            className="admin-btn"
                            onClick={() => {
                              onUpdateLeadStatus && onUpdateLeadStatus(selectedLead._id || selectedLead.id, selectedLead.status, leadAdminNotesInput);
                              setSelectedLead(prev => ({ ...prev, adminNotes: leadAdminNotesInput }));
                              alert('Follow-up notes saved!');
                            }}
                            style={{
                              background: '#15803D',
                              color: '#fff',
                              borderRadius: '8px',
                              padding: '0.45rem 1rem',
                              fontWeight: 700,
                              fontSize: '0.82rem',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            Save Notes
                          </button>
                        </div>
                      </div>

                      {/* Quick Contact & Status Bar */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <a
                            href={getWhatsAppLink(selectedLead)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              background: '#25D366',
                              color: '#fff',
                              borderRadius: '10px',
                              padding: '0.6rem 1.1rem',
                              fontWeight: 700,
                              fontSize: '0.88rem',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem'
                            }}
                          >
                            <i className="fa-brands fa-whatsapp"></i> Chat on WhatsApp
                          </a>
                          <a
                            href={`tel:${selectedLead.whatsapp || selectedLead.phone}`}
                            style={{
                              background: '#3B82F6',
                              color: '#fff',
                              borderRadius: '10px',
                              padding: '0.6rem 1.1rem',
                              fontWeight: 700,
                              fontSize: '0.88rem',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem'
                            }}
                          >
                            <i className="fa-solid fa-phone"></i> Call Customer
                          </a>
                        </div>

                        <button
                          type="button"
                          className="admin-btn"
                          onClick={() => setSelectedLead(null)}
                          style={{
                            background: '#f1f5f9',
                            color: '#475569',
                            borderRadius: '10px',
                            padding: '0.6rem 1.25rem',
                            fontWeight: 600,
                            fontSize: '0.88rem',
                            border: '1px solid #cbd5e1',
                            cursor: 'pointer'
                          }}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {activeTab === 'Coupons' && (
            <div className="admin-coupons-management" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
              <div className="admin-card-glass">
                <h3>{editingCouponId ? 'Edit Coupon' : 'Add New Coupon'}</h3>
                <form onSubmit={handleCreateCoupon}>
                  <div className="admin-form-group" style={{ marginBottom: '1rem' }}>
                    <label htmlFor="couponCode">Coupon Code</label>
                    <input 
                      id="couponCode"
                      type="text" 
                      placeholder="e.g. STOVE15" 
                      required 
                      value={newCoupon.code}
                      onChange={(e) => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase().trim()})}
                    />
                  </div>
                  <div className="admin-form-group" style={{ marginBottom: '1rem' }}>
                    <label htmlFor="couponDiscountType">Discount Type</label>
                    <select 
                      id="couponDiscountType"
                      value={newCoupon.discountType}
                      onChange={(e) => setNewCoupon({...newCoupon, discountType: e.target.value})}
                    >
                      <option value="Percentage">Percentage (%)</option>
                      <option value="Fixed">Fixed Amount (₹)</option>
                    </select>
                  </div>
                  <div className="admin-form-group" style={{ marginBottom: '1rem' }}>
                    <label htmlFor="couponDiscountValue">Discount Value</label>
                    <input 
                      id="couponDiscountValue"
                      type="number" 
                      placeholder="e.g. 15" 
                      required 
                      min="1"
                      value={newCoupon.discountValue}
                      onChange={(e) => setNewCoupon({...newCoupon, discountValue: e.target.value})}
                    />
                  </div>
                  <div className="admin-form-group" style={{ marginBottom: '1rem' }}>
                    <label htmlFor="couponLinkedProduct">Linked Product</label>
                    <select 
                      id="couponLinkedProduct"
                      value={newCoupon.linkedProduct}
                      onChange={(e) => setNewCoupon({...newCoupon, linkedProduct: e.target.value})}
                    >
                      <option value="">None / Apply to None (Manual Only)</option>
                      {products.map(p => (
                        <option key={p._id || p.id} value={p._id || p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="admin-form-group" style={{ marginBottom: '1.5rem' }}>
                    <label htmlFor="couponExpiry">Expiry Date</label>
                    <input 
                      id="couponExpiry"
                      type="date" 
                      required 
                      value={newCoupon.expiryDate}
                      onChange={(e) => setNewCoupon({...newCoupon, expiryDate: e.target.value})}
                    />
                  </div>
                  {editingCouponId ? (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button type="submit" className="admin-btn admin-btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                        Update Coupon
                      </button>
                      <button type="button" onClick={cancelEditCoupon} className="admin-btn" style={{ flex: 1, justifyContent: 'center', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button type="submit" className="admin-btn admin-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                      Create Coupon Code
                    </button>
                  )}
                </form>
              </div>

              <div className="admin-card-glass">
                <h3>Active Store Coupons</h3>
                {coupons.length > 0 ? (
                  <div className="admin-coupon-grid">
                    {coupons.map(c => {
                      const linkedProd = products.find(p => (p._id || p.id) === c.linkedProduct);
                      return (
                        <div key={c._id || c.code} className="admin-coupon-card">
                          <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '6px' }}>
                            <button 
                              onClick={() => startEditCoupon(c)} 
                              title="Edit Coupon"
                              style={{ border: 'none', background: '#eff6ff', color: '#1d4ed8', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}
                            >
                              <i className="fa-solid fa-pen" style={{ fontSize: '0.75rem' }}></i>
                            </button>
                            <button 
                              onClick={() => onDeleteCoupon(c._id || c.id)} 
                              title="Delete Coupon"
                              style={{ border: 'none', background: '#fef2f2', color: '#dc2626', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}
                            >
                              <i className="fa-solid fa-trash" style={{ fontSize: '0.75rem' }}></i>
                            </button>
                          </div>
                          <h4>{c.code}</h4>
                          <div className="discount-val">
                            {c.discountValue}{c.discountType === 'Percentage' ? '%' : '₹'} OFF
                          </div>
                          {linkedProd && (
                            <div style={{ fontSize: '0.78rem', color: '#4f46e5', fontWeight: 600, marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80%' }}>
                              Linked: {linkedProd.name}
                            </div>
                          )}
                          <div className="expiry">
                            Expires: {new Date(c.expiryDate).toLocaleDateString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="admin-empty-state">No active discount coupon codes available.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'Support' && (
            <div className="admin-support-management">
              <div className="admin-card-glass">
                <h3>Customer Support Query Tickets</h3>
                {supportQueries.length > 0 ? (
                  <div className="admin-ticket-list">
                    {supportQueries.map(q => (
                      <div key={q._id || q.id} className="admin-ticket-card" style={{ border: (q.status === 'Resolved' || q.status === 'Responded') ? '1px solid #bbf7d0' : '1px solid #fef3c7' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: '700', color: '#0f172a' }}>{q.subject}</span>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{new Date(q.createdAt).toLocaleString()}</span>
                        </div>
                        <p style={{ fontSize: '0.88rem', color: '#334155', marginBottom: '1rem', lineHeight: '1.4' }}>{q.message}</p>
                        
                        {q.adminResponse && (
                          <div style={{ marginTop: '0.5rem', marginBottom: '1rem', padding: '1rem', background: '#f0fdf4', borderRadius: '8px', borderLeft: '4px solid #16a34a' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#15803d', fontWeight: 'bold', marginBottom: '4px' }}>
                              <span><i className="fa-solid fa-reply"></i> Response Sent</span>
                              {q.respondedAt && <span>{new Date(q.respondedAt).toLocaleString()}</span>}
                            </div>
                            <p style={{ fontSize: '0.85rem', color: '#14532d', margin: 0, whiteSpace: 'pre-line' }}>{q.adminResponse}</p>
                          </div>
                        )}

                        {q.status !== 'Resolved' && q.status !== 'Responded' && (
                          <div style={{ marginTop: '0.5rem', marginBottom: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '6px', display: 'block' }}>
                              <i className="fa-solid fa-reply"></i> Write Response to {q.customerName}
                            </label>
                            <textarea
                              placeholder="Type your response here..."
                              style={{ width: '100%', minHeight: '85px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0.5rem 0.75rem', fontSize: '0.85rem', outline: 'none', resize: 'vertical', display: 'block', marginBottom: '8px' }}
                              value={supportReplies[q._id || q.id] || ''}
                              onChange={(e) => setSupportReplies({ ...supportReplies, [q._id || q.id]: e.target.value })}
                            />
                            <button
                              type="button"
                              className="admin-btn admin-btn-primary"
                              style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
                              onClick={async () => {
                                const responseText = supportReplies[q._id || q.id];
                                if (!responseText || !responseText.trim()) {
                                  alert('Please enter a response message.');
                                  return;
                                }
                                await onRespondToSupport(q._id || q.id, responseText);
                                setSupportReplies(prev => ({ ...prev, [q._id || q.id]: '' }));
                              }}
                            >
                              Send Response & Mark as Responded
                            </button>
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            Raised by: <strong style={{ color: '#0f172a' }}>{q.customerName}</strong> ({q.email})
                          </span>
                          <span className={`status-pill ${(q.status === 'Resolved' || q.status === 'Responded') ? 'active' : 'processing'}`}>
                            {q.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="admin-empty-state">No support query tickets found.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'Activity Logs' && (
            <div className="admin-logs-management">
              <div className="admin-card-glass">
                <h3>Administrative Activity Logs</h3>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {activityLogs.length > 0 ? activityLogs.map(l => (
                    <div key={l._id} className="admin-log-item">
                      <span>
                        <strong style={{ color: '#4f46e5' }}>{l.action}</strong>: <span style={{ color: '#334155' }}>{l.details}</span>
                      </span>
                      <span className="time">{new Date(l.timestamp).toLocaleString()}</span>
                    </div>
                  )) : (
                    <div className="admin-empty-state">No administrative activity logged yet.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Inventory' && (
            <div className="admin-inventory-management">
              <div className="admin-card-glass">
                <h3>Inventory Overview</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', borderRadius: '12px', padding: '1rem', border: '1px solid #bfdbfe' }}>
                    <div style={{ color: '#1d4ed8', fontSize: '0.9rem', fontWeight: 600 }}>Total Products</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0f172a', marginTop: '0.35rem' }}>{inventoryStats.totalProducts}</div>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', borderRadius: '12px', padding: '1rem', border: '1px solid #bbf7d0' }}>
                    <div style={{ color: '#15803d', fontSize: '0.9rem', fontWeight: 600 }}>Total Stock Units</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0f172a', marginTop: '0.35rem' }}>{inventoryStats.totalStockUnits}</div>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', borderRadius: '12px', padding: '1rem', border: '1px solid #fecaca' }}>
                    <div style={{ color: '#b91c1c', fontSize: '0.9rem', fontWeight: 600 }}>Out of Stock</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0f172a', marginTop: '0.35rem' }}>{inventoryStats.outOfStock}</div>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', borderRadius: '12px', padding: '1rem', border: '1px solid #fde68a' }}>
                    <div style={{ color: '#b45309', fontSize: '0.9rem', fontWeight: 600 }}>Low Stock</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0f172a', marginTop: '0.35rem' }}>{inventoryStats.lowStock}</div>
                  </div>
                </div>

                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Category</th>
                        <th>Stock</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryItems.length > 0 ? inventoryItems.map((product) => {
                        const productId = product._id || product.id;
                        const stock = Number(product.stockValue) || 0;
                        const draftValue = inventoryStockDrafts[productId] ?? String(stock);
                        const status = stock <= 0 ? 'Out of Stock' : stock < 10 ? 'Low Stock' : 'In Stock';
                        const statusClass = stock <= 0 ? 'blocked' : stock < 10 ? 'processing' : 'active';
                        return (
                          <tr key={productId}>
                            <td style={{ fontWeight: '600', color: '#0f172a' }}>{product.name}</td>
                            <td>{(product.category || '').replace(/-/g, ' ')}</td>
                            <td>
                              <input
                                type="number"
                                min="0"
                                value={draftValue}
                                onChange={(e) => setInventoryStockDrafts(prev => ({ ...prev, [productId]: e.target.value }))}
                                onBlur={() => handleInventoryStockSave(productId, draftValue)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleInventoryStockSave(productId, draftValue);
                                  }
                                }}
                                style={{ width: '90px', padding: '0.4rem 0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                              />
                            </td>
                            <td>
                              <span className={`status-pill ${statusClass}`}>{status}</span>
                            </td>
                          </tr>
                        );
                      }) : (
                        <tr>
                          <td colSpan="4">
                            <div className="admin-empty-state">No inventory data available yet.</div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Customers' && (
            <div className="admin-customers-management">
              <div className="admin-card-glass">
                <h3>Registered User Directory</h3>
                {users.length > 0 ? (
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Customer</th>
                          <th>Contact</th>
                          <th>Activity Details</th>
                          <th>Delivery Address</th>
                          <th>Joined</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(user => {
                          const userWishlist = getWishlistItems(user);
                          const userCart = getCartItems(user);
                          const userOrdersList = getUserOrders(user);
                          const isExpanded = expandedUserId === (user._id || user.id);

                          return (
                            <React.Fragment key={user._id || user.id}>
                              <tr 
                                style={{ cursor: 'pointer', background: isExpanded ? '#f1f5f9' : 'transparent' }}
                                onClick={() => setExpandedUserId(isExpanded ? null : (user._id || user.id))}
                              >
                                <td style={{ fontWeight: '600', color: '#0f172a' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <i className={`fa-solid ${isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'}`} style={{ fontSize: '0.75rem', color: '#64748b' }}></i>
                                    {user.name}
                                  </div>
                                </td>
                                <td style={{ color: '#334155' }}>{getCustomerContact(user)}</td>
                                <td onClick={(e) => e.stopPropagation()}>
                                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', background: '#fef2f2', color: '#ef4444', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                                      <i className="fa-solid fa-heart"></i> {userWishlist.length} Wishlist
                                    </span>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', background: '#eff6ff', color: '#3b82f6', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                                      <i className="fa-solid fa-cart-shopping"></i> {userCart.length} Cart
                                    </span>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', background: '#ecfdf5', color: '#10b981', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                                      <i className="fa-solid fa-box"></i> {userOrdersList.length} Orders
                                    </span>
                                  </div>
                                </td>
                                <td style={{ color: '#334155', minWidth: '220px' }}>{getCustomerAddress(user)}</td>
                                <td style={{ color: '#64748b' }}>{new Date(user.createdAt).toLocaleDateString()}</td>
                                <td onClick={(e) => e.stopPropagation()}>
                                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button 
                                      onClick={() => setExpandedUserId(isExpanded ? null : (user._id || user.id))}
                                      className="admin-btn"
                                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', background: '#f1f5f9', color: '#1e293b', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                                    >
                                      {isExpanded ? 'Hide Details' : 'View Details'}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr onClick={(e) => e.stopPropagation()}>
                                  <td colSpan="6" style={{ background: '#f8fafc', padding: '1.25rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem' }}>
                                      {/* Wishlist */}
                                      <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                        <h4 style={{ margin: '0 0 0.75rem 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600 }}>
                                          <i className="fa-solid fa-heart" style={{ color: '#ef4444' }}></i>
                                          Wishlist Products ({userWishlist.length})
                                        </h4>
                                        {userWishlist.length > 0 ? (
                                          <ul style={{ paddingLeft: '1.25rem', margin: 0, fontSize: '0.8rem', color: '#475569' }}>
                                            {userWishlist.map(p => (
                                              <li key={p._id || p.id} style={{ marginBottom: '4px' }}>
                                                {p.name} - <span style={{ fontWeight: 600, color: '#0f172a' }}>₹{p.price}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        ) : (
                                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>No items in wishlist</span>
                                        )}
                                      </div>

                                      {/* Cart */}
                                      <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                        <h4 style={{ margin: '0 0 0.75rem 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600 }}>
                                          <i className="fa-solid fa-cart-shopping" style={{ color: '#3b82f6' }}></i>
                                          Active Cart Products ({userCart.length})
                                        </h4>
                                        {userCart.length > 0 ? (
                                          <ul style={{ paddingLeft: '1.25rem', margin: 0, fontSize: '0.8rem', color: '#475569' }}>
                                            {userCart.map(p => (
                                              <li key={p._id || p.id} style={{ marginBottom: '4px' }}>
                                                {p.name} - <span style={{ fontWeight: 600, color: '#0f172a' }}>₹{p.price}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        ) : (
                                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Cart is empty</span>
                                        )}
                                      </div>

                                      {/* Order History */}
                                      <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                        <h4 style={{ margin: '0 0 0.75rem 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600 }}>
                                          <i className="fa-solid fa-box" style={{ color: '#10b981' }}></i>
                                          Order History ({userOrdersList.length})
                                        </h4>
                                        {userOrdersList.length > 0 ? (
                                          <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                                            {userOrdersList.map(o => (
                                              <div key={o._id || o.id} style={{ fontSize: '0.8rem', borderBottom: '1px solid #f1f5f9', padding: '6px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                  <span style={{ fontWeight: 600, color: '#334155' }}>{o.orderId || 'ORD'}</span>
                                                  <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '6px' }}>{new Date(o.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                  <span style={{ fontWeight: 700, color: '#0f172a' }}>₹{o.grandTotal || o.totalAmount || o.total}</span>
                                                  <span className={`status-pill ${String(o.status).toLowerCase() === 'delivered' ? 'active' : 'processing'}`} style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
                                                    {o.status}
                                                  </span>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>No order history</span>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="admin-empty-state">No customers registered yet.</div>
                )}
              </div>

              <div className="admin-card-glass" style={{ marginTop: '1.25rem' }}>
                <h3>Customer Requests & Activity</h3>
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Customer</th>
                        <th>Details</th>
                        <th>Status</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerActivityFeed.length > 0 ? customerActivityFeed.map((item) => (
                        <tr key={item.id}>
                          <td style={{ fontWeight: 600, color: '#0f172a' }}>{item.type}</td>
                          <td>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.customerName}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.customerEmail}</div>
                          </td>
                          <td style={{ color: '#334155' }}>{item.description}</td>
                          <td>
                            <span className={`status-pill ${item.status === 'blocked' ? 'blocked' : item.status === 'Resolved' || item.status === 'Delivered' || item.status === 'active' || item.status === 'Approved' ? 'active' : 'processing'}`}>
                              {item.status}
                            </span>
                          </td>
                          <td style={{ color: '#64748b', whiteSpace: 'nowrap' }}>{item.timestamp ? new Date(item.timestamp).toLocaleString() : '—'}</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="5">
                            <div className="admin-empty-state">No customer requests or activity available yet.</div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;

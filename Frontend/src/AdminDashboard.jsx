import React, { useState, useEffect } from 'react';
import './index.css';

const AdminDashboard = ({ 
  onLogout, 
  products, 
  onAddProduct, 
  onDeleteProduct,
  onUpdateProduct,
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
  const [newHeroBanner, setNewHeroBanner] = useState({ image: '', caption: '' });
  const [supportReplies, setSupportReplies] = useState({});
  const [inventoryStockDrafts, setInventoryStockDrafts] = useState({});

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
    description: '',
    specifications: '',
    stock: 0,
    category: categories[0]?.slug || categories[0]?.name || 'engraining-products', 
    icon: 'fa-box',
    isNewArrival: false,
    images: [] 
  });

  // --- Edit Product State ---
  const [editingProductId, setEditingProductId] = useState(null);
  const [editProduct, setEditProduct] = useState({
    name: '', price: '', description: '', specifications: '', stock: 0, category: '', isNewArrival: false, images: []
  });
  const [replaceEditImages, setReplaceEditImages] = useState(false);

  const startEditProduct = (p) => {
    setEditingProductId(p._id || p.id);
    setEditProduct({
      name: p.name || '',
      price: p.price ? p.price.toString().replace(/[₹,]/g, '') : '',
      description: p.description || '',
      specifications: p.specifications || '',
      stock: typeof p.stock === 'number' ? p.stock : 0,
      category: p.category || categories[0]?.slug || categories[0]?.name || '',
      isNewArrival: p.isNewArrival || false,
      images: p.images || []
    });
    setReplaceEditImages(false);
    // Scroll to top of products section
    setTimeout(() => document.getElementById('edit-product-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const cancelEditProduct = () => {
    setEditingProductId(null);
    setEditProduct({ name: '', price: '', category: '', isNewArrival: false, images: [] });
    setReplaceEditImages(false);
  };

  const handleEditFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    if (files.length > 5) {
      alert('Maximum 5 images allowed per product.');
      return;
    }

    const maxAllowed = replaceEditImages ? 5 : 5 - editProduct.images.length;
    if (files.length > maxAllowed) {
      alert('Maximum 5 images allowed per product.');
      return;
    }

    setIsImageProcessing(true);
    const fileReaders = files.map(file => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(file);
    }));

    Promise.all(fileReaders).then(results => {
      setEditProduct(prev => ({
        ...prev,
        images: replaceEditImages ? results : [...prev.images, ...results]
      }));
    }).finally(() => setIsImageProcessing(false));
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
    { name: 'Hero Banners', icon: 'fa-images' },
    { name: 'All Products', icon: 'fa-boxes-stacked' },
    { name: 'Categories', icon: 'fa-list-ul' },
    { name: 'Inventory', icon: 'fa-warehouse' },
    { name: 'Customers', icon: 'fa-users' },
    { name: 'View Product', icon: 'fa-eye' },
    { name: 'Orders', icon: 'fa-cart-shopping' },
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
      category: String(newProduct.category || '').trim(),
      description: String(newProduct.description || '').trim(),
      specifications: String(newProduct.specifications || '').trim(),
      stock: Number(newProduct.stock || 0),
      icon: String(newProduct.icon || 'fa-box').trim(),
      isNewArrival: Boolean(newProduct.isNewArrival),
      images: (Array.isArray(newProduct.images) ? newProduct.images : []).map((img) => {
        if (typeof img !== 'string' || !img) return img;
        if (img.startsWith('data:')) return img;
        const separator = img.includes('?') ? '&' : '?';
        return `${img}${separator}t=${Date.now()}`;
      })
    };

    try {
      const success = await onAddProduct(payload);
      if (success) {
        alert('Product added successfully!');
        setNewProduct({ name: '', price: '', description: '', specifications: '', stock: 0, category: categories[0]?.slug || categories[0]?.name || 'stoves', icon: 'fa-box', isNewArrival: false, images: [] });
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
    if (files.length + newProduct.images.length > 5) {
      alert('Maximum 5 images allowed per product.');
      return;
    }

    setIsImageProcessing(true);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct(prev => ({
          ...prev,
          images: [...prev.images, reader.result]
        }));
      };
      reader.readAsDataURL(file);
    });

    setTimeout(() => setIsImageProcessing(false), 500);
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
            </button>
          ))}
        </nav>
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
                      <div className="admin-form-group">
                        <label htmlFor="editProductPrice">Price (₹)</label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <span style={{ position: 'absolute', left: '1rem', color: 'var(--primary-color)', fontWeight: 'bold' }}>₹</span>
                          <input
                            id="editProductPrice"
                            type="text"
                            placeholder="e.g. 1499"
                            required
                            maxLength="6"
                            value={editProduct.price}
                            onChange={(e) => setEditProduct({ ...editProduct, price: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                            style={{ paddingLeft: '2rem', width: '100%' }}
                          />
                        </div>
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
                      <div>Product Images (Max 5)</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <input
                            type="checkbox"
                            id="replaceEditImages"
                            checked={replaceEditImages}
                            onChange={(e) => setReplaceEditImages(e.target.checked)}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                          />
                          <label htmlFor="replaceEditImages" style={{ cursor: 'pointer', fontSize: '0.95rem' }}>
                            Replace existing images with uploaded files
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
                          {(replaceEditImages || editProduct.images.length < 5) && (
                            <label htmlFor="editProductImageUpload" style={{ width: '80px', height: '80px', borderRadius: '8px', border: '2px dashed var(--primary-light)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}>
                              <i className="fa-solid fa-plus" style={{ color: 'var(--primary-color)', fontSize: '1.2rem' }}></i>
                              <span style={{ fontSize: '0.65rem', color: 'var(--primary-color)', marginTop: '4px' }}>Upload Images</span>
                              <input id="editProductImageUpload" name="editProductImageUpload" type="file" accept="image/*" multiple onChange={handleEditFileChange} style={{ display: 'none' }} />
                            </label>
                          )}
                        </div>
                      </div>
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
                    <div className="admin-form-group">
                      <label htmlFor="newProductPrice">Price (₹)</label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <span style={{ position: 'absolute', left: '1rem', color: '#818cf8', fontWeight: 'bold' }}>₹</span>
                        <input 
                          id="newProductPrice"
                          type="text" 
                          placeholder="e.g. 1499" 
                          required 
                          maxLength="6"
                          value={newProduct.price}
                          onChange={(e) => setNewProduct({...newProduct, price: e.target.value.replace(/\D/g, '').slice(0, 6)})}
                          style={{ paddingLeft: '2rem', width: '100%' }}
                        />
                      </div>
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
                    <div>Product Images (Upload - Max 5)</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem' }}>
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
                      {newProduct.images.length < 5 && (
                        <label htmlFor="newProductImageUpload" style={{ 
                          width: '80px', height: '80px', borderRadius: '8px', border: '2px dashed rgba(0,0,0,0.1)', 
                          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', 
                          cursor: 'pointer', transition: 'var(--transition)' 
                        }} className="upload-btn">
                          <i className="fa-solid fa-plus" style={{ color: '#64748b', fontSize: '1.2rem' }}></i>
                          <span style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '4px' }}>Add Image</span>
                          <input id="newProductImageUpload" name="newProductImageUpload" type="file" accept="image/*" multiple onChange={handleFileChange} style={{ display: 'none' }} />
                        </label>
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
                            <td>{(p.category || '').replace(/-/g, ' ')}</td>
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
                          const productCategory = (product.category || '').toString().toLowerCase();
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

          {activeTab === 'Hero Banners' && (
            <div className="admin-banners-management" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
              <div className="admin-card-glass">
                <h3>Upload New Hero Banner</h3>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newHeroBanner.image) {
                    alert('Please select an image first.');
                    return;
                  }
                  await onAddHeroBanner(newHeroBanner);
                  setNewHeroBanner({ image: '', caption: '' });
                }}>
                  <div className="admin-form-group" style={{ marginBottom: '1.25rem' }}>
                    <label htmlFor="heroCaption">Caption / Text (Optional)</label>
                    <input 
                      id="heroCaption"
                      type="text" 
                      placeholder="e.g. Premium Sustainable Engineering"
                      value={newHeroBanner.caption}
                      onChange={(e) => setNewHeroBanner({...newHeroBanner, caption: e.target.value})}
                    />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Banner Image</label>
                    <div style={{ 
                      width: '100%', height: '180px', border: '2px dashed rgba(0,0,0,0.1)', 
                      borderRadius: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', 
                      alignItems: 'center', overflow: 'hidden', position: 'relative', background: '#f8fafc' 
                    }}>
                      {newHeroBanner.image ? (
                        <>
                          <img src={newHeroBanner.image} alt="New Banner Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          <button 
                            type="button" 
                            onClick={() => setNewHeroBanner({...newHeroBanner, image: ''})}
                            style={{ position: 'absolute', top: '10px', right: '10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            &times;
                          </button>
                        </>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '1rem' }}>
                          <i className="fa-solid fa-images" style={{ fontSize: '2.5rem', color: '#cbd5e1', marginBottom: '0.5rem' }}></i>
                          <p style={{ color: '#64748b', fontSize: '0.8rem' }}>No image selected</p>
                        </div>
                      )}
                    </div>
                    <input 
                      type="file" 
                      id="heroImageInput" 
                      accept="image/*" 
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setNewHeroBanner(prev => ({ ...prev, image: reader.result }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }} 
                      style={{ display: 'none' }} 
                    />
                    <label 
                      htmlFor="heroImageInput" 
                      className="admin-btn" 
                      style={{ 
                        justifyContent: 'center', background: '#ffffff', 
                        border: '1px solid #cbd5e1', color: '#334155', cursor: 'pointer' 
                      }}
                    >
                      {newHeroBanner.image ? 'Change Image' : 'Select Image'}
                    </label>
                  </div>
                  
                  <button type="submit" className="admin-btn admin-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                    <i className="fa-solid fa-cloud-arrow-up"></i> Upload Banner
                  </button>
                </form>
              </div>

              <div className="admin-card-glass">
                <h3>Current Hero Banners</h3>
                {heroBanners.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
                    {heroBanners.map((banner) => (
                      <div 
                        key={banner._id || banner.id} 
                        className="admin-banner-card"
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          background: 'white',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                      >
                        <div style={{ height: '140px', background: '#f8fafc', position: 'relative', overflow: 'hidden' }}>
                          <img src={banner.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button
                            onClick={() => onDeleteHeroBanner(banner._id || banner.id)}
                            style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              width: '28px',
                              height: '28px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                            title="Delete Banner"
                          >
                            <i className="fa-solid fa-trash" style={{ fontSize: '0.8rem' }}></i>
                          </button>
                        </div>
                        {banner.caption && (
                          <div style={{ padding: '0.75rem', fontSize: '0.85rem', fontWeight: 600, color: '#334155', borderTop: '1px solid #f1f5f9' }}>
                            {banner.caption}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="admin-empty-state">No hero banners uploaded yet. Showing fallback image.</div>
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
                          <th>Delivery Address</th>
                          <th>Joined</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(user => (
                          <tr key={user._id || user.id}>
                            <td style={{ fontWeight: '600', color: '#0f172a' }}>{user.name}</td>
                            <td style={{ color: '#334155' }}>{getCustomerContact(user)}</td>
                            <td style={{ color: '#334155', minWidth: '220px' }}>{getCustomerAddress(user)}</td>
                            <td style={{ color: '#64748b' }}>{new Date(user.createdAt).toLocaleDateString()}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button 
                                  onClick={() => onToggleBlockUser(user._id || user.id)}
                                  className={`admin-btn ${user.status === 'blocked' ? 'admin-btn-success' : 'admin-btn-danger'}`}
                                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                                >
                                  {user.status === 'blocked' ? 'Unblock' : 'Block'}
                                </button>
                                <button 
                                  onClick={() => onDeleteUser(user._id || user.id)}
                                  className="admin-btn admin-btn-danger"
                                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
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

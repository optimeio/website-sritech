import { useEffect, useMemo, useState } from 'react';

const DASHBOARD_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const DASHBOARD_BACKEND_URL = DASHBOARD_API_URL.replace(/\/api\/?$/, '');

const getDashboardInvoiceUrl = (order) => {
  if (!order) return '';
  const orderId = order.orderId || order._id || order.id || order.invoiceNumber;
  if (orderId) {
    return `${DASHBOARD_API_URL}/orders/${encodeURIComponent(orderId)}/invoice`;
  }
  const path = order.invoicePdfPath || order.invoiceUrl || order.invoiceLink || '';
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${DASHBOARD_BACKEND_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

const menuItems = [
  { key: 'overview', label: 'Dashboard', icon: 'fa-chart-pie' },
  { key: 'orders', label: 'My Orders', icon: 'fa-box' },
  { key: 'wishlist', label: 'Wishlist', icon: 'fa-heart' },
  { key: 'cart', label: 'My Cart', icon: 'fa-cart-shopping' },
  { key: 'coupons', label: 'Coupons & Rewards', icon: 'fa-ticket' },
  { key: 'notifications', label: 'Notifications', icon: 'fa-bell' },
  { key: 'returns', label: 'Returns & Refunds', icon: 'fa-rotate-left' },
  { key: 'support', label: 'Support Center', icon: 'fa-headset' },
  { key: 'logout', label: 'Logout', icon: 'fa-right-from-bracket' },
  { key: 'settings', label: 'Account Settings', icon: 'fa-gear' }
];

const orderStatusSteps = [
  'Ordered',
  'Packing',
  'On the way',
  'Delivered'
];

const defaultNotifications = [
  { id: 1, title: 'Order Update', body: 'Your order is packed and ready for dispatch.', unread: true, time: '2h ago' },
  { id: 2, title: 'Payment Success', body: 'Razorpay payment for your latest order was received.', unread: false, time: 'Yesterday' },
  { id: 3, title: 'New Offer', body: 'You have a 15% off coupon waiting for your next purchase.', unread: true, time: '3 days ago' }
];

function UserDashboard({
  isOpen,
  onClose,
  activeUser,
  orders = [],
  wishlistItems = [],
  cartItems = [],
  products = [],
  coupons = [],
  offers = [],
  notifications = [],
  onAddToCart,
  onUpdateCartQuantity,
  onRemoveFromCart,
  onBuyNow,
  onRemoveFromWishlist,
  onCheckout,
  onUpdateProfile,
  onSaveAddress,
  onDeleteAddress,
  onSetDefaultAddress,
  onSubmitReturnRequest,
  onRaiseSupport,
  onMarkNotificationsRead,
  onLogout,
  getProductFinalPrice,
  totalCartAmount,
  currency = '₹',
  onViewProduct
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const selectedOrder = useMemo(() => {
    if (!selectedOrderId || !Array.isArray(orders)) return null;
    return orders.find(order => (order._id || order.id) === selectedOrderId) || null;
  }, [orders, selectedOrderId]);
  const [searchOrder, setSearchOrder] = useState('');
  // `notifications` is provided by parent App; fall back to defaultNotifications when absent
  // local state removed so admin-published updates flow from App -> UserDashboard
  const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [addressDraft, setAddressDraft] = useState({ label: 'Home', name: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', zipCode: '', country: '', isDefault: false });
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [returnDraft, setReturnDraft] = useState({ orderId: '', productId: '', quantity: 1, reason: 'Damaged', description: '' });
  const [supportForm, setSupportForm] = useState({ subject: '', message: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  useEffect(() => {
    if (!activeUser) return;
    setProfileForm({
      name: activeUser.name || '',
      email: activeUser.email || '',
      phone: activeUser.phone || '',
      address: activeUser.address || ''
    });
  }, [activeUser]);

  useEffect(() => {
    if (!Array.isArray(orders) || orders.length === 0) {
      setSelectedOrderId(null);
      return;
    }

    const currentOrderId = selectedOrderId || null;
    const exists = currentOrderId && orders.some(order => (order._id || order.id) === currentOrderId);

    if (!exists) {
      const firstOrder = orders[0];
      const firstOrderId = firstOrder._id || firstOrder.id;
      setSelectedOrderId(firstOrderId);
      setReturnDraft(prev => ({ ...prev, orderId: firstOrderId, productId: firstOrder.items?.[0]?.product || '' }));
    }
  }, [orders, selectedOrderId]);

  useEffect(() => {
    if (!selectedOrder) return;
    setReturnDraft(prev => ({ ...prev, orderId: selectedOrder._id || selectedOrder.id, productId: selectedOrder.items?.[0]?.product || prev.productId || '' }));
  }, [selectedOrder]);

  const getOrderStatusLabel = (status) => {
    const normalized = String(status || '').trim().toLowerCase();
    if (['ordered', 'order placed', 'order-placed', 'placed', 'pending', 'processing', 'confirmed', 'confirmed order', 'approved'].includes(normalized)) return 'Ordered';
    if (['packed', 'packing', 'ready to ship'].includes(normalized)) return 'Packing';
    if (['shipped', 'dispatch', 'dispatched', 'out for shipment', 'in transit', 'out for delivery', 'out-for-delivery', 'delivery in progress', 'on the way'].includes(normalized)) return 'On the way';
    if (['delivered', 'complete', 'completed'].includes(normalized)) return 'Delivered';
    if (['cancelled', 'canceled', 'cancel', 'cancelled by user'].includes(normalized)) return 'Cancelled';
    if (['returned', 'return initiated', 'refund requested'].includes(normalized)) return 'Returned';
    return String(status || 'Pending').trim() || 'Pending';
  };

  const stats = useMemo(() => {
    const delivered = orders.filter(order => getOrderStatusLabel(order.status) === 'Delivered').length;
    const pending = orders.filter(order => !['Delivered', 'Cancelled', 'Returned'].includes(getOrderStatusLabel(order.status))).length;
    const rewardPoints = activeUser?.rewardPoints || 1250;
    const walletBalance = activeUser?.walletBalance || 3200;

    return {
      totalOrders: orders.length,
      pendingOrders: pending,
      deliveredOrders: delivered,
      wishlistItems: wishlistItems.length,
      cartItemsCount: Array.isArray(cartItems) ? cartItems.length : 0,
      rewardPoints,
      walletBalance
    };
  }, [orders, wishlistItems, cartItems, activeUser]);

  const activeOffers = useMemo(() => {
    if (!Array.isArray(offers)) return [];
    return offers.filter(offer => offer?.isPublished !== false && offer?.isActive !== false);
  }, [offers]);

  const filteredOrders = useMemo(() => {
    const search = searchOrder.trim().toLowerCase();
    if (!search) return orders;
    return orders.filter(order => {
      const haystack = [order.orderId, order.invoiceNumber, order.customerName, order.customerEmail, ...(order.items || []).map(item => item.name)].join(' ').toLowerCase();
      return haystack.includes(search);
    });
  }, [orders, searchOrder]);

  const selectedOrderTimeline = useMemo(() => {
    if (!selectedOrder) return [];
    const currentStatus = getOrderStatusLabel(selectedOrder.status || 'Pending');
    const statusIndex = orderStatusSteps.indexOf(currentStatus);
    const timeline = orderStatusSteps.map((step, index) => ({
      step,
      completed: index <= (statusIndex >= 0 ? statusIndex : 0),
      current: step === currentStatus
    }));
    return timeline;
  }, [selectedOrder]);

  const orderTimelineEntries = useMemo(() => {
    if (!selectedOrder) return [];

    const history = Array.isArray(selectedOrder.timelineHistory) ? selectedOrder.timelineHistory : [];
    if (history.length) {
      return history.slice().reverse().map((entry, index) => ({
        title: entry.status || 'Update',
        date: entry.timestamp ? new Date(entry.timestamp).toLocaleDateString('en-IN') : 'Pending',
        time: entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '',
        description: entry.note || 'Status updated.',
        icon: entry.status === 'Shipped' ? '🚚' : '✓',
        completed: true
      }));
    }

    const statusLabel = getOrderStatusLabel(selectedOrder.status);
    const currentIndex = ['Ordered', 'Packing', 'On the way', 'Delivered'].indexOf(statusLabel);
    const steps = [
      { title: 'Order Placed', description: 'Your order has been placed successfully.', icon: '✓' },
      { title: 'Payment Confirmed', description: 'Payment was received and verified.', icon: '✓' },
      { title: 'Packed', description: 'Your order is being prepared for dispatch.', icon: '✓' },
      { title: 'Shipped', description: 'The package has left the warehouse.', icon: '🚚' },
      { title: 'Out for Delivery', description: 'The courier is on its way to you.', icon: '🚚' },
      { title: 'Delivered', description: 'Your order has reached its destination.', icon: '✓' }
    ];

    return steps.map((step, index) => ({
      ...step,
      date: index === 0 ? 'Confirmed' : index === steps.length - 1 ? 'Pending' : 'In progress',
      time: '',
      completed: index <= (currentIndex >= 0 ? currentIndex : 0)
    }));
  }, [selectedOrder]);

  const getOrderStatusTone = (status) => {
    const label = getOrderStatusLabel(status);
    if (label === 'Delivered') return 'success';
    if (label === 'Shipped' || label === 'Out for Delivery') return 'warning';
    if (label === 'Cancelled' || label === 'Returned') return 'danger';
    return 'info';
  };

  const formatOrderAddress = (order) => {
    const address = order.shippingAddress || order.billingAddress || order.address;
    if (!address) return 'No shipping address available';
    if (typeof address === 'string') return address;

    const lines = [
      address.name,
      address.addressLine1,
      address.addressLine2,
      [address.city, address.state, address.zipCode].filter(Boolean).join(', '),
      address.country,
      address.phone && `Phone: ${address.phone}`
    ].filter(Boolean);

    return lines.join(', ');
  };

  const resetAddressDraft = () => {
    setAddressDraft({ label: 'Home', name: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', zipCode: '', country: '', isDefault: false });
    setEditingAddressId(null);
  };

  const handleSaveAddress = async () => {
    try {
      setIsSaving(true);
      await onSaveAddress({ ...addressDraft, _id: editingAddressId });
      resetAddressDraft();
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditAddress = (address) => {
    setEditingAddressId(address._id || address.id);
    setAddressDraft({
      label: address.label || 'Home',
      name: address.name || '',
      phone: address.phone || '',
      addressLine1: address.addressLine1 || '',
      addressLine2: address.addressLine2 || '',
      city: address.city || '',
      state: address.state || '',
      zipCode: address.zipCode || '',
      country: address.country || '',
      isDefault: Boolean(address.isDefault)
    });
  };

  const handleDeleteAddress = async (addressId) => {
    if (!addressId) return;
    await onDeleteAddress(addressId);
  };

  const handleSetDefaultAddress = async (addressId) => {
    if (!addressId) return;
    await onSetDefaultAddress(addressId);
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      await onUpdateProfile(profileForm);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitReturn = async (event) => {
    event.preventDefault();
    setIsSubmittingReturn(true);
    try {
      await onSubmitReturnRequest({
        orderId: returnDraft.orderId,
        productId: returnDraft.productId,
        quantity: Number(returnDraft.quantity || 1),
        reason: returnDraft.reason,
        description: returnDraft.description
      });
      setReturnDraft(prev => ({ ...prev, description: '', quantity: 1 }));
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  const handleSupportSubmit = async (event) => {
    event.preventDefault();
    await onRaiseSupport({ subject: supportForm.subject, message: supportForm.message });
    setSupportForm({ subject: '', message: '' });
  };

  const markAllNotifications = () => {
    onMarkNotificationsRead?.();
  };

  const handleLogoutClick = () => {
    onClose?.();
    onLogout?.();
  };

  if (!isOpen) return null;

  return (
    <div className="user-dashboard-overlay" role="dialog" aria-modal="true">
      <div className="user-dashboard-shell">
        <button className="user-dashboard-close" onClick={onClose} aria-label="Close dashboard">×</button>

        <aside className="user-dashboard-sidebar">
          <div className="user-dashboard-profile">
            <div className="user-dashboard-avatar"><i className="fa-solid fa-user" /></div>
            <div>
              <h3>Account</h3>
              <p>{activeUser?.email || 'Welcome back'}</p>
            </div>
          </div>

          <nav className="user-dashboard-nav">
            {menuItems.map(item => (
              <button
                key={item.key}
                type="button"
                className={`user-dashboard-nav-item ${activeTab === item.key ? 'active' : ''}`}
                onClick={() => {
                  if (item.key === 'logout') {
                    handleLogoutClick();
                    return;
                  }
                  setActiveTab(item.key);
                }}
              >
                <i className={`fa-solid ${item.icon}`} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <section className="user-dashboard-main">
          <header className="user-dashboard-header">
            <div>
              <p className="user-dashboard-eyebrow">Welcome back</p>
              <h2>{activeUser?.name || 'John'} 👋</h2>
              <p>Track orders, manage your account, and enjoy a premium shopping experience.</p>
            </div>
            <div className="user-dashboard-header-actions">
              <label className="user-dashboard-search">
                <i className="fa-solid fa-magnifying-glass" />
                <input value={searchOrder} onChange={(event) => setSearchOrder(event.target.value)} placeholder="Search orders" />
              </label>
            </div>
          </header>

          {activeTab === 'overview' && (
            <div className="user-dashboard-grid">
              <div className="user-dashboard-card user-dashboard-stats-grid">
                {[
                  { label: 'Total Orders', value: stats.totalOrders, icon: 'fa-box', accent: 'linear-gradient(135deg, #6d28d9, #4f46e5)', tabKey: 'orders' },
                  { label: 'Pending Orders', value: stats.pendingOrders, icon: 'fa-clock', accent: 'linear-gradient(135deg, #f59e0b, #fb923c)', tabKey: 'orders' },
                  { label: 'Delivered Orders', value: stats.deliveredOrders, icon: 'fa-circle-check', accent: 'linear-gradient(135deg, #16a34a, #34d399)', tabKey: 'orders' },
                  { label: 'Wishlist Items', value: stats.wishlistItems, icon: 'fa-heart', accent: 'linear-gradient(135deg, #ec4899, #f43f5e)', tabKey: 'wishlist' },
                  { label: 'Cart', value: stats.cartItemsCount, icon: 'fa-cart-shopping', accent: 'linear-gradient(135deg, #0f766e, #14b8a6)', tabKey: 'cart' }
                ].map(stat => (
                  <button 
                    key={stat.label} 
                    type="button"
                    className="user-dashboard-stat-card" 
                    style={{ 
                      background: stat.accent,
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                      width: '100%',
                      padding: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.8rem',
                      color: 'white',
                      borderRadius: '18px',
                      minHeight: '96px'
                    }}
                    onClick={() => setActiveTab(stat.tabKey)}
                    aria-label={`View ${stat.label}`}
                  >
                    <i className={`fa-solid ${stat.icon}`} />
                    <div>
                      <p>{stat.label}</p>
                      <strong>{stat.value}</strong>
                    </div>
                  </button>
                ))}
              </div>

            </div>
          )}

          {activeTab === 'orders' && (
            <div className="ud-orders-page">
              <div className="ud-orders-page-header">
                <h2>My Orders</h2>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="ud-orders-empty">
                  <i className="fa-solid fa-bag-shopping" style={{ fontSize: '3rem', color: '#94a3b8', marginBottom: '1rem' }} />
                  <h3>No orders yet</h3>
                  <p>Your orders will appear here once you make a purchase.</p>
                </div>
              ) : filteredOrders.map(order => {
                const orderId = order.orderId || order.invoiceNumber || order._id || '';
                const orderDate = order.orderDate || order.createdAt;
                const formattedDate = orderDate ? new Date(orderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Date unknown';
                const total = Number(order.grandTotal || order.total || 0);
                const statusLabel = getOrderStatusLabel(order.status);
                const isPaid = (order.paymentStatus || '').toLowerCase() === 'paid' || (order.paymentStatus || '').toLowerCase() === 'completed' || (order.paymentStatus || '').toLowerCase() === 'success';
                const statusIndex = orderStatusSteps.indexOf(statusLabel);
                const addr = order.shippingAddress || {};
                const items = order.items || [];
                const invoiceUrl = getDashboardInvoiceUrl(order);

                const statusDescription = {
                  'Ordered': 'Your order has been placed and is being processed.',
                  'Packing': 'Your order is being packed and prepared for dispatch.',
                  'On the way': 'Your order has been shipped and is on the way.',
                  'Delivered': 'Your order has been successfully delivered. Thank you!',
                  'Cancelled': 'This order has been cancelled.',
                  'Returned': 'This order has been returned.'
                };

                return (
                  <div key={order._id || order.id} className="ud-order-card">
                    {/* Order Header Row */}
                    <div className="ud-order-header">
                      <div className="ud-order-header-col">
                        <span className="ud-order-header-label">ORDER PLACED</span>
                        <strong>{formattedDate}</strong>
                      </div>
                      <div className="ud-order-header-col">
                        <span className="ud-order-header-label">TOTAL</span>
                        <strong style={{ color: '#15803d' }}>{currency}{total.toLocaleString('en-IN')}</strong>
                      </div>
                      <div className="ud-order-header-col">
                        <span className="ud-order-header-label">ORDER ID</span>
                        <strong>{orderId}</strong>
                      </div>
                      <div className="ud-order-header-col ud-order-paid-col">
                        {isPaid && (
                          <span className="ud-paid-badge"><i className="fa-solid fa-square-check" style={{ marginRight: '0.3rem' }} />Paid</span>
                        )}
                      </div>
                    </div>

                    {/* Status Display */}
                    <div className="ud-order-status-block">
                      <h3 className={`ud-order-status-text ${statusLabel === 'Delivered' ? 'delivered' : statusLabel === 'Cancelled' ? 'cancelled' : ''}`}>{statusLabel}</h3>
                      <p className="ud-order-status-desc">{statusDescription[statusLabel] || 'Order status is being updated.'}</p>
                    </div>

                    {/* Progress Bar */}
                    <div className="ud-progress-bar">
                      <div className="ud-progress-line">
                        <div className="ud-progress-line-fill" style={{ width: statusIndex >= 0 ? `${(statusIndex / (orderStatusSteps.length - 1)) * 100}%` : '0%' }} />
                      </div>
                      {orderStatusSteps.map((step, i) => {
                        const done = i <= statusIndex;
                        const isCurrent = i === statusIndex;
                        return (
                          <div key={step} className={`ud-progress-step ${done ? 'done' : ''} ${isCurrent ? 'current' : ''}`}>
                            <div className="ud-progress-dot">
                              {done ? <i className="fa-solid fa-check" /> : i + 1}
                            </div>
                            <span className={isCurrent ? 'ud-step-label-current' : ''}>{step}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Info Cards Grid */}
                    <div className="ud-order-info-row">
                      <div className="ud-info-card">
                        <h4>Shipment Info</h4>
                        <p>Tracking details will appear once your order is dispatched.</p>
                        {invoiceUrl && (
                          <button type="button" className="ud-link-btn" onClick={() => window.open(invoiceUrl, '_blank')}>
                            <i className="fa-solid fa-file-lines" style={{ marginRight: '0.4rem' }} />View Invoice
                          </button>
                        )}
                      </div>
                      <div className="ud-info-card">
                        <h4>Shipping Address</h4>
                        <p><strong>{addr.name || order.customerName || 'Customer'}</strong></p>
                        <p>{[addr.addressLine1, addr.addressLine2, addr.city, addr.state].filter(Boolean).join(', ') || 'Address not provided'}</p>
                        {addr.zipCode && <p>{addr.zipCode}</p>}
                        {(addr.phone || order.phone) && <p>Ph: {addr.phone || order.phone}</p>}
                      </div>
                      <div className="ud-info-card ud-info-card-accent">
                        <h4>Order Info</h4>
                        <div className="ud-info-row"><span>Subtotal</span><strong>{currency}{total.toLocaleString('en-IN')}</strong></div>
                        <div className="ud-info-row ud-info-total"><span>Grand Total</span><strong style={{ color: '#15803d' }}>{currency}{total.toLocaleString('en-IN')}</strong></div>
                        <button type="button" className="ud-link-btn" onClick={() => setSelectedOrderId(order._id || order.id)}>
                          <i className="fa-solid fa-magnifying-glass" style={{ marginRight: '0.4rem' }} />View order details
                        </button>
                      </div>
                    </div>

                    {/* Items in this Order */}
                    <div className="ud-order-items-section">
                      <h4 className="ud-items-label">ITEMS IN THIS ORDER</h4>
                      {items.map((item, idx) => {
                        const img = item.image || item.images?.[0] || item.thumbnail || '';
                        return (
                          <div key={`${item.name || 'item'}-${idx}`} className="ud-order-item-row">
                            <div className="ud-order-item-img">
                              {img ? <img src={img} alt={item.name || 'Product'} /> : <span className="ud-item-fallback">{(item.name || 'P')[0]}</span>}
                            </div>
                            <div className="ud-order-item-info">
                              <strong>{item.name || 'Product'}</strong>
                              <span>Qty: {item.quantity || 1} · {currency}{Number(item.price || 0).toLocaleString('en-IN')} each</span>
                            </div>
                            <div className="ud-order-item-price">
                              <strong>{currency}{Number(item.totalPrice || (Number(item.quantity || 1) * Number(item.price || 0))).toLocaleString('en-IN')}</strong>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'wishlist' && (
            <div className="user-dashboard-grid user-dashboard-cards-grid">
              {wishlistItems.length === 0 ? (
                <div className="user-dashboard-card user-dashboard-empty-state">No saved items yet.</div>
              ) : wishlistItems.map(item => (
                <div key={item._id || item.id} className="user-dashboard-card user-dashboard-product-card">
                  <div className="user-dashboard-product-image">
                    {item.images?.[0] ? <img src={item.images[0]} alt={item.name} loading="lazy" /> : <i className="fa-solid fa-box" />}
                  </div>
                  <h4>{item.name}</h4>
                  <p>{currency}{getProductFinalPrice(item).toLocaleString('en-IN')}</p>
                  <div className="user-dashboard-product-actions">
                    <button type="button" className="user-dashboard-primary-btn" onClick={() => onAddToCart(item)}>Add to Cart</button>
                    <button type="button" className="user-dashboard-outline-btn" onClick={() => onRemoveFromWishlist(item._id || item.id)}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'cart' && (
            <div className="user-dashboard-grid user-dashboard-cart-list">
              <div className="user-dashboard-card">
                <div className="user-dashboard-section-title">
                  <h3>My Cart</h3>
                  <span className="user-dashboard-muted">{cartItems.length} item(s) · {currency}{Number(totalCartAmount || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
              
              {cartItems.length === 0 ? (
                <div className="user-dashboard-card user-dashboard-empty-state">Your cart is empty.</div>
              ) : cartItems.map(item => (
                <div key={item._id || item.id} className="user-dashboard-card user-dashboard-cart-item-card">
                  <div className="user-dashboard-product-image user-dashboard-cart-image">
                    {item.images?.[0] ? <img src={item.images[0]} alt={item.name} loading="lazy" /> : <i className="fa-solid fa-box" />}
                  </div>
                  <div className="user-dashboard-cart-item-details">
                    <h4>{item.name}</h4>
                    <p>{currency}{(getProductFinalPrice(item) * (Number(item.quantity) || 1)).toLocaleString('en-IN')}</p>
                    <div className="user-dashboard-cart-quantity-controls">
                      <button type="button" className="user-dashboard-outline-btn" onClick={() => onUpdateCartQuantity?.(item._id || item.id, -1)}>-</button>
                      <span>{Number(item.quantity) || 1}</span>
                      <button type="button" className="user-dashboard-primary-btn" onClick={() => onUpdateCartQuantity?.(item._id || item.id, 1)}>+</button>
                    </div>
                  </div>
                  <div className="user-dashboard-product-actions">
                    <button type="button" className="user-dashboard-primary-btn" onClick={() => {
                      onClose?.();
                      onBuyNow?.(item);
                    }}>Buy Now</button>
                    <button type="button" className="user-dashboard-outline-btn" onClick={() => onRemoveFromCart?.(item._id || item.id)}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'addresses' && (
            <div className="user-dashboard-grid">
              <div className="user-dashboard-card">
                <div className="user-dashboard-section-title">
                  <h3>{editingAddressId ? 'Edit Address' : 'Add Address'}</h3>
                </div>
                <div className="user-dashboard-form-grid">
                  <input value={addressDraft.label} onChange={(event) => setAddressDraft(prev => ({ ...prev, label: event.target.value }))} placeholder="Label" />
                  <input value={addressDraft.name} onChange={(event) => setAddressDraft(prev => ({ ...prev, name: event.target.value }))} placeholder="Full Name" />
                  <input value={addressDraft.phone} onChange={(event) => setAddressDraft(prev => ({ ...prev, phone: event.target.value }))} placeholder="Phone" />
                  <input value={addressDraft.addressLine1} onChange={(event) => setAddressDraft(prev => ({ ...prev, addressLine1: event.target.value }))} placeholder="Address Line 1" />
                  <input value={addressDraft.addressLine2} onChange={(event) => setAddressDraft(prev => ({ ...prev, addressLine2: event.target.value }))} placeholder="Address Line 2" />
                  <input value={addressDraft.city} onChange={(event) => setAddressDraft(prev => ({ ...prev, city: event.target.value }))} placeholder="City" />
                  <input value={addressDraft.state} onChange={(event) => setAddressDraft(prev => ({ ...prev, state: event.target.value }))} placeholder="State" />
                  <input value={addressDraft.zipCode} onChange={(event) => setAddressDraft(prev => ({ ...prev, zipCode: event.target.value }))} placeholder="Pincode" />
                  <input value={addressDraft.country} onChange={(event) => setAddressDraft(prev => ({ ...prev, country: event.target.value }))} placeholder="Country" />
                </div>
                <label className="user-dashboard-check-row">
                  <input type="checkbox" checked={addressDraft.isDefault} onChange={(event) => setAddressDraft(prev => ({ ...prev, isDefault: event.target.checked }))} />
                  Set as default address
                </label>
                <div className="user-dashboard-product-actions">
                  <button type="button" className="user-dashboard-outline-btn" onClick={resetAddressDraft}>Cancel</button>
                  <button type="button" className="user-dashboard-primary-btn" onClick={handleSaveAddress}>{isSaving ? 'Saving...' : editingAddressId ? 'Save Address' : 'Add Address'}</button>
                </div>
              </div>

              <div className="user-dashboard-card">
                <div className="user-dashboard-section-title">
                  <h3>Saved Addresses</h3>
                </div>
                <div className="user-dashboard-address-list">
                  {(activeUser?.addresses || []).length === 0 ? (
                    <div className="user-dashboard-empty">No addresses saved.</div>
                  ) : (activeUser?.addresses || []).map(address => (
                    <div key={address._id || address.id} className="user-dashboard-address-card">
                      <div>
                        <strong>{address.label || 'Home'}</strong>
                        <p>{address.name}</p>
                        <p>{address.addressLine1}, {address.addressLine2}</p>
                        <p>{address.city}, {address.state} — {address.zipCode}</p>
                        <p>{address.country}</p>
                        <p>{address.phone}</p>
                      </div>
                      <div className="user-dashboard-address-actions">
                        {address.isDefault ? <span className="user-dashboard-badge">Default</span> : null}
                        <button type="button" className="user-dashboard-outline-btn" onClick={() => handleEditAddress(address)}>Edit</button>
                        <button type="button" className="user-dashboard-outline-btn" onClick={() => handleDeleteAddress(address._id || address.id)}>Delete</button>
                        {!address.isDefault ? <button type="button" className="user-dashboard-primary-btn" onClick={() => handleSetDefaultAddress(address._id || address.id)}>Set Default</button> : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'coupons' && (
            <div className="user-dashboard-grid">
              <div className="user-dashboard-card">
                <div className="user-dashboard-section-title">
                  <h3>Active Coupons</h3>
                  <span className="user-dashboard-muted">{coupons.length} available</span>
                </div>
                <div className="user-dashboard-coupon-list">
                  {coupons.length === 0 ? <div className="user-dashboard-empty">No active coupons right now.</div> : coupons.map(coupon => (
                    <div key={coupon._id || coupon.id} className="user-dashboard-coupon-card">
                      <strong>{coupon.code}</strong>
                      <p>{coupon.description || 'Exclusive discount'}</p>
                      <span>{coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `${currency}${coupon.discountValue} OFF`}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="user-dashboard-card">
                <div className="user-dashboard-section-title">
                  <h3>Current Rewards</h3>
                  <span className="user-dashboard-muted">{activeOffers.length} live</span>
                </div>
                <div className="user-dashboard-coupon-list">
                  {activeOffers.length === 0 ? <div className="user-dashboard-empty">No rewards are active right now.</div> : activeOffers.map(offer => (
                    <div key={offer._id || offer.id} className="user-dashboard-coupon-card">
                      <strong>{offer.title || offer.code || 'Reward'}</strong>
                      <p>{offer.description || 'Special reward from the store'}</p>
                      <span>
                        {offer.discountType === 'fixed' ? `${currency}${Number(offer.discountValue || 0).toLocaleString('en-IN')} OFF`
                          : offer.discountType === 'percentage' ? `${offer.discountValue}% OFF`
                            : offer.code || 'Limited offer'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="user-dashboard-card">
              <div className="user-dashboard-section-title">
                <h3>Notifications</h3>
                <button type="button" className="user-dashboard-link-btn" onClick={markAllNotifications}>Clear all</button>
              </div>
              <div className="user-dashboard-notification-list">
                {notifications.length === 0 ? (
                  <div className="user-dashboard-empty">No notifications to show.</div>
                ) : notifications.map(item => (
                  <div key={item.id} className={`user-dashboard-notification-item ${item.unread ? 'unread' : ''}`}>
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.body}</p>
                    </div>
                    <span>{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'returns' && (
            <div className="user-dashboard-grid">
              <div className="user-dashboard-card">
                <div className="user-dashboard-section-title">
                  <h3>Return & Refund</h3>
                </div>
                <form onSubmit={handleSubmitReturn} className="user-dashboard-form-grid">
                  <select value={returnDraft.orderId} onChange={(event) => setReturnDraft(prev => ({ ...prev, orderId: event.target.value }))}>
                    <option value="">Select order</option>
                    {orders.map(order => (
                      <option key={order._id || order.id} value={order._id || order.id}>{order.orderId || order.invoiceNumber}</option>
                    ))}
                  </select>
                  <input value={returnDraft.quantity} type="number" min="1" onChange={(event) => setReturnDraft(prev => ({ ...prev, quantity: event.target.value }))} placeholder="Quantity" />
                  <select value={returnDraft.reason} onChange={(event) => setReturnDraft(prev => ({ ...prev, reason: event.target.value }))}>
                    <option value="Damaged">Damaged</option>
                    <option value="Wrong Item">Wrong Item</option>
                    <option value="Not as described">Not as described</option>
                    <option value="Late Delivery">Late Delivery</option>
                  </select>
                  <textarea value={returnDraft.description} onChange={(event) => setReturnDraft(prev => ({ ...prev, description: event.target.value }))} placeholder="Tell us what happened" />
                  <button type="submit" className="user-dashboard-primary-btn">{isSubmittingReturn ? 'Submitting...' : 'Request Return'}</button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'support' && (
            <div className="user-dashboard-grid">
              <div className="user-dashboard-card">
                <div className="user-dashboard-section-title">
                  <h3>Support Center</h3>
                </div>
                <form onSubmit={handleSupportSubmit} className="user-dashboard-form-grid">
                  <input value={supportForm.subject} onChange={(event) => setSupportForm(prev => ({ ...prev, subject: event.target.value }))} placeholder="Subject" />
                  <textarea value={supportForm.message} onChange={(event) => setSupportForm(prev => ({ ...prev, message: event.target.value }))} placeholder="Describe your issue" />
                  <button type="submit" className="user-dashboard-primary-btn">Raise Ticket</button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="user-dashboard-grid">
              <div className="user-dashboard-card">
                <div className="user-dashboard-section-title">
                  <h3>Profile Details</h3>
                </div>
                <form onSubmit={handleProfileSubmit} className="user-dashboard-form-grid">
                  <input value={profileForm.name} onChange={(event) => setProfileForm(prev => ({ ...prev, name: event.target.value }))} placeholder="Full Name" />
                  <input value={profileForm.email} onChange={(event) => setProfileForm(prev => ({ ...prev, email: event.target.value }))} placeholder="Email" />
                  <input value={profileForm.phone} onChange={(event) => setProfileForm(prev => ({ ...prev, phone: event.target.value }))} placeholder="Phone" />
                  <input value={profileForm.address} onChange={(event) => setProfileForm(prev => ({ ...prev, address: event.target.value }))} placeholder="Address" />
                  <button type="submit" className="user-dashboard-primary-btn">{isSaving ? 'Saving...' : 'Update Profile'}</button>
                </form>
              </div>

            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default UserDashboard;

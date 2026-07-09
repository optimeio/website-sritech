import { useEffect, useMemo, useState } from 'react';

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
  'Shipped',
  'Out for Delivery',
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
  currency = '₹'
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
    if (['ordered', 'order placed', 'order-placed', 'placed', 'pending', 'processing', 'confirmed', 'confirmed order', 'approved', 'packed', 'packing', 'ready to ship'].includes(normalized)) return 'Ordered';
    if (['shipped', 'dispatch', 'dispatched', 'out for shipment', 'in transit'].includes(normalized)) return 'Shipped';
    if (['out for delivery', 'out-for-delivery', 'delivery in progress', 'on the way'].includes(normalized)) return 'Out for Delivery';
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
    const currentIndex = ['Ordered', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'].indexOf(statusLabel);
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
                  { label: 'Total Orders', value: stats.totalOrders, icon: 'fa-box', accent: 'linear-gradient(135deg, #6d28d9, #4f46e5)' },
                  { label: 'Pending Orders', value: stats.pendingOrders, icon: 'fa-clock', accent: 'linear-gradient(135deg, #f59e0b, #fb923c)' },
                  { label: 'Delivered Orders', value: stats.deliveredOrders, icon: 'fa-circle-check', accent: 'linear-gradient(135deg, #16a34a, #34d399)' },
                  { label: 'Wishlist Items', value: stats.wishlistItems, icon: 'fa-heart', accent: 'linear-gradient(135deg, #ec4899, #f43f5e)' },
                  { label: 'Cart', value: stats.cartItemsCount, icon: 'fa-cart-shopping', accent: 'linear-gradient(135deg, #0f766e, #14b8a6)' }
                ].map(stat => (
                  <div key={stat.label} className="user-dashboard-stat-card" style={{ background: stat.accent }}>
                    <i className={`fa-solid ${stat.icon}`} />
                    <div>
                      <p>{stat.label}</p>
                      <strong>{stat.value}</strong>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {activeTab === 'orders' && (
            <div className="user-dashboard-orders-section">
              <div className="user-dashboard-card user-dashboard-orders-list-panel">
                <div className="user-dashboard-section-title">
                  <div>
                    <h3>My Orders</h3>
                    <p className="user-dashboard-muted">Track recent purchases, invoices, and delivery updates</p>
                  </div>
                  <span className="user-dashboard-muted">{filteredOrders.length} orders</span>
                </div>
                <div className="user-dashboard-order-list">
                  {filteredOrders.length === 0 ? (
                    <div className="user-dashboard-empty">No matching orders.</div>
                  ) : filteredOrders.map(order => (
                    <button key={order._id || order.id} type="button" className={`user-dashboard-order-card ${selectedOrder && (selectedOrder._id || selectedOrder.id) === (order._id || order.id) ? 'selected' : ''}`} onClick={() => setSelectedOrderId(order._id || order.id)}>
                      <div className="user-dashboard-order-card-main">
                        <div>
                          <strong>{order.orderId || order.invoiceNumber || 'Order'}</strong>
                          <p>{order.items?.length || 0} item(s) · {currency}{Number(order.grandTotal || 0).toLocaleString('en-IN')}</p>
                        </div>
                        <span className="user-dashboard-badge">{getOrderStatusLabel(order.status)}</span>
                      </div>
                      <div className="user-dashboard-order-card-meta">
                        <span>{order.orderDate ? new Date(order.orderDate).toLocaleDateString('en-IN') : order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : 'Date unknown'}</span>
                        <span>{order.paymentStatus || 'Payment pending'}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="user-dashboard-card user-dashboard-order-detail-card">
                <div className="user-dashboard-section-title">
                  <div>
                    <h3>Order Tracking</h3>
                    <p className="user-dashboard-muted">Premium shipment tracking with live updates</p>
                  </div>
                </div>
                {selectedOrder ? (
                  <div className="user-dashboard-order-tracking-shell">
                    <div className="user-dashboard-order-hero">
                      <div>
                        <div className="user-dashboard-order-hero-meta">
                          <span className="user-dashboard-order-pill">#{selectedOrder.orderId || selectedOrder.invoiceNumber || 'Order'}</span>
                          <span className="user-dashboard-order-pill user-dashboard-order-pill-muted">Ordered on {selectedOrder.orderDate ? new Date(selectedOrder.orderDate).toLocaleDateString('en-IN') : selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleDateString('en-IN') : 'Recently placed'}</span>
                        </div>
                        <h4>{selectedOrder.orderId || selectedOrder.invoiceNumber || 'Order details'}</h4>
                        <p>Manage your delivery progress, shipment details, and order summary in one place.</p>
                      </div>
                      <div className="user-dashboard-order-hero-status">
                        <span className="user-dashboard-order-hero-date">Estimated delivery {selectedOrder.estimatedDelivery ? new Date(selectedOrder.estimatedDelivery).toLocaleDateString('en-IN') : 'soon'}</span>
                        <span className={`user-dashboard-status-badge ${getOrderStatusTone(selectedOrder.status)}`}>{getOrderStatusLabel(selectedOrder.status)}</span>
                      </div>
                    </div>

                    <div className="user-dashboard-progress-rail" aria-label="Order progress tracker">
                      {selectedOrderTimeline.map((step, index) => (
                        <div key={step.step} className={`user-dashboard-progress-step ${step.completed ? 'completed' : ''} ${step.current ? 'current' : ''}`}>
                          <div className="user-dashboard-progress-circle">
                            <span>{step.completed ? '✓' : index + 1}</span>
                          </div>
                          <strong>{step.step}</strong>
                        </div>
                      ))}
                    </div>

                    <div className="user-dashboard-order-info-grid">
                      <div className="user-dashboard-order-info-card">
                        <h4>Shipping Details</h4>
                        <p><strong>{selectedOrder.customerName || selectedOrder.shippingAddress?.name || 'Customer'}</strong></p>
                        <p>{selectedOrder.shippingAddress?.phone || selectedOrder.phone || 'Phone not provided'}</p>
                        <p>{formatOrderAddress(selectedOrder)}</p>
                      </div>
                      <div className="user-dashboard-order-info-card">
                        <h4>Tracking Details</h4>
                        <div className="user-dashboard-order-info-row"><span>Tracking ID</span><strong>{selectedOrder.trackingNumber || (selectedOrder.trackingUrl ? 'Available' : 'N/A')}</strong></div>
                        <div className="user-dashboard-order-info-row"><span>Courier</span><strong>{selectedOrder.carrier || 'Courier service'}</strong></div>
                        <div className="user-dashboard-order-info-row"><span>Created</span><strong>{selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleDateString('en-IN') : 'Pending'}</strong></div>
                        <div className="user-dashboard-order-info-row"><span>Expected</span><strong>{selectedOrder.estimatedDelivery ? new Date(selectedOrder.estimatedDelivery).toLocaleDateString('en-IN') : 'TBA'}</strong></div>
                        <div className="user-dashboard-order-info-row"><span>Status</span><strong>{getOrderStatusLabel(selectedOrder.status)}</strong></div>
                      </div>
                      <div className="user-dashboard-order-info-card">
                        <h4>Order Summary</h4>
                        <div className="user-dashboard-order-info-row"><span>Items</span><strong>{selectedOrder.items?.length || 0}</strong></div>
                        <div className="user-dashboard-order-info-row"><span>Subtotal</span><strong>{currency}{Number(selectedOrder.grandTotal || 0).toLocaleString('en-IN')}</strong></div>
                        <div className="user-dashboard-order-info-row"><span>Payment</span><strong>{selectedOrder.paymentStatus || 'Pending'}</strong></div>
                        <div className="user-dashboard-order-info-row"><span>Method</span><strong>{selectedOrder.paymentMethod || 'Razorpay'}</strong></div>
                        <div className="user-dashboard-order-info-row"><span>Order ID</span><strong>{selectedOrder.orderId || selectedOrder.invoiceNumber}</strong></div>
                      </div>
                    </div>

                    <div className="user-dashboard-order-actions-row">
                      <button type="button" className="user-dashboard-primary-btn">Download Invoice</button>
                      <button type="button" className="user-dashboard-outline-btn">View Order Details</button>
                      <button type="button" className="user-dashboard-outline-btn">Contact Support</button>
                      {!['Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned'].includes(getOrderStatusLabel(selectedOrder.status)) && (
                        <button type="button" className="user-dashboard-danger-btn">Cancel Order</button>
                      )}
                    </div>

                    <div className="user-dashboard-timeline-card">
                      <div className="user-dashboard-section-title">
                        <h4>Delivery Timeline</h4>
                      </div>
                      <div className="user-dashboard-timeline">
                        {orderTimelineEntries.map((entry, index) => (
                          <div key={`${entry.title}-${index}`} className={`user-dashboard-timeline-step ${entry.completed ? 'completed' : ''}`}>
                            <span>{entry.icon}</span>
                            <div>
                              <strong>{entry.title}</strong>
                              <p>{entry.date}{entry.time ? ` · ${entry.time}` : ''}</p>
                              <small>{entry.description}</small>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="user-dashboard-products-card">
                      <div className="user-dashboard-section-title">
                        <h4>Ordered Products</h4>
                      </div>
                      <div className="user-dashboard-products-table">
                        <div className="user-dashboard-products-table-head">
                          <span>Product</span>
                          <span>SKU</span>
                          <span>Qty</span>
                          <span>Price</span>
                          <span>Subtotal</span>
                          <span>Status</span>
                          <span>Action</span>
                        </div>
                        {(selectedOrder.items || []).length > 0 ? selectedOrder.items.map((item, index) => (
                          <div key={`${item.name || 'item'}-${index}`} className="user-dashboard-products-table-row">
                            <span className="user-dashboard-product-cell">
                              <span className="user-dashboard-product-thumb">{item.name?.[0] || 'P'}</span>
                              <strong>{item.name || 'Product'}</strong>
                            </span>
                            <span>{item.sku || item.product || 'N/A'}</span>
                            <span>{item.quantity || 1}</span>
                            <span>{currency}{Number(item.price || 0).toLocaleString('en-IN')}</span>
                            <span>{currency}{Number(item.totalPrice || (Number(item.quantity || 1) * Number(item.price || 0))).toLocaleString('en-IN')}</span>
                            <span>{getOrderStatusLabel(selectedOrder.status)}</span>
                            <button type="button" className="user-dashboard-outline-btn">View Product</button>
                          </div>
                        )) : (
                          <div className="user-dashboard-empty">No items listed for this order.</div>
                        )}
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="user-dashboard-empty">Choose an order to inspect its progress.</div>
                )}
              </div>
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

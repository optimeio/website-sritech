import React, { useEffect, useMemo, useState } from 'react';
import Pagination from '../components/Pagination';
import './MyOrders.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const statusFilters = ['All Orders', 'Delivered', 'Shipped', 'Processing', 'Cancelled', 'Returned'];
const dateFilters = ['All Time', 'Last 30 Days', 'Last 6 Months'];
const sortOptions = ['Newest First', 'Oldest First'];
const trackingSteps = ['Order Confirmed', 'Packed', 'Shipped', 'Out For Delivery', 'Delivered'];

const normalizeOrderStatus = (status) => {
  const normalized = String(status || '').trim().toLowerCase();
  if (['delivered', 'complete', 'completed'].includes(normalized)) return 'Delivered';
  if (['out for delivery', 'out-for-delivery', 'delivery in progress', 'on the way'].includes(normalized)) return 'Out for Delivery';
  if (['shipped', 'dispatch', 'dispatched', 'in transit'].includes(normalized)) return 'Shipped';
  if (['cancelled', 'canceled', 'returned', 'refunded', 'return requested'].includes(normalized)) return 'Cancelled';
  return 'Processing';
};

const getStatusBadgeVariant = (status) => {
  const normalized = normalizeOrderStatus(status);
  if (normalized === 'Delivered') return 'delivered';
  if (normalized === 'Shipped') return 'shipped';
  if (normalized === 'Processing') return 'processing';
  return 'cancelled';
};

const formatCurrency = (value) => {
  const number = Number(value || 0);
  if (Number.isNaN(number)) return '₹0';
  return `₹${number.toLocaleString('en-IN')}`;
};

const formatOrderDate = (value) => {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getDeliveryLabel = (order) => {
  const dateValue = order.estimatedDelivery || order.deliveryDate || order.delivery || order.deliveredAt;
  if (!dateValue) return 'Delivery date not available';
  const formatted = formatOrderDate(dateValue);
  return normalizeOrderStatus(order.status) === 'Delivered' ? `Delivered on ${formatted}` : `Expected delivery ${formatted}`;
};

const getPrimaryItem = (order) => {
  const items = order.items || [];
  return items[0] || {};
};

const getProductImage = (item) => item.image || item.images?.[0] || item.thumbnail || '';

const getOrderSummary = (order) => {
  const items = order.items || [];
  const subTotalFromItems = items.reduce((sum, item) => {
    const price = Number(item.totalPrice ?? item.price ?? 0);
    const quantity = Number(item.quantity ?? 1);
    return sum + (Number.isFinite(price) ? price * quantity : 0);
  }, 0);

  const subTotal = Number(order.subtotal ?? order.subTotal ?? subTotalFromItems);
  const discount = Number(order.discount ?? 0);
  const coupon = Number(order.couponAmount ?? order.coupon ?? 0);
  const shipping = Number(order.shippingCost ?? order.shippingCharge ?? order.shippingFee ?? 0);
  const gst = Number(order.tax ?? order.gst ?? order.taxAmount ?? 0);
  const total = Number(order.grandTotal ?? order.total ?? order.amount ?? (subTotal - discount - coupon + shipping + gst));

  return {
    subTotal,
    discount,
    coupon,
    shipping,
    gst,
    total,
    paymentMethod: order.paymentMethod || order.payment || 'N/A',
    transactionId: order.transactionId || order.paymentId || order.orderTransaction || 'N/A'
  };
};

const getTrackingProgressIndex = (status) => {
  const normalized = String(status || '').trim().toLowerCase();
  if (['delivered', 'complete', 'completed'].includes(normalized)) return 4;
  if (['out for delivery', 'out-for-delivery', 'delivery in progress', 'on the way'].includes(normalized)) return 3;
  if (['shipped', 'dispatch', 'dispatched', 'in transit'].includes(normalized)) return 2;
  if (['cancelled', 'canceled', 'returned', 'refunded', 'return requested'].includes(normalized)) return 0;
  return 1;
};

const OrderStatusBadge = ({ status }) => {
  const variant = getStatusBadgeVariant(status);
  return <span className={`premium-orders-badge premium-orders-badge-${variant}`}>{normalizeOrderStatus(status)}</span>;
};

const OrderProductThumbnails = ({ items }) => {
  if (!items || items.length <= 1) return null;
  return (
    <div className="premium-orders-product-thumbnails">
      {items.slice(0, 4).map((item, index) => (
        <div key={index} className="premium-orders-thumbnail-item">
          <img src={getProductImage(item)} alt={item.name || 'Product'} loading="lazy" />
        </div>
      ))}
      {items.length > 4 && <div className="premium-orders-thumbnail-more">+{items.length - 4}</div>}
    </div>
  );
};

const OrderActions = ({ onTrack, onViewDetails }) => (
  <div className="premium-orders-actions">
    <button type="button" className="premium-orders-btn premium-orders-btn-primary" onClick={onTrack}>
      Track Order
    </button>
    <button type="button" className="premium-orders-btn premium-orders-btn-secondary" onClick={onViewDetails}>
      View Details
    </button>
    <button type="button" className="premium-orders-btn premium-orders-btn-link">
      Download Invoice
    </button>
    <button type="button" className="premium-orders-btn premium-orders-btn-link">
      Need Help
    </button>
    <button type="button" className="premium-orders-btn premium-orders-btn-link">
      Buy Again
    </button>
  </div>
);

const TrackingTimeline = ({ currentIndex }) => (
  <div className="premium-orders-tracking-timeline">
    {trackingSteps.map((step, index) => {
      const completed = index <= currentIndex;
      return (
        <div key={step} className={`premium-orders-step-item ${completed ? 'completed' : ''}`}>
          <div className="premium-orders-step-dot">{completed ? <i className="fa-solid fa-check" /> : index + 1}</div>
          <p>{step}</p>
        </div>
      );
    })}
  </div>
);

const ShippingCard = ({ order }) => {
  const address = order.shippingAddress || order.address || order.shipping || {};
  return (
    <div className="premium-orders-card premium-orders-small-card">
      <h3>Shipping Details</h3>
      <div className="premium-orders-card-row">
        <span>Customer</span>
        <strong>{address.name || order.customerName || 'Customer'}</strong>
      </div>
      {address.addressLine1 && <p>{address.addressLine1}</p>}
      {address.addressLine2 && <p>{address.addressLine2}</p>}
      <p>{[address.city, address.state, address.zipCode].filter(Boolean).join(', ')}</p>
      <p>{address.country}</p>
      {address.phone && <p>Phone: {address.phone}</p>}
      <div className="premium-orders-card-row">
        <span>Courier Partner</span>
        <strong>{order.courierPartner || order.carrier || order.courier || 'SriTech Express'}</strong>
        <span>Estimated Delivery</span>
        <strong>{getDeliveryLabel(order)}</strong>
      </div>
    </div>
  );
};

const OrderSummaryCard = ({ order }) => {
  const summary = getOrderSummary(order);
  return (
    <div className="premium-orders-card premium-orders-small-card">
      <h3>Order Summary</h3>
      <div className="premium-orders-card-row">
        <span>Subtotal</span>
        <strong>{formatCurrency(summary.subTotal)}</strong>
      </div>
      <div className="premium-orders-card-row">
        <span>Discount</span>
        <strong>{formatCurrency(-summary.discount)}</strong>
      </div>
      <div className="premium-orders-card-row">
        <span>Coupon</span>
        <strong>{formatCurrency(-summary.coupon)}</strong>
      </div>
      <div className="premium-orders-card-row">
        <span>Shipping</span>
        <strong>{summary.shipping === 0 ? 'FREE' : formatCurrency(summary.shipping)}</strong>
      </div>
      <div className="premium-orders-card-row">
        <span>GST</span>
        <strong>{formatCurrency(summary.gst)}</strong>
      </div>
      <div className="premium-orders-card-divider" />
      <div className="premium-orders-card-row total-row">
        <span>Total</span>
        <strong>{formatCurrency(summary.total)}</strong>
      </div>
      <div className="premium-orders-card-divider" />
      <div className="premium-orders-card-row">
        <span>Payment Method</span>
        <strong>{summary.paymentMethod}</strong>
      </div>
      <div className="premium-orders-card-row">
        <span>Transaction ID</span>
        <strong>{summary.transactionId}</strong>
      </div>
    </div>
  );
};

const InvoiceButton = ({ invoiceUrl }) => (
  <button type="button" className="premium-orders-btn premium-orders-btn-secondary" onClick={() => window.open(invoiceUrl || '#', '_blank')}>
    Invoice
  </button>
);

const NeedHelpButton = () => (
  <button type="button" className="premium-orders-btn premium-orders-btn-link">Need Help</button>
);

const SkeletonLoader = () => (
  <div className="premium-orders-skeleton-card animate-pulse">
    <div className="premium-orders-skeleton-row">
      <div className="premium-orders-skeleton-box" />
      <div className="premium-orders-skeleton-content">
        <div className="premium-orders-skeleton-line short" />
        <div className="premium-orders-skeleton-line medium" />
        <div className="premium-orders-skeleton-line long" />
      </div>
    </div>
    <div className="premium-orders-skeleton-actions">
      <div className="premium-orders-skeleton-btn" />
      <div className="premium-orders-skeleton-btn" />
      <div className="premium-orders-skeleton-btn small" />
    </div>
  </div>
);

const EmptyOrders = ({ onStartShopping }) => (
  <div className="premium-orders-empty-state">
    <div className="premium-orders-empty-illustration" />
    <h2>No Orders Yet</h2>
    <p>Find your next favorite product and place your first order with SriTech.</p>
    <button type="button" className="premium-orders-btn premium-orders-btn-primary" onClick={onStartShopping}>
      Start Shopping
    </button>
  </div>
);

const OrderCard = ({ order, onTrack, onViewDetails }) => {
  const firstItem = getPrimaryItem(order);
  const productImage = getProductImage(firstItem);
  const productName = firstItem.name || firstItem.title || 'Product Name';
  const brand = firstItem.brand || order.brand || 'SriTech';
  const variant = [firstItem.color, firstItem.size, firstItem.variant].filter(Boolean).join(' / ');
  const seller = order.seller || firstItem.seller || 'SriTech Marketplace';
  const quantity = (order.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  const price = order.grandTotal ?? order.total ?? (order.items || []).reduce((sum, item) => {
    const priceValue = Number(item.totalPrice ?? item.price ?? 0);
    const quantityValue = Number(item.quantity ?? 1);
    return sum + (Number.isFinite(priceValue) ? priceValue * quantityValue : 0);
  }, 0);

  return (
    <article className="premium-orders-card premium-orders-order-card">
      <div className="premium-orders-card-left">
        <div className="premium-orders-card-image">
          {productImage ? <img src={productImage} alt={productName} /> : <span>{productName.charAt(0)}</span>}
        </div>
      </div>
      <div className="premium-orders-card-center">
        <p className="premium-orders-order-label">{productName}</p>
        <p className="premium-orders-order-brand">{brand}</p>
        {variant && <p className="premium-orders-order-variant">{variant}</p>}
        <p className="premium-orders-order-meta">Quantity: {quantity}</p>
        <p className="premium-orders-order-meta">Seller: {seller}</p>
        <p className="premium-orders-order-meta">Order Date: {formatOrderDate(order.createdAt || order.orderDate)}</p>
        <p className="premium-orders-order-meta">Order ID: {order.orderId || order.invoiceNumber || order._id || order.id}</p>
        <p className="premium-orders-order-delivery">{getDeliveryLabel(order)}</p>
        <OrderProductThumbnails items={order.items || []} />
      </div>
      <div className="premium-orders-card-right">
        <OrderStatusBadge status={order.status} />
        <p className="premium-orders-order-price">{formatCurrency(price)}</p>
        <div className="premium-orders-card-row" style={{ gap: '0.75rem', flexWrap: 'wrap' }}>
          <button type="button" className="premium-orders-btn premium-orders-btn-primary" onClick={onTrack}>
            Track Order
          </button>
          <button type="button" className="premium-orders-btn premium-orders-btn-secondary" onClick={onViewDetails}>
            View Details
          </button>
        </div>
        <div className="premium-orders-card-row" style={{ marginTop: '1rem', gap: '0.75rem' }}>
          {order.invoicePdfPath || order.invoiceUrl || order.invoiceLink ? (
            <button type="button" className="premium-orders-btn premium-orders-btn-link" onClick={() => window.open(order.invoicePdfPath || order.invoiceUrl || order.invoiceLink, '_blank')}>
              Download Invoice
            </button>
          ) : null}
          <button type="button" className="premium-orders-btn premium-orders-btn-link">
            Contact Support
          </button>
        </div>
      </div>
    </article>
  );
};

const TrackingDrawer = ({ order, open, onClose }) => {
  if (!open || !order) return null;
  const currentIndex = getTrackingProgressIndex(order.status);
  const firstItem = getPrimaryItem(order);
  const productImage = getProductImage(firstItem);

  return (
    <div className="premium-orders-drawer-overlay" onClick={onClose}>
      <div className="premium-orders-drawer" onClick={(event) => event.stopPropagation()}>
        <div className="premium-orders-drawer-header">
          <h2>Track Order</h2>
          <button type="button" className="premium-orders-close-btn" onClick={onClose} aria-label="Close drawer">×</button>
        </div>
        <div className="premium-orders-drawer-top">
          <div className="premium-orders-drawer-product-image">
            {productImage ? <img src={productImage} alt={firstItem.name || 'Product'} /> : <span>{(firstItem.name || 'P').charAt(0)}</span>}
          </div>
          <div>
            <p className="premium-orders-drawer-product-name">{firstItem.name || firstItem.title || 'Product details'}</p>
            <p className="premium-orders-drawer-product-subtitle">Order ID: {order.orderId || order.invoiceNumber || order._id || order.id}</p>
            <p className="premium-orders-drawer-product-subtitle">{order.items?.length || 0} item(s) · {formatCurrency(order.grandTotal ?? order.total ?? 0)}</p>
          </div>
        </div>

        <div className="premium-orders-drawer-section">
          <h3>Tracking Timeline</h3>
          <TrackingTimeline currentIndex={currentIndex} />
        </div>

        <div className="premium-orders-drawer-grid">
          <ShippingCard order={order} />
          <OrderSummaryCard order={order} />
        </div>

        <div className="premium-orders-drawer-actions">
          <InvoiceButton invoiceUrl={order.invoiceUrl || order.invoiceLink} />
          <NeedHelpButton />
        </div>
      </div>
    </div>
  );
};

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage] = useState(8);
  const [query, setQuery] = useState('');
  const [activeStatusFilter, setActiveStatusFilter] = useState('All Orders');
  const [activeDateFilter, setActiveDateFilter] = useState('All Time');
  const [activeSort, setActiveSort] = useState('Newest First');
  const [drawerOrderId, setDrawerOrderId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const orderCounts = useMemo(() => {
    const counts = { total: orders.length, Delivered: 0, Shipped: 0, Processing: 0, Cancelled: 0, Returned: 0 };
    orders.forEach((order) => {
      const status = normalizeOrderStatus(order.status);
      if (status === 'Delivered') counts.Delivered += 1;
      else if (status === 'Shipped') counts.Shipped += 1;
      else if (status === 'Processing') counts.Processing += 1;
      else if (status === 'Cancelled') counts.Cancelled += 1;
      else if (status === 'Returned') counts.Returned += 1;
    });
    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const lowerQuery = String(query || '').trim().toLowerCase();
    return orders
      .filter((order) => {
        if (activeStatusFilter !== 'All Orders') return normalizeOrderStatus(order.status) === activeStatusFilter;
        return true;
      })
      .filter((order) => {
        if (activeDateFilter === 'Last 30 Days') {
          const created = new Date(order.createdAt || order.orderDate || Date.now());
          return (Date.now() - created.getTime()) <= 30 * 24 * 60 * 60 * 1000;
        }
        if (activeDateFilter === 'Last 6 Months') {
          const created = new Date(order.createdAt || order.orderDate || Date.now());
          return (Date.now() - created.getTime()) <= 180 * 24 * 60 * 60 * 1000;
        }
        return true;
      })
      .filter((order) => {
        if (!lowerQuery) return true;
        const orderId = String(order.orderId || order.invoiceNumber || order._id || order.id || '').toLowerCase();
        const productNames = (order.items || []).map((item) => String(item.name || item.title || item.product || '').toLowerCase()).join(' ');
        return orderId.includes(lowerQuery) || productNames.includes(lowerQuery);
      })
      .sort((a, b) => {
        if (activeSort === 'Oldest First') return new Date(a.createdAt || a.orderDate || 0).getTime() - new Date(b.createdAt || b.orderDate || 0).getTime();
        return new Date(b.createdAt || b.orderDate || 0).getTime() - new Date(a.createdAt || a.orderDate || 0).getTime();
      });
  }, [orders, activeStatusFilter, activeDateFilter, activeSort, query]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / perPage));
  const visibleOrders = filteredOrders.slice((page - 1) * perPage, page * perPage);
  const drawerOrder = useMemo(() => orders.find((order) => (order._id || order.id) === drawerOrderId), [orders, drawerOrderId]);

  const handleTrackOrder = (orderId) => {
    setDrawerOrderId(orderId);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => setDrawerOpen(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const queryParam = encodeURIComponent(query || '');
      const token = localStorage.getItem('sriTechToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_URL}/orders/me?search=${queryParam}`, { headers });
      if (!res.ok) throw new Error('Failed to load orders');
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : data.orders || []);
    } catch (err) {
      console.error(err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [query, activeStatusFilter, activeDateFilter, activeSort]);
  useEffect(() => { setPage(1); }, [query, activeStatusFilter, activeDateFilter, activeSort]);

  return (
    <div className="premium-orders-page">
      <div className="premium-orders-shell">
        <header className="premium-orders-header">
          <p className="premium-orders-eyebrow">Orders</p>
          <h1>My Orders</h1>
          <p className="premium-orders-subtitle">Browse your purchased products, review delivery status, and access order actions only when needed.</p>
        </header>

        <section className="premium-orders-controls">
          <div className="premium-orders-search">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by Order ID or product name"
              aria-label="Search orders"
            />
            <button type="button" className="premium-orders-btn premium-orders-btn-primary" onClick={() => setPage(1)}>
              Search
            </button>
          </div>

          <div className="premium-orders-chip-groups">
            <div className="premium-orders-filter-group">
              <span>Status</span>
              <div className="premium-orders-chip-row">
                {statusFilters.map((status) => (
                  <button
                    key={status}
                    type="button"
                    className={`premium-orders-chip ${activeStatusFilter === status ? 'active' : ''}`}
                    onClick={() => setActiveStatusFilter(status)}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="premium-orders-filter-group">
              <span>Date</span>
              <div className="premium-orders-chip-row">
                {dateFilters.map((date) => (
                  <button
                    key={date}
                    type="button"
                    className={`premium-orders-chip ${activeDateFilter === date ? 'active' : ''}`}
                    onClick={() => setActiveDateFilter(date)}
                  >
                    {date}
                  </button>
                ))}
              </div>
            </div>

            <div className="premium-orders-filter-group">
              <span>Sort</span>
              <div className="premium-orders-chip-row">
                {sortOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`premium-orders-chip ${activeSort === option ? 'active' : ''}`}
                    onClick={() => setActiveSort(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="premium-orders-summary-grid">
          <div className="premium-orders-summary-card-mini"><span>Total Orders</span><strong>{orderCounts.total}</strong></div>
          <div className="premium-orders-summary-card-mini"><span>Delivered</span><strong>{orderCounts.Delivered}</strong></div>
          <div className="premium-orders-summary-card-mini"><span>Shipped</span><strong>{orderCounts.Shipped}</strong></div>
          <div className="premium-orders-summary-card-mini"><span>Processing</span><strong>{orderCounts.Processing}</strong></div>
          <div className="premium-orders-summary-card-mini"><span>Cancelled</span><strong>{orderCounts.Cancelled}</strong></div>
          <div className="premium-orders-summary-card-mini"><span>Returned</span><strong>{orderCounts.Returned}</strong></div>
        </section>

        {loading ? (
          <div className="premium-orders-skeleton-grid">
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonLoader key={index} />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <EmptyOrders onStartShopping={() => window.location.assign('/')} />
        ) : (
          <>
            <div className="premium-orders-card-list">
              {visibleOrders.map((order) => (
                <OrderCard
                  key={order._id || order.id}
                  order={order}
                  onTrack={() => handleTrackOrder(order._id || order.id)}
                  onViewDetails={() => handleTrackOrder(order._id || order.id)}
                />
              ))}
            </div>
            <div className="premium-orders-pagination-row">
              <Pagination page={page} setPage={setPage} />
            </div>
          </>
        )}
      </div>

      <TrackingDrawer order={drawerOrder} open={drawerOpen} onClose={handleCloseDrawer} />
    </div>
  );
};

export default MyOrders;

import React, { useEffect, useMemo, useState } from 'react';
import './MyOrders.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BACKEND_URL = API_URL.replace(/\/api\/?$/, '');

const getInvoiceUrl = (order) => {
  if (!order) return '';
  const orderId = order.orderId || order._id || order.id || order.invoiceNumber;
  if (orderId) return `${API_URL}/orders/${encodeURIComponent(orderId)}/invoice`;
  const path = order.invoicePdfPath || order.invoiceUrl || order.invoiceLink || '';
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${BACKEND_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

const statusFilters = ['All Orders', 'Delivered', 'Shipped', 'Processing', 'Cancelled', 'Returned'];
const dateFilters   = ['All Time', 'Last 30 Days', 'Last 6 Months'];
const sortOptions   = ['Newest First', 'Oldest First'];
const trackingSteps = ['Order Confirmed', 'Packed', 'Shipped', 'Out For Delivery', 'Delivered'];

const normalizeOrderStatus = (status) => {
  const n = String(status || '').trim().toLowerCase();
  if (['delivered', 'complete', 'completed'].includes(n))                           return 'Delivered';
  if (['out for delivery', 'out-for-delivery', 'on the way'].includes(n))           return 'Out for Delivery';
  if (['shipped', 'dispatch', 'dispatched', 'in transit'].includes(n))              return 'Shipped';
  if (['cancelled', 'canceled', 'returned', 'refunded', 'return requested'].includes(n)) return 'Cancelled';
  return 'Processing';
};

const getBadgeClass = (status) => {
  const n = normalizeOrderStatus(status);
  if (n === 'Delivered')       return 'delivered';
  if (n === 'Shipped')         return 'shipped';
  if (n === 'Out for Delivery') return 'shipped';
  if (n === 'Cancelled')       return 'cancelled';
  if (n === 'Returned')        return 'returned';
  return 'processing';
};

const fmt = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;

const fmtDate = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d) ? String(v) : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getDeliveryLabel = (order) => {
  const d = order.estimatedDelivery || order.deliveryDate || order.deliveredAt;
  if (!d) return 'Delivery date TBD';
  const formatted = fmtDate(d);
  return normalizeOrderStatus(order.status) === 'Delivered' ? `✓ Delivered on ${formatted}` : `Est. delivery ${formatted}`;
};

const getProductImage = (item) => item?.image || item?.images?.[0] || item?.thumbnail || '';

const getProgressIndex = (status) => {
  const n = String(status || '').trim().toLowerCase();
  if (['delivered', 'complete', 'completed'].includes(n))                          return 4;
  if (['out for delivery', 'out-for-delivery', 'on the way'].includes(n))          return 3;
  if (['shipped', 'dispatch', 'dispatched', 'in transit'].includes(n))             return 2;
  if (['cancelled', 'canceled', 'returned', 'refunded', 'return requested'].includes(n)) return 0;
  return 1;
};

const getOrderSummary = (order) => {
  const items = order.items || [];
  const subFromItems = items.reduce((s, i) => s + (Number(i.totalPrice ?? i.price ?? 0) * Number(i.quantity ?? 1)), 0);
  return {
    subTotal: Number(order.subtotal ?? order.subTotal ?? subFromItems),
    discount: Number(order.discount ?? 0),
    coupon:   Number(order.couponAmount ?? 0),
    shipping: Number(order.shippingCost ?? order.shippingCharge ?? 0),
    gst:      Number(order.tax ?? order.gst ?? 0),
    total:    Number(order.grandTotal ?? order.total ?? 0),
    paymentMethod:  order.paymentMethod  || 'N/A',
    transactionId:  order.paymentId || order.orderTransaction || 'N/A',
  };
};

/* ── Sub-components ─────────────────────── */
const StatusBadge = ({ status }) => (
  <span className={`mo-badge ${getBadgeClass(status)}`}>{normalizeOrderStatus(status)}</span>
);

const Skeleton = () => (
  <div className="mo-skeleton-card">
    <div className="mo-skeleton-img" />
    <div className="mo-skeleton-lines">
      <div className="mo-skeleton-line l" />
      <div className="mo-skeleton-line m" />
      <div className="mo-skeleton-line s" />
    </div>
  </div>
);

const EmptyOrders = ({ onShop }) => (
  <div className="mo-empty">
    <div className="mo-empty-icon">🛍️</div>
    <h2>No orders yet</h2>
    <p>Start shopping and your orders will appear here.</p>
    <button className="mo-btn-track" style={{ width: 'auto', padding: '12px 28px', borderRadius: 12 }} onClick={onShop}>
      Start Shopping
    </button>
  </div>
);

const TrackingTimeline = ({ currentIndex }) => (
  <div className="mo-timeline">
    {trackingSteps.map((step, i) => {
      const done = i <= currentIndex;
      return (
        <div key={step} className={`mo-timeline-step${done ? ' done' : ''}`}>
          <div className="mo-timeline-dot">
            {done ? <i className="fa-solid fa-check" /> : i + 1}
          </div>
          <div className="mo-timeline-text">{step}</div>
        </div>
      );
    })}
  </div>
);

const TrackingDrawer = ({ order, open, onClose }) => {
  if (!open || !order) return null;
  const currentIndex = getProgressIndex(order.status);
  const firstItem = (order.items || [])[0] || {};
  const productImage = getProductImage(firstItem);
  const summary = getOrderSummary(order);
  const addr = order.shippingAddress || {};
  const invoiceUrl = getInvoiceUrl(order);

  return (
    <div className="mo-drawer-overlay" onClick={onClose}>
      <div className="mo-drawer" onClick={(e) => e.stopPropagation()}>

        <div className="mo-drawer-header">
          <h2>Order Details</h2>
          <button className="mo-drawer-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        {/* Product preview */}
        <div className="mo-drawer-product">
          <div className="mo-drawer-thumb">
            {productImage
              ? <img src={productImage} alt={firstItem.name || 'Product'} />
              : <span className="mo-img-fallback">{(firstItem.name || 'P').charAt(0)}</span>
            }
          </div>
          <div className="mo-drawer-product-info">
            <h3>{firstItem.name || firstItem.title || 'Product'}</h3>
            <p>Order: {order.orderId || order._id || '—'}</p>
            <p>{order.items?.length || 0} item(s) · {fmt(order.grandTotal ?? order.total ?? 0)}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        {/* Tracking timeline */}
        <div>
          <h3 style={{ margin: '0 0 14px', fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>
            <i className="fa-solid fa-location-dot" style={{ marginRight: 8, color: '#6366f1' }} />
            Tracking Timeline
          </h3>
          <TrackingTimeline currentIndex={currentIndex} />
        </div>

        {/* Info Grid */}
        <div className="mo-info-grid">
          {/* Shipping info */}
          <div className="mo-info-card">
            <h4>📦 Shipping</h4>
            <div className="mo-info-row"><span>Name</span><strong>{addr.name || order.customerName || '—'}</strong></div>
            {addr.phone && <div className="mo-info-row"><span>Phone</span><strong>{addr.phone}</strong></div>}
            <div className="mo-info-row"><span>Address</span><strong>{[addr.addressLine1, addr.city, addr.state].filter(Boolean).join(', ') || '—'}</strong></div>
            <div className="mo-info-row"><span>Courier</span><strong>{order.courierPartner || 'SriTech Express'}</strong></div>
          </div>

          {/* Order summary */}
          <div className="mo-info-card">
            <h4>💳 Payment</h4>
            <div className="mo-info-row"><span>Subtotal</span><strong>{fmt(summary.subTotal)}</strong></div>
            {summary.discount > 0 && <div className="mo-info-row"><span>Discount</span><strong style={{ color: '#16a34a' }}>-{fmt(summary.discount)}</strong></div>}
            <div className="mo-info-row"><span>Shipping</span><strong>{summary.shipping === 0 ? 'FREE' : fmt(summary.shipping)}</strong></div>
            {summary.gst > 0 && <div className="mo-info-row"><span>GST</span><strong>{fmt(summary.gst)}</strong></div>}
            <div className="mo-info-row mo-info-total"><span>Total</span><strong>{fmt(summary.total)}</strong></div>
            <div className="mo-info-row" style={{ marginTop: 6 }}><span>Method</span><strong>{summary.paymentMethod}</strong></div>
          </div>
        </div>

        {/* Actions */}
        <div className="mo-drawer-actions">
          {invoiceUrl && (
            <button className="mo-btn-outline" style={{ flex: 1 }} onClick={() => window.open(invoiceUrl, '_blank')}>
              <i className="fa-solid fa-file-invoice" style={{ marginRight: 6 }} />
              Download Invoice
            </button>
          )}
          <button
            className="mo-btn-ghost"
            onClick={() => window.open(`mailto:support@thesritech.com?subject=Help - Order ${order.orderId || order._id || ''}`, '_self')}
          >
            <i className="fa-solid fa-headset" />
            Contact Support
          </button>
        </div>

      </div>
    </div>
  );
};

const OrderCard = ({ order, onTrack }) => {
  const items = order.items || [];
  const firstItem = items[0] || {};
  const productImage = getProductImage(firstItem);
  const productName = firstItem.name || firstItem.title || 'Product';
  const price = order.grandTotal ?? order.total ?? 0;
  const qty = items.reduce((s, i) => s + (Number(i.quantity) || 1), 0);
  const orderId = order.orderId || order.invoiceNumber || order._id || order.id || '';

  return (
    <article className="mo-card">
      {/* Top Bar */}
      <div className="mo-card-top">
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <span className="mo-card-order-id"># {orderId}</span>
          <span className="mo-card-date">{fmtDate(order.createdAt || order.orderDate)}</span>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Body */}
      <div className="mo-card-body">
        {/* Product Image */}
        <div className="mo-product-img">
          {productImage
            ? <img src={productImage} alt={productName} loading="lazy" />
            : <span className="mo-img-fallback">{productName.charAt(0)}</span>
          }
        </div>

        {/* Product Info */}
        <div className="mo-product-info">
          <h3>{productName}</h3>
          <div className="mo-product-meta">
            <span className="mo-meta-pill">Qty: {qty}</span>
            {items.length > 1 && <span className="mo-meta-pill">{items.length} items</span>}
            <span className="mo-meta-pill">{order.paymentMethod || 'Razorpay'}</span>
          </div>
          <div className="mo-delivery-label">{getDeliveryLabel(order)}</div>

          {/* Additional item thumbnails */}
          {items.length > 1 && (
            <div className="mo-more-items">
              {items.slice(1, 4).map((item, i) => (
                <div key={i} className="mo-more-item-thumb">
                  {getProductImage(item)
                    ? <img src={getProductImage(item)} alt={item.name || 'Product'} />
                    : <div style={{ width: '100%', height: '100%', background: '#e2e8f0' }} />
                  }
                </div>
              ))}
              {items.length > 4 && (
                <div className="mo-more-count">+{items.length - 4}</div>
              )}
            </div>
          )}
        </div>

        {/* Price & Actions */}
        <div className="mo-card-actions">
          <div className="mo-price">{fmt(price)}</div>
          <button className="mo-btn-track" onClick={onTrack}>
            <i className="fa-solid fa-truck-fast" style={{ marginRight: 6 }} />
            Track Order
          </button>
          <button className="mo-btn-outline" onClick={onTrack}>
            View Details
          </button>
          <button
            className="mo-btn-ghost"
            onClick={() => {
              const url = getInvoiceUrl(order);
              if (url) window.open(url, '_blank');
            }}
          >
            <i className="fa-solid fa-file-invoice" />
            Invoice
          </button>
        </div>
      </div>
    </article>
  );
};

/* ── Main Page Component ────────────────── */
const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const perPage = 8;
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Orders');
  const [dateFilter, setDateFilter] = useState('All Time');
  const [sortOrder, setSortOrder] = useState('Newest First');
  const [drawerOrderId, setDrawerOrderId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const counts = useMemo(() => {
    const c = { total: orders.length, Delivered: 0, Shipped: 0, Processing: 0, Cancelled: 0, Returned: 0 };
    orders.forEach((o) => {
      const s = normalizeOrderStatus(o.status);
      if (s === 'Delivered')  c.Delivered++;
      else if (s === 'Shipped') c.Shipped++;
      else if (s === 'Processing') c.Processing++;
      else if (s === 'Cancelled')  c.Cancelled++;
    });
    return c;
  }, [orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders
      .filter((o) => statusFilter === 'All Orders' || normalizeOrderStatus(o.status) === statusFilter)
      .filter((o) => {
        if (dateFilter === 'Last 30 Days')
          return Date.now() - new Date(o.createdAt || o.orderDate || 0) <= 30 * 86400000;
        if (dateFilter === 'Last 6 Months')
          return Date.now() - new Date(o.createdAt || o.orderDate || 0) <= 180 * 86400000;
        return true;
      })
      .filter((o) => {
        if (!q) return true;
        const id = String(o.orderId || o._id || '').toLowerCase();
        const names = (o.items || []).map((i) => String(i.name || '').toLowerCase()).join(' ');
        return id.includes(q) || names.includes(q);
      })
      .sort((a, b) => {
        const ta = new Date(a.createdAt || a.orderDate || 0).getTime();
        const tb = new Date(b.createdAt || b.orderDate || 0).getTime();
        return sortOrder === 'Oldest First' ? ta - tb : tb - ta;
      });
  }, [orders, statusFilter, dateFilter, sortOrder, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const visible    = filtered.slice((page - 1) * perPage, page * perPage);
  const drawerOrder = useMemo(() => orders.find((o) => (o._id || o.id) === drawerOrderId), [orders, drawerOrderId]);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('sriTechToken');
        const res = await fetch(`${API_URL}/orders/me`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : data.orders || []);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [statusFilter, dateFilter, sortOrder]);

  useEffect(() => setPage(1), [query, statusFilter, dateFilter, sortOrder]);

  return (
    <div className="mo-page">
      <div className="mo-shell">

        {/* Header */}
        <div className="mo-header">
          <div className="mo-header-text">
            <h1>My Orders</h1>
            <p>Track deliveries, download invoices, and manage your purchases.</p>
          </div>
          <div className="mo-header-badge">
            <span>Total Orders</span>
            <strong>{counts.total}</strong>
          </div>
        </div>

        {/* Stats */}
        <div className="mo-stats">
          <div className="mo-stat-card">
            <div className="mo-stat-icon delivered"><i className="fa-solid fa-circle-check" /></div>
            <div className="mo-stat-info"><span>Delivered</span><strong>{counts.Delivered}</strong></div>
          </div>
          <div className="mo-stat-card">
            <div className="mo-stat-icon shipped"><i className="fa-solid fa-truck" /></div>
            <div className="mo-stat-info"><span>Shipped</span><strong>{counts.Shipped}</strong></div>
          </div>
          <div className="mo-stat-card">
            <div className="mo-stat-icon processing"><i className="fa-solid fa-gear" /></div>
            <div className="mo-stat-info"><span>Processing</span><strong>{counts.Processing}</strong></div>
          </div>
          <div className="mo-stat-card">
            <div className="mo-stat-icon cancelled"><i className="fa-solid fa-xmark" /></div>
            <div className="mo-stat-info"><span>Cancelled</span><strong>{counts.Cancelled}</strong></div>
          </div>
          <div className="mo-stat-card">
            <div className="mo-stat-icon total"><i className="fa-solid fa-bag-shopping" /></div>
            <div className="mo-stat-info"><span>All Orders</span><strong>{counts.total}</strong></div>
          </div>
        </div>

        {/* Filters */}
        <div className="mo-filters">
          <div className="mo-search-row">
            <input
              className="mo-search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by Order ID or product name…"
              aria-label="Search orders"
            />
            <button className="mo-search-btn" onClick={() => setPage(1)}>
              <i className="fa-solid fa-magnifying-glass" />
            </button>
          </div>

          <div className="mo-filter-row">
            <span className="mo-filter-label">Status</span>
            {statusFilters.map((s) => (
              <button key={s} className={`mo-chip${statusFilter === s ? ' active' : ''}`} onClick={() => setStatusFilter(s)}>
                {s}
              </button>
            ))}
            <div className="mo-divider" />
            <span className="mo-filter-label">Sort</span>
            {sortOptions.map((s) => (
              <button key={s} className={`mo-chip${sortOrder === s ? ' active' : ''}`} onClick={() => setSortOrder(s)}>
                {s}
              </button>
            ))}
          </div>

          <div className="mo-filter-row">
            <span className="mo-filter-label">Date</span>
            {dateFilters.map((d) => (
              <button key={d} className={`mo-chip${dateFilter === d ? ' active' : ''}`} onClick={() => setDateFilter(d)}>
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Order List */}
        {loading ? (
          <div className="mo-list">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyOrders onShop={() => window.location.assign('/')} />
        ) : (
          <>
            <div className="mo-list">
              {visible.map((order) => (
                <OrderCard
                  key={order._id || order.id}
                  order={order}
                  onTrack={() => { setDrawerOrderId(order._id || order.id); setDrawerOpen(true); }}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mo-pagination">
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="mo-btn-outline"
                    style={{ width: 40, height: 40, padding: 0, borderRadius: 10 }}
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >‹</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      style={{
                        width: 40, height: 40, borderRadius: 10, border: '1.5px solid',
                        borderColor: p === page ? '#6366f1' : '#e2e8f0',
                        background: p === page ? '#6366f1' : '#fff',
                        color: p === page ? '#fff' : '#475569',
                        fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'inherit'
                      }}
                    >{p}</button>
                  ))}
                  <button
                    className="mo-btn-outline"
                    style={{ width: 40, height: 40, padding: 0, borderRadius: 10 }}
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >›</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Tracking Drawer */}
      <TrackingDrawer order={drawerOrder} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
};

export default MyOrders;

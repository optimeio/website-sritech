import React from 'react';

const PriceRow = ({ label, value }) => (
  <div className="flex justify-between py-1 text-sm">
    <div className="text-gray-600">{label}</div>
    <div className="font-medium">{value}</div>
  </div>
);

const OrderDetailsModal = ({ order, onClose }) => {
  const billing = order.billingAddress || order.billing || {};
  const shipping = order.shippingAddress || order.shipping || {};
  const items = order.products || order.items || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 transition-opacity" onClick={onClose} />

      <div className="relative bg-white w-[95%] md:w-4/5 lg:w-3/5 rounded-lg shadow-xl transform transition-transform duration-300 scale-100">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <h2 className="text-2xl font-semibold">Order Details</h2>
            <div className="text-sm text-gray-500">Order ID: <span className="font-mono">{order.orderId || order._id}</span></div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 bg-gray-50 p-4 rounded">
              <h3 className="font-semibold mb-2">Items</h3>
              <div className="space-y-3 max-h-64 overflow-auto">
                {items.map((it, idx) => (
                  <div key={idx} className="flex gap-3 items-center">
                    <img src={it.image || '/placeholder.png'} alt={it.name} className="w-16 h-16 object-cover rounded" />
                    <div>
                      <div className="font-medium">{it.name || it.title}</div>
                      <div className="text-sm text-gray-500">{it.brand || it.vendor}</div>
                      <div className="text-sm text-gray-600">Qty: {it.qty || it.quantity || 1}</div>
                    </div>
                    <div className="ml-auto font-semibold">₹{it.price || it.amount || '-'}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <h4 className="font-semibold">Shipping Address</h4>
                  <div className="text-sm text-gray-700 mt-2">
                    {shipping.name && <div>{shipping.name}</div>}
                    {shipping.address && <div>{shipping.address}</div>}
                    {shipping.city && <div>{shipping.city} {shipping.pincode}</div>}
                    {shipping.phone && <div className="text-xs text-gray-500">{shipping.phone}</div>}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold">Billing Address</h4>
                  <div className="text-sm text-gray-700 mt-2">
                    {billing.name && <div>{billing.name}</div>}
                    {billing.address && <div>{billing.address}</div>}
                    {billing.city && <div>{billing.city} {billing.pincode}</div>}
                    {billing.phone && <div className="text-xs text-gray-500">{billing.phone}</div>}
                  </div>
                </div>
              </div>
            </div>

            <aside className="bg-white p-4 rounded border">
              <h4 className="font-semibold">Order Summary</h4>
              <div className="mt-2">
                <PriceRow label="Subtotal" value={`₹${order.subtotal || order.total || order.amount || 0}`} />
                <PriceRow label="Discount" value={`- ₹${order.discount || 0}`} />
                <PriceRow label="Shipping" value={`₹${order.shippingCharges || order.shippingCharge || 0}`} />
                <PriceRow label="GST" value={`₹${order.tax || 0}`} />
                <div className="border-t my-2" />
                <PriceRow label="Total" value={`₹${order.total || order.finalAmount || order.amount || 0}`} />
              </div>

              <div className="mt-4">
                <h5 className="text-sm text-gray-600">Payment</h5>
                <div className="text-sm">{order.paymentMethod || order.payment || '—'}</div>
              </div>

              <div className="mt-4 space-y-2">
                <button className="w-full px-3 py-2 bg-[#2874F0] text-white rounded">Download Invoice</button>
                <button className="w-full px-3 py-2 bg-white border rounded">Contact Support</button>
              </div>
            </aside>
          </div>

          <div className="mt-6 text-right">
            <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded mr-2">Close</button>
            <button className="px-4 py-2 bg-[#2874F0] text-white rounded">Done</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;

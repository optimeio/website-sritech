import React, { useState } from 'react';
import OrderTimeline from './OrderTimeline';
import OrderDetailsModal from './OrderDetailsModal';
import TrackingDrawer from './TrackingDrawer';

const OrderCard = ({ order }) => {
  const [openDetails, setOpenDetails] = useState(false);
  const [openTracking, setOpenTracking] = useState(false);

  const products = order.products || order.items || [];
  const first = products[0] || {};

  return (
    <div className="bg-white rounded-lg p-4 shadow-md flex flex-col md:flex-row gap-4 animate-fade">
      <div className="w-full md:w-40 flex-shrink-0">
        <img src={first.image || '/placeholder.png'} alt={first.name || 'Product'} className="w-full h-28 object-cover rounded" />
      </div>

      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-sm text-gray-500">Order ID: <span className="font-mono text-sm">{order.orderId || order._id}</span></div>
            <h3 className="text-lg font-semibold">{first.name || order.title || 'Order'}</h3>
            <div className="text-sm text-gray-500">{first.brand || (first.vendor || '')}</div>
          </div>

          <div className="text-right">
            <div className="text-sm text-gray-500">{new Date(order.createdAt || order.orderDate || Date.now()).toLocaleDateString()}</div>
            <div className="text-lg font-bold mt-1">₹{order.total || order.amount || (first.price||'—')}</div>
          </div>
        </div>

        <div className="mt-3">
          <OrderTimeline status={order.status || 'Processing'} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={()=>setOpenDetails(true)} className="px-3 py-2 bg-white border rounded hover:shadow">View Details</button>
          <button onClick={()=>setOpenTracking(true)} className="px-3 py-2 bg-[#2874F0] text-white rounded hover:scale-105 transition">Track Order</button>
          <button className="px-3 py-2 bg-white border rounded">Download Invoice</button>
          <button className="px-3 py-2 bg-white border rounded">Buy Again</button>
        </div>
      </div>

      {openDetails && (
        <OrderDetailsModal order={order} onClose={()=>setOpenDetails(false)} />
      )}

      {openTracking && (
        <TrackingDrawer order={order} onClose={()=>setOpenTracking(false)} />
      )}
    </div>
  );
};

export default OrderCard;

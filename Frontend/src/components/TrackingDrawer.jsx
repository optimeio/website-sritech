import React from 'react';

const TimelineItem = ({ time, location, status }) => (
  <div className="flex items-start gap-3">
    <div className="w-2 h-2 rounded-full bg-[#2874F0] mt-1" />
    <div>
      <div className="text-sm font-medium">{status}</div>
      <div className="text-xs text-gray-500">{location} · {time}</div>
    </div>
  </div>
);

const TrackingDrawer = ({ order, onClose }) => {
  const shipment = order.shipment || order.tracking || {};
  const history = shipment.history || order.history || [];

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="ml-auto w-full md:w-1/3 h-full bg-white shadow-xl transform transition-transform duration-300">
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold">Track Order</h3>
              <div className="text-sm text-gray-500">Current Status: <span className="font-medium">{order.status || 'Processing'}</span></div>
            </div>
            <div className="text-sm text-gray-500">{shipment.courier || shipment.partner || '—'}</div>
          </div>

          <div className="mt-4 border rounded p-4">
            <div className="text-sm text-gray-600">Tracking Number</div>
            <div className="font-mono mt-1">{shipment.trackingNumber || shipment.trackingId || order.trackingNumber || '—'}</div>
            <div className="text-xs text-gray-500 mt-2">Current Location: {shipment.currentLocation || '—'}</div>
            <div className="text-xs text-gray-500">Estimated Delivery: {shipment.eta || order.estimatedDelivery || '—'}</div>
          </div>

          <div className="mt-4 overflow-auto flex-1">
            <h4 className="font-semibold mb-2">Shipment History</h4>
            <div className="space-y-3">
              {history.length===0 && <div className="text-sm text-gray-500">No shipment history available.</div>}
              {history.map((h, i) => (
                <TimelineItem key={i} time={h.time || h.timestamp} location={h.location || h.place} status={h.status || h.title} />
              ))}
            </div>
          </div>

          <div className="mt-4">
            <button onClick={onClose} className="px-4 py-2 bg-[#2874F0] text-white rounded">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackingDrawer;

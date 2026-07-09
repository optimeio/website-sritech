import React, { useState } from 'react';

const statuses = ['All','Pending','Processing','Packed','Shipped','Out For Delivery','Delivered','Cancelled','Returned'];

const OrderFilters = ({ filters, setFilters }) => {
  const [open, setOpen] = useState(true);

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <h3 className="font-semibold mb-3">Filters</h3>

      <div>
        <div className="text-sm text-gray-600 mb-2">Order Status</div>
        <div className="flex flex-col gap-2">
          {statuses.map(s => (
            <button key={s} onClick={() => setFilters(prev => ({...prev, status: s}))}
              className={`text-left p-2 rounded ${filters.status===s? 'bg-[#2874F0] text-white':'hover:bg-gray-100'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <div className="text-sm text-gray-600 mb-2">Date</div>
        <div className="flex flex-col gap-2">
          {['Today','Last 7 Days','Last 30 Days','Last 6 Months','Custom Date'].map(d => (
            <button key={d} onClick={() => setFilters(prev => ({...prev, dateRange: d}))}
              className={`text-left p-2 rounded ${filters.dateRange===d? 'bg-[#2874F0] text-white':'hover:bg-gray-100'}`}>
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <div className="text-sm text-gray-600 mb-2">Sort</div>
        <select className="w-full p-2 border rounded" value={filters.sort || ''} onChange={(e)=> setFilters(prev=>({...prev, sort: e.target.value||null}))}>
          <option value="">Relevance</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>
    </div>
  );
};

export default OrderFilters;

import React from 'react';

const OrderSearch = ({ query, setQuery }) => {
  return (
    <div className="bg-white p-3 rounded shadow-sm flex items-center gap-3">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by Order ID, product name or brand"
        className="flex-1 outline-none p-2 text-sm"
      />
      <button className="bg-[#2874F0] text-white px-4 py-2 rounded">Search</button>
    </div>
  );
};

export default OrderSearch;

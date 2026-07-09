import React from 'react';

const InvoiceButton = ({ order }) => {
  const download = () => {
    // placeholder: call API to download invoice PDF
    const url = `/api/orders/${order._id || order.id}/invoice`;
    window.open(url, '_blank');
  };

  return (
    <button onClick={download} className="px-3 py-2 bg-white border rounded">Download Invoice</button>
  );
};

export default InvoiceButton;

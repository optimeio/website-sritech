import React from 'react';

const COMP_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const COMP_BACKEND_URL = COMP_API_URL.replace(/\/api\/?$/, '');

const InvoiceButton = ({ order }) => {
  const orderId = order?._id || order?.id || order?.orderId || order?.invoiceNumber;
  const path = order?.invoicePdfPath || order?.invoiceUrl || order?.invoiceLink || '';
  const invoiceUrl = orderId
    ? `${COMP_API_URL}/orders/${orderId}/invoice`
    : (path ? (path.startsWith('http') ? path : `${COMP_BACKEND_URL}${path.startsWith('/') ? '' : '/'}${path}`) : '');

  if (!invoiceUrl) return null;

  return (
    <button onClick={() => window.open(invoiceUrl, '_blank')} className="px-3 py-2 bg-white border rounded">
      <i className="fa-solid fa-file-invoice" style={{ marginRight: '0.4rem' }} />Download Invoice
    </button>
  );
};

export default InvoiceButton;

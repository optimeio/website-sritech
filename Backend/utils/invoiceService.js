const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const INVOICE_DIR = path.resolve(__dirname, '..', 'uploads', 'invoices');

const ensureInvoiceDirectory = async () => {
  try {
    await fs.promises.mkdir(INVOICE_DIR, { recursive: true });
  } catch (err) {
    console.error('Unable to create invoice directory:', err.message);
  }
};

const formatCurrency = (value) => `₹${Number(value || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

const generateInvoiceNumber = () => `INV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

const companyDetails = {
  name: 'The Sri Tech',
  address: '12 Sustainable Avenue, Green Industrial Park, India',
  gstNumber: 'GSTIN: 29ABCDE1234F1Z5',
  email: process.env.EMAIL_USER || 'theoptime.io@gmail.com',
  phone: '+91 98765 43210',
  website: 'https://thesritech.com',
  terms: 'Goods once sold cannot be returned without authorization. Please keep this invoice safe for warranty and service support.'
};

const buildInvoicePayload = (order) => {
  const items = Array.isArray(order.items) ? order.items.map(item => ({
    product: item.product,
    sku: item.sku || '',
    name: item.name || 'Product',
    image: item.image || '',
    quantity: Number(item.quantity || 1),
    unitPrice: Number(item.price || 0),
    discount: Number(item.discount || 0),
    tax: Number(item.tax || 0),
    totalPrice: Number(item.totalPrice || (Number(item.quantity || 1) * Number(item.price || 0)))
  })) : [];

  return {
    invoiceNumber: order.invoiceNumber || generateInvoiceNumber(),
    orderId: order._id,
    customerId: order.customerId,
    transactionId: order.paymentId || order.paymentOrderId || '',
    invoiceDate: new Date(),
    billingAddress: order.billingAddress || order.shippingAddress || {},
    shippingAddress: order.shippingAddress || {},
    paymentMethod: order.paymentMethod || 'Razorpay',
    paymentStatus: order.paymentStatus || 'Pending',
    items,
    subtotal: Number(order.subtotal || 0),
    discount: Number(order.discount || 0),
    couponDiscount: Number(order.couponAmount || 0) || 0,
    shippingCharges: Number(order.shippingCost || 0),
    tax: Number(order.tax || 0),
    grandTotal: Number(order.grandTotal || 0),
    pdfPath: ''
  };
};

const createInvoicePdf = async (invoice, customerName) => {
  await ensureInvoiceDirectory();
  const fileName = `${invoice.invoiceNumber}.pdf`;
  const filePath = path.join(INVOICE_DIR, fileName);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const writeStream = fs.createWriteStream(filePath);

    writeStream.on('finish', () => resolve(`/uploads/invoices/${fileName}`));
    writeStream.on('error', reject);

    doc.pipe(writeStream);

    doc.fillColor('#1b1f23').fontSize(20).font('Helvetica-Bold').text(companyDetails.name, { align: 'left' });
    doc.moveDown(0.25);
    doc.fontSize(10).font('Helvetica').fillColor('#3f4b55');
    doc.text(companyDetails.address);
    doc.text(companyDetails.gstNumber);
    doc.text(`Email: ${companyDetails.email}`);
    doc.text(`Phone: ${companyDetails.phone}`);
    doc.text(companyDetails.website);

    doc.moveDown(1);
    doc.fillColor('#111827').fontSize(16).font('Helvetica-Bold').text('Invoice', { align: 'right' });
    doc.moveDown(0.25);

    const invoiceDetailsTop = doc.y;
    doc.fontSize(10).font('Helvetica').fillColor('#374151');
    doc.text(`Invoice Number: ${invoice.invoiceNumber}`, { align: 'right' });
    doc.text(`Invoice Date: ${invoice.invoiceDate.toLocaleDateString('en-IN')}`, { align: 'right' });
    doc.text(`Order ID: ${invoice.orderId}`, { align: 'right' });
    doc.text(`Transaction ID: ${invoice.transactionId || 'N/A'}`, { align: 'right' });

    doc.moveDown(1);
    doc.fontSize(11).font('Helvetica-Bold').text('Bill To:', { continued: true });
    doc.font('Helvetica').fontSize(10).text(` ${customerName || 'Customer'}`);
    if (invoice.billingAddress) {
      const addr = [invoice.billingAddress.name, invoice.billingAddress.addressLine1, invoice.billingAddress.addressLine2, `${invoice.billingAddress.city || ''} ${invoice.billingAddress.state || ''} ${invoice.billingAddress.zipCode || ''}`, invoice.billingAddress.country, `Phone: ${invoice.billingAddress.phone || ''}`]
        .filter(Boolean)
        .join('\n');
      doc.text(addr);
    }

    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica-Bold').text('Ship To:', { continued: true });
    doc.font('Helvetica').fontSize(10).text('');
    if (invoice.shippingAddress) {
      const addr = [invoice.shippingAddress.name, invoice.shippingAddress.addressLine1, invoice.shippingAddress.addressLine2, `${invoice.shippingAddress.city || ''} ${invoice.shippingAddress.state || ''} ${invoice.shippingAddress.zipCode || ''}`, invoice.shippingAddress.country, `Phone: ${invoice.shippingAddress.phone || ''}`]
        .filter(Boolean)
        .join('\n');
      doc.text(addr);
    }

    doc.moveDown(1);
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#111827').text('Item Description');
    doc.moveDown(0.2);
    const tableTop = doc.y;
    const columnWidths = [170, 60, 50, 60, 60, 60];
    const headers = ['Product', 'SKU', 'Qty', 'Unit Price', 'Tax', 'Total'];

    doc.fontSize(10).font('Helvetica-Bold');
    headers.forEach((header, idx) => {
      doc.text(header, 40 + columnWidths.slice(0, idx).reduce((sum, w) => sum + w, 0), tableTop, { width: columnWidths[idx], align: 'left' });
    });

    doc.moveDown(0.8);
    doc.font('Helvetica').fontSize(9);
    invoice.items.forEach(item => {
      const y = doc.y;
      doc.text(item.name, 40, y, { width: columnWidths[0], align: 'left' });
      doc.text(item.sku || '-', 40 + columnWidths[0], y, { width: columnWidths[1], align: 'left' });
      doc.text(String(item.quantity), 40 + columnWidths[0] + columnWidths[1], y, { width: columnWidths[2], align: 'left' });
      doc.text(formatCurrency(item.unitPrice), 40 + columnWidths[0] + columnWidths[1] + columnWidths[2], y, { width: columnWidths[3], align: 'left' });
      doc.text(formatCurrency(item.tax), 40 + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3], y, { width: columnWidths[4], align: 'left' });
      doc.text(formatCurrency(item.totalPrice), 40 + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3] + columnWidths[4], y, { width: columnWidths[5], align: 'left' });
      doc.moveDown(0.8);
    });

    doc.moveDown(0.5);
    const summaryTop = doc.y;
    doc.fontSize(10).font('Helvetica');
    doc.text('Subtotal', 340, summaryTop, { width: 120, align: 'left' });
    doc.text(formatCurrency(invoice.subtotal), 450, summaryTop, { width: 120, align: 'right' });
    doc.text('Discount', 340, doc.y, { width: 120, align: 'left' });
    doc.text(formatCurrency(invoice.discount + invoice.couponDiscount), 450, doc.y, { width: 120, align: 'right' });
    doc.text('Shipping', 340, doc.y, { width: 120, align: 'left' });
    doc.text(formatCurrency(invoice.shippingCharges), 450, doc.y, { width: 120, align: 'right' });
    doc.text('Tax', 340, doc.y, { width: 120, align: 'left' });
    doc.text(formatCurrency(invoice.tax), 450, doc.y, { width: 120, align: 'right' });
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').text('Grand Total', 340, doc.y, { width: 120, align: 'left' });
    doc.text(formatCurrency(invoice.grandTotal), 450, doc.y, { width: 120, align: 'right' });

    doc.moveDown(2);
    doc.fontSize(10).font('Helvetica').fillColor('#6b7280').text(companyDetails.terms, { width: 520, align: 'left' });
    doc.moveDown(1);
    doc.font('Helvetica-Bold').fillColor('#111827').text('Thank you for your purchase!', { align: 'center' });

    doc.end();
  });
};

module.exports = {
  buildInvoicePayload,
  createInvoicePdf,
  generateInvoiceNumber
};

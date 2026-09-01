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
  phone: process.env.SUPPORT_PHONE || '+91 94883 16728',
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
    const doc = new PDFDocument({ size: 'A4', margin: 30 });
    const writeStream = fs.createWriteStream(filePath);

    writeStream.on('finish', () => resolve(`/uploads/invoices/${fileName}`));
    writeStream.on('error', reject);

    doc.pipe(writeStream);

    const pageWidth = 535;
    const startX = 30;

    // 1. Top Header Banner - Black & Red Modern Pill Style
    doc.roundedRect(startX, 26, pageWidth, 32, 6).fill('#111827');
    doc.roundedRect(startX, 26, 12, 32, 4).fill('#DC2626');
    doc.fillColor('#FFFFFF').fontSize(12).font('Helvetica-Bold').text('OFFICIAL TAX INVOICE', startX + 20, 36, { width: pageWidth - 40, align: 'center' });

    // 2. Company Brand & Contact Section
    doc.moveDown(1.6);
    const headerY = doc.y;
    doc.fillColor('#DC2626').fontSize(22).font('Helvetica-Bold').text('THE SRI TECH', startX, headerY);
    doc.fillColor('#16A34A').fontSize(9).font('Helvetica-Bold').text('HIGH-EFFICIENCY ENGINEERING & SUSTAINABLE SOLUTIONS', startX, headerY + 24);
    doc.fillColor('#4B5563').fontSize(8.5).font('Helvetica');
    doc.text('12 Sustainable Avenue, Green Industrial Park, Salem, Tamil Nadu - 636004 | GSTIN: 29ABCDE1234F1Z5', startX, headerY + 36);

    doc.moveTo(startX, headerY + 50).lineTo(startX + pageWidth, headerY + 50).strokeColor('#DC2626').lineWidth(2).stroke();

    // 3. Grid Metadata Cards (Subtle borders & modern padding)
    const grid1Y = headerY + 58;
    const colW = pageWidth / 4;
    const rowH = 36;

    doc.lineWidth(0.5).strokeColor('#E5E7EB');

    // Box 1
    doc.roundedRect(startX, grid1Y, colW - 4, rowH, 4).fillAndStroke('#F9FAFB', '#E5E7EB');
    doc.fillColor('#DC2626').fontSize(7).font('Helvetica-Bold').text('INVOICE / BILL NO', startX + 6, grid1Y + 6);
    doc.fillColor('#111827').fontSize(9).font('Helvetica-Bold').text(invoice.invoiceNumber || invoice.orderId || '—', startX + 6, grid1Y + 17);

    // Box 2
    doc.roundedRect(startX + colW, grid1Y, colW - 4, rowH, 4).fillAndStroke('#F9FAFB', '#E5E7EB');
    doc.fillColor('#DC2626').fontSize(7).font('Helvetica-Bold').text('INVOICE DATE', startX + colW + 6, grid1Y + 6);
    const dateStr = invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');
    doc.fillColor('#111827').fontSize(9).font('Helvetica').text(dateStr, startX + colW + 6, grid1Y + 17);

    // Box 3
    doc.roundedRect(startX + colW * 2, grid1Y, colW - 4, rowH, 4).fillAndStroke('#F9FAFB', '#E5E7EB');
    doc.fillColor('#DC2626').fontSize(7).font('Helvetica-Bold').text('ORDER / CHALLAN NO', startX + colW * 2 + 6, grid1Y + 6);
    doc.fillColor('#111827').fontSize(9).font('Helvetica').text(invoice.orderId || '—', startX + colW * 2 + 6, grid1Y + 17);

    // Box 4
    doc.roundedRect(startX + colW * 3, grid1Y, colW - 4, rowH, 4).fillAndStroke('#F9FAFB', '#E5E7EB');
    doc.fillColor('#DC2626').fontSize(7).font('Helvetica-Bold').text('ORDER DATE', startX + colW * 3 + 6, grid1Y + 6);
    doc.fillColor('#111827').fontSize(9).font('Helvetica').text(dateStr, startX + colW * 3 + 6, grid1Y + 17);

    // Buyer & Shipping Info Card
    const grid2Y = grid1Y + rowH + 6;
    const colW3_1 = pageWidth / 3;
    const colW3_2 = pageWidth / 3;
    const colW3_3 = pageWidth / 3;
    const rowH2 = 38;

    // Buyer
    doc.roundedRect(startX, grid2Y, colW3_1 - 4, rowH2, 4).stroke('#E5E7EB');
    doc.fillColor('#111827').fontSize(7).font('Helvetica-Bold').text('BUYER NAME', startX + 6, grid2Y + 5);
    doc.fillColor('#DC2626').fontSize(9).font('Helvetica-Bold').text(customerName || invoice.billingAddress?.name || 'Customer', startX + 6, grid2Y + 16);

    // Courier Partner
    doc.roundedRect(startX + colW3_1, grid2Y, colW3_2 - 4, rowH2, 4).stroke('#E5E7EB');
    doc.fillColor('#111827').fontSize(7).font('Helvetica-Bold').text('COURIER PARTNER', startX + colW3_1 + 6, grid2Y + 5);
    doc.fillColor('#111827').fontSize(9).font('Helvetica-Bold').text(invoice.courierPartner || 'ST Couriers', startX + colW3_1 + 6, grid2Y + 16);

    // Payment Method
    doc.roundedRect(startX + colW3_1 + colW3_2, grid2Y, colW3_3 - 4, rowH2, 4).stroke('#E5E7EB');
    doc.fillColor('#111827').fontSize(7).font('Helvetica-Bold').text('PAYMENT METHOD', startX + colW3_1 + colW3_2 + 6, grid2Y + 5);
    doc.fillColor('#111827').fontSize(9).font('Helvetica').text(invoice.paymentMethod || 'Razorpay', startX + colW3_1 + colW3_2 + 6, grid2Y + 16);

    // Address & Phone & Payment Status
    const grid3Y = grid2Y + rowH2 + 6;
    const rowH3 = 48;

    doc.roundedRect(startX, grid3Y, colW3_1 - 4, rowH3, 4).stroke('#E5E7EB');
    doc.fillColor('#111827').fontSize(7).font('Helvetica-Bold').text('DELIVERY ADDRESS', startX + 6, grid3Y + 5);
    const addrText = [invoice.shippingAddress?.addressLine1, invoice.shippingAddress?.city, invoice.shippingAddress?.state].filter(Boolean).join(', ') || 'Tamil Nadu, India';
    doc.fillColor('#374151').fontSize(8).font('Helvetica').text(addrText, startX + 6, grid3Y + 16, { width: colW3_1 - 16 });

    doc.roundedRect(startX + colW3_1, grid3Y, colW3_2 - 4, rowH3, 4).stroke('#E5E7EB');
    doc.fillColor('#111827').fontSize(7).font('Helvetica-Bold').text('PHONE NUMBER', startX + colW3_1 + 6, grid3Y + 5);
    doc.fillColor('#111827').fontSize(9).font('Helvetica').text(invoice.shippingAddress?.phone || invoice.billingAddress?.phone || process.env.SUPPORT_PHONE || '+91 94883 16728', startX + colW3_1 + 6, grid3Y + 16);

    doc.roundedRect(startX + colW3_1 + colW3_2, grid3Y, colW3_3 - 4, rowH3, 4).stroke('#E5E7EB');
    doc.fillColor('#111827').fontSize(7).font('Helvetica-Bold').text('PAYMENT STATUS', startX + colW3_1 + colW3_2 + 6, grid3Y + 5);
    doc.fillColor('#16A34A').fontSize(10).font('Helvetica-Bold').text('PAID ✔', startX + colW3_1 + colW3_2 + 6, grid3Y + 16);

    // 4. Itemized Table - Premium Rounded Card Design
    const tableY = grid3Y + rowH3 + 14;
    const tableHeaderH = 24;

    doc.roundedRect(startX, tableY, pageWidth, tableHeaderH, 4).fill('#111827');

    const cols = [
      { label: 'S.NO', x: startX + 5, w: 35, align: 'left' },
      { label: 'PRODUCT NAME', x: startX + 40, w: 150, align: 'left' },
      { label: 'HSN/SAC', x: startX + 190, w: 60, align: 'center' },
      { label: 'QTY', x: startX + 250, w: 35, align: 'center' },
      { label: 'RATE (₹)', x: startX + 285, w: 65, align: 'right' },
      { label: 'TAXABLE VALUE', x: startX + 350, w: 70, align: 'right' },
      { label: 'CGST 9%', x: startX + 420, w: 55, align: 'right' },
      { label: 'SGST 9%', x: startX + 475, w: 55, align: 'right' }
    ];

    doc.fillColor('#FFFFFF').fontSize(7.5).font('Helvetica-Bold');
    cols.forEach(c => doc.text(c.label, c.x, tableY + 7, { width: c.w, align: c.align }));

    let currentY = tableY + tableHeaderH;
    let totalTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalGrand = 0;

    invoice.items.forEach((item, index) => {
      const itemPrice = Number(item.unitPrice || item.price || 0);
      const qty = Number(item.quantity || 1);
      const lineTotal = itemPrice * qty;
      const taxable = Number((lineTotal / 1.18).toFixed(2));
      const gstVal = Number((lineTotal - taxable).toFixed(2));
      const cgst = Number((gstVal / 2).toFixed(2));
      const sgst = Number((gstVal / 2).toFixed(2));

      totalTaxable += taxable;
      totalCgst += cgst;
      totalSgst += sgst;
      totalGrand += lineTotal;

      const rowHeight = 24;
      const rowBg = index % 2 === 0 ? '#FFFFFF' : '#F9FAFB';
      doc.rect(startX, currentY, pageWidth, rowHeight).fillAndStroke(rowBg, '#E5E7EB');

      doc.fillColor('#111827').fontSize(8.5).font('Helvetica');
      doc.text(String(index + 1), cols[0].x, currentY + 7, { width: cols[0].w, align: cols[0].align });
      doc.fillColor('#DC2626').font('Helvetica-Bold').text(item.name || 'Product', cols[1].x, currentY + 7, { width: cols[1].w, align: cols[1].align });
      doc.fillColor('#111827').font('Helvetica');
      doc.text(item.sku || '9988', cols[2].x, currentY + 7, { width: cols[2].w, align: cols[2].align });
      doc.text(String(qty), cols[3].x, currentY + 7, { width: cols[3].w, align: cols[3].align });
      doc.text(itemPrice.toFixed(2), cols[4].x, currentY + 7, { width: cols[4].w, align: cols[4].align });
      doc.text(taxable.toFixed(2), cols[5].x, currentY + 7, { width: cols[5].w, align: cols[5].align });
      doc.text(cgst.toFixed(2), cols[6].x, currentY + 7, { width: cols[6].w, align: cols[6].align });
      doc.text(sgst.toFixed(2), cols[7].x, currentY + 7, { width: cols[7].w, align: cols[7].align });

      currentY += rowHeight;
    });

    // Total Bar
    doc.rect(startX, currentY, pageWidth, 22).fillAndStroke('#FEF2F2', '#FCA5A5');
    doc.fillColor('#DC2626').fontSize(8.5).font('Helvetica-Bold');
    doc.text('Total', cols[3].x, currentY + 6, { width: cols[3].w, align: 'center' });
    doc.text(totalTaxable.toFixed(2), cols[5].x, currentY + 6, { width: cols[5].w, align: 'right' });
    doc.text(totalCgst.toFixed(2), cols[6].x, currentY + 6, { width: cols[6].w, align: 'right' });
    doc.text(totalSgst.toFixed(2), cols[7].x, currentY + 6, { width: cols[7].w, align: 'right' });

    currentY += 30;

    // 5. Amount in Words
    doc.fillColor('#DC2626').fontSize(7.5).font('Helvetica-Bold').text('AMOUNT IN WORDS', startX, currentY);
    doc.fillColor('#16A34A').fontSize(9).font('Helvetica-Bold').text(`Indian Rupees ${invoice.grandTotal || totalGrand.toFixed(2)} Only`, startX, currentY + 12);

    // 6. Summary Card (Right Aligned)
    const summaryX = startX + 310;
    const summaryW = 225;
    const summaryY = currentY;

    doc.roundedRect(summaryX, summaryY - 4, summaryW, 64, 4).fillAndStroke('#F9FAFB', '#E5E7EB');

    doc.fontSize(8.5).font('Helvetica').fillColor('#374151');
    doc.text('Taxable Amount:', summaryX + 10, summaryY, { width: 110, align: 'left' });
    doc.fillColor('#111827').text(`₹${totalTaxable.toFixed(2)}`, summaryX + 115, summaryY, { width: 100, align: 'right' });

    doc.fillColor('#374151').text('Total Tax (GST 18%):', summaryX + 10, summaryY + 16, { width: 110, align: 'left' });
    doc.fillColor('#111827').text(`₹${(totalCgst + totalSgst).toFixed(2)}`, summaryX + 115, summaryY + 16, { width: 100, align: 'right' });

    doc.moveTo(summaryX + 10, summaryY + 34).lineTo(summaryX + summaryW - 10, summaryY + 34).strokeColor('#DC2626').lineWidth(1).stroke();

    doc.fillColor('#DC2626').fontSize(10.5).font('Helvetica-Bold').text('Grand Total:', summaryX + 10, summaryY + 40, { width: 110, align: 'left' });
    doc.fillColor('#16A34A').fontSize(10.5).font('Helvetica-Bold').text(`₹${(invoice.grandTotal || totalGrand).toFixed(2)}`, summaryX + 115, summaryY + 40, { width: 100, align: 'right' });

    // 7. Footer Disclaimer
    doc.fontSize(8).font('Helvetica').fillColor('#6B7280').text('This is a computer-generated tax invoice. No signature required.', startX, 750, { width: pageWidth, align: 'center' });
    doc.fillColor('#16A34A').font('Helvetica-Bold').text('Thank you for choosing The Sri Tech!', startX, 762, { width: pageWidth, align: 'center' });

    doc.end();
  });
};

module.exports = {
  buildInvoicePayload,
  createInvoicePdf,
  generateInvoiceNumber
};

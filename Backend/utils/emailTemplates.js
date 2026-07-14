const company = {
  name: 'SriTech Engineering',
  logoUrl: 'https://website.sritechengg.in/sri-tech-logo-final.png',
  supportEmail: process.env.SUPPORT_EMAIL || 'thesmgroups@gmail.com',
  supportPhone: process.env.SUPPORT_PHONE || '+91 98765 43210',
  websiteUrl: process.env.CLIENT_URL || 'https://website.sritechengg.in',
  address: '12 Sustainable Avenue, Green Industrial Park, India'
};

const globalStyles = `
  body { margin: 0; font-family: 'Inter', sans-serif; background: #f8fafc; color: #0f172a; }
  .wrapper { width: 100%; background: #f8fafc; padding: 20px 0; }
  .container { width: 100%; max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 18px; overflow: hidden; border: 1px solid #e2e8f0; }
  .header { background: #064e3b; color: #ffffff; text-align: center; padding: 28px 24px; }
  .header img { max-height: 48px; margin-bottom: 12px; }
  .header h1 { margin: 0; font-size: 24px; letter-spacing: 0.02em; }
  .body { padding: 28px 24px; }
  .section { margin-bottom: 24px; }
  .section h2 { margin: 0 0 16px; font-size: 18px; color: #0f172a; }
  .button { display: inline-block; background: #10b981; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 999px; font-weight: 600; }
  .muted { color: #64748b; font-size: 14px; line-height: 1.7; }
  .order-summary, .details-table { width: 100%; border-collapse: collapse; }
  .order-summary td, .details-table td { padding: 10px 0; }
  .details-table th, .details-table td { text-align: left; border-bottom: 1px solid #e2e8f0; padding: 10px 0; }
  .footer { background: #f1f5f9; color: #475569; font-size: 13px; padding: 20px 24px; text-align: center; }
`;

const wrap = (subject, title, bodyHtml) => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${subject}</title>
    <style>${globalStyles}</style>
  </head>
  <body>
    <div class="wrapper">
      <div class="container">
        <div class="header">
          <img src="${company.logoUrl}" alt="${company.name} Logo" />
          <h1>${title}</h1>
        </div>
        <div class="body">${bodyHtml}</div>
        <div class="footer">
          <p>${company.name} | ${company.address}</p>
          <p>Support: <a href="mailto:${company.supportEmail}" style="color: #0f172a; text-decoration: none;">${company.supportEmail}</a> | ${company.supportPhone}</p>
          <p><a href="${company.websiteUrl}" style="color: #064e3b; text-decoration: none;">${company.websiteUrl}</a></p>
        </div>
      </div>
    </div>
  </body>
  </html>
`;

const customerGreeting = (name) => `<p style="margin: 0 0 16px; font-size: 16px;">Hello ${name || 'Customer'},</p>`;
const orderItemRows = (items = []) => items.map(item => `
  <tr>
    <td>${item.name || item.sku || 'Product'}</td>
    <td>${item.quantity || 1}</td>
    <td>₹${Number(item.price || 0).toLocaleString('en-IN')}</td>
    <td>₹${Number(item.totalPrice || (item.quantity * item.price) || 0).toLocaleString('en-IN')}</td>
  </tr>
`).join('');

const orderDetailsSection = (order) => `
  <div class="section">
    <h2>Order Details</h2>
    <table class="details-table">
      <tr><th>Order ID</th><td>${order.orderId || order.invoiceNumber || 'N/A'}</td></tr>
      <tr><th>Status</th><td>${order.status || 'Pending'}</td></tr>
      <tr><th>Payment</th><td>${order.paymentStatus || 'Pending'}</td></tr>
      <tr><th>Total</th><td>₹${Number(order.grandTotal || order.totalAmount || 0).toLocaleString('en-IN')}</td></tr>
    </table>
  </div>
`;

const itemsTable = (order) => `
  <div class="section">
    <h2>Product Summary</h2>
    <table class="details-table">
      <thead>
        <tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr>
      </thead>
      <tbody>
        ${orderItemRows(order.items || [])}
      </tbody>
    </table>
  </div>
`;

const actionButton = (label, url) => url ? `<p style="text-align:center; margin: 24px 0;"><a href="${url}" class="button" target="_blank" rel="noopener">${label}</a></p>` : '';

const templates = {
  registration: ({ name }) => wrap('Welcome to The Sri Tech', 'Welcome to The Sri Tech', `
    ${customerGreeting(name)}
    <p class="muted">Your account has been created successfully. We are excited to help you discover our sustainable engineering solutions.</p>
    ${actionButton('Explore Products', company.websiteUrl)}
    <p class="muted">If you have questions, reply to this email anytime.</p>
  `),

  emailVerification: ({ name, otp, verifyUrl }) => wrap('Verify Your Email', 'Verify Your Email', `
    ${customerGreeting(name)}
    <p class="muted">Please verify your email address to complete registration.</p>
    ${otp ? `<p style="font-size: 20px; font-weight: 700; margin: 16px 0;">Your verification code is: <span style="letter-spacing: 0.15em;">${otp}</span></p>` : ''}
    ${verifyUrl ? actionButton('Verify Email', verifyUrl) : ''}
    <p class="muted">This code is valid for 10 minutes. If you did not request this, ignore this message.</p>
  `),

  passwordReset: ({ name, resetUrl }) => wrap('Reset Your Password', 'Password Reset Request', `
    ${customerGreeting(name)}
    <p class="muted">We received a request to reset your password. Click the button below to continue.</p>
    ${actionButton('Reset Password', resetUrl)}
    <p class="muted">If you did not request this, your account is still safe.</p>
  `),

  paymentSuccessful: ({ order, viewOrderUrl, invoiceUrl }) => wrap(`Payment Received — ${order.orderId}`, 'Payment Successful', `
    ${customerGreeting(order.customerName)}
    <p class="muted">We have successfully received your payment.</p>
    ${orderDetailsSection(order)}
    ${itemsTable(order)}
    ${actionButton('View Order', viewOrderUrl)}
    ${actionButton('Download Invoice', invoiceUrl)}
  `),

  orderConfirmation: ({ order, viewOrderUrl, invoiceUrl }) => wrap(`Order Confirmed — ${order.orderId}`, 'Order Confirmed', `
    ${customerGreeting(order.customerName)}
    <p class="muted">Your order is confirmed and will be processed shortly.</p>
    ${orderDetailsSection(order)}
    ${itemsTable(order)}
    ${actionButton('Track Your Order', viewOrderUrl)}
    ${actionButton('Download Invoice', invoiceUrl)}
  `),

  orderStatusUpdate: ({ order, statusTitle, statusNote, viewOrderUrl, trackingUrl, invoiceUrl }) => wrap(`Order Update — ${order.orderId}`, statusTitle, `
    ${customerGreeting(order.customerName)}
    <p class="muted">Current status: <strong>${order.status}</strong></p>
    <p>${statusNote}</p>
    ${orderDetailsSection(order)}
    <div class="section">
      <h2>Delivery Details</h2>
      <table class="details-table">
        <tr><th>Estimated Delivery</th><td>${order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Not available yet'}</td></tr>
        <tr><th>Courier</th><td>${order.courierPartner || 'Not assigned yet'}</td></tr>
      </table>
    </div>
    ${itemsTable(order)}
    ${trackingUrl ? actionButton('Track Shipment', trackingUrl) : ''}
    ${viewOrderUrl ? actionButton('View Order', viewOrderUrl) : ''}
    ${invoiceUrl ? actionButton('Download Invoice', invoiceUrl) : ''}
  `),

  returnRequest: ({ order, returnRequest, viewOrderUrl }) => wrap(`Return Request Received — ${order.orderId}`, 'Return Request Submitted', `
    ${customerGreeting(order.customerName)}
    <p class="muted">We have received your return request and will review it shortly.</p>
    <div class="section">
      <h2>Return Details</h2>
      <table class="details-table">
        <tr><th>Request ID</th><td>${returnRequest.returnId}</td></tr>
        <tr><th>Reason</th><td>${returnRequest.reason}</td></tr>
        <tr><th>Quantity</th><td>${returnRequest.quantity}</td></tr>
      </table>
    </div>
    ${actionButton('View Order', viewOrderUrl)}
  `),

  returnStatusUpdate: ({ order, returnRequest, statusTitle, statusNote, viewOrderUrl }) => wrap(`Return Update — ${order.orderId}`, statusTitle, `
    ${customerGreeting(order.customerName)}
    <p class="muted">Your return request is now <strong>${returnRequest.status}</strong>.</p>
    <div class="section">
      <h2>Return Request</h2>
      <table class="details-table">
        <tr><th>Request ID</th><td>${returnRequest.returnId}</td></tr>
        <tr><th>Status</th><td>${returnRequest.status}</td></tr>
        <tr><th>Note</th><td>${statusNote}</td></tr>
      </table>
    </div>
    ${actionButton('View Order', viewOrderUrl)}
  `),

  refundStatusUpdate: ({ order, refundRequest, statusTitle, statusNote, viewOrderUrl }) => wrap(`Refund Update — ${order.orderId}`, statusTitle, `
    ${customerGreeting(order.customerName)}
    <p class="muted">Your refund request is now <strong>${refundRequest.status}</strong>.</p>
    <div class="section">
      <h2>Refund Details</h2>
      <table class="details-table">
        <tr><th>Refund ID</th><td>${refundRequest.refundId}</td></tr>
        <tr><th>Amount</th><td>₹${Number(refundRequest.refundAmount || 0).toLocaleString('en-IN')}</td></tr>
        <tr><th>Status</th><td>${refundRequest.status}</td></tr>
      </table>
    </div>
    ${actionButton('View Order', viewOrderUrl)}
  `),

  adminOrderNotification: ({ order, note, adminUrl, invoiceUrl }) => wrap(`New Order Received — ${order.orderId}`, 'New Order Received', `
    <p class="muted">A new order has been placed on ${company.name}.</p>
    <div class="section">
      <table class="details-table">
        <tr><th>Order ID</th><td>${order.orderId}</td></tr>
        <tr><th>Customer</th><td>${order.customerName}</td></tr>
        <tr><th>Total</th><td>₹${Number(order.grandTotal || order.totalAmount || 0).toLocaleString('en-IN')}</td></tr>
        <tr><th>Payment Status</th><td>${order.paymentStatus}</td></tr>
      </table>
    </div>
    <p class="muted">${note || 'Please review this order in the admin dashboard.'}</p>
    ${actionButton('Open Admin Dashboard', adminUrl)}
    ${invoiceUrl ? actionButton('Download Invoice', invoiceUrl) : ''}
  `),

  adminReturnNotification: ({ order, returnRequest, adminUrl }) => wrap(`Return Request Received — ${order.orderId}`, 'New Return Request', `
    <p class="muted">A return request has been submitted for order ${order.orderId}.</p>
    <div class="section">
      <table class="details-table">
        <tr><th>Order ID</th><td>${order.orderId}</td></tr>
        <tr><th>Return ID</th><td>${returnRequest.returnId}</td></tr>
        <tr><th>Reason</th><td>${returnRequest.reason}</td></tr>
      </table>
    </div>
    ${actionButton('Review Request', adminUrl)}
  `),

  adminRefundNotification: ({ order, refundRequest, adminUrl }) => wrap(`Refund Request Received — ${order.orderId}`, 'New Refund Request', `
    <p class="muted">A refund request has been submitted for order ${order.orderId}.</p>
    <div class="section">
      <table class="details-table">
        <tr><th>Order ID</th><td>${order.orderId}</td></tr>
        <tr><th>Refund ID</th><td>${refundRequest.refundId}</td></tr>
        <tr><th>Amount</th><td>₹${Number(refundRequest.refundAmount || 0).toLocaleString('en-IN')}</td></tr>
      </table>
    </div>
    ${actionButton('Review Request', adminUrl)}
  `),

  supportSubmission: ({ supportQuery, adminUrl }) => wrap(`New Customer Contact — ${supportQuery.subject}`, 'New Customer Contact', `
    <p class="muted">A customer has submitted a support request.</p>
    <div class="section">
      <table class="details-table">
        <tr><th>Name</th><td>${supportQuery.customerName}</td></tr>
        <tr><th>Email</th><td>${supportQuery.email}</td></tr>
        <tr><th>Subject</th><td>${supportQuery.subject}</td></tr>
      </table>
    </div>
    <p class="muted">Please review the request and respond from the admin panel.</p>
    ${actionButton('View Support Ticket', adminUrl)}
  `),

  supportResponse: ({ name, subject, response }) => wrap(`Response to your support request — ${subject}`, 'Support Response', `
    ${customerGreeting(name)}
    <p class="muted">We have responded to your support request.</p>
    <div class="section">
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Response:</strong></p>
      <p>${response}</p>
    </div>
    <p class="muted">If you need further assistance, reply to this email anytime.</p>
  `),

  supportAutoConfirmation: ({ supportQuery }) => wrap(`We received your complaint — ${supportQuery.subject}`, 'Complaint Received', `
    ${customerGreeting(supportQuery.customerName)}
    <p class="muted">Thank you for contacting Sri Tech. We have successfully received your complaint and created a support ticket.</p>
    <div class="section">
      <table class="details-table">
        <tr><th>Ticket ID</th><td>${supportQuery._id}</td></tr>
        <tr><th>Subject</th><td>${supportQuery.subject}</td></tr>
        <tr><th>Message</th><td>${supportQuery.message}</td></tr>
      </table>
    </div>
    <p class="muted">Our customer support team is reviewing your ticket and will get back to you shortly. You do not need to reply to this email.</p>
  `)
};

module.exports = { templates, company };

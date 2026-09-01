const company = {
  name: 'SriTech Engineering',
  logoUrl: 'https://sritechengg.in/logo.png',
  supportEmail: process.env.SUPPORT_EMAIL || 'thesmgroups@gmail.com',
  supportPhone: process.env.SUPPORT_PHONE || '+91 98765 43210',
  websiteUrl: process.env.CLIENT_URL || 'https://sritechengg.in',
  address: '12 Sustainable Avenue, Green Industrial Park, India'
};

const globalStyles = `
  body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; color: #0f172a; -webkit-font-smoothing: antialiased; }
  .email-wrapper { width: 100%; background-color: #f1f5f9; padding: 36px 12px; }
  .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); }
  .header-banner { background: linear-gradient(135deg, #064e3b 0%, #022c22 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
  .email-body { padding: 32px 28px; color: #1e293b; font-size: 15px; line-height: 1.65; }
  .email-footer { background-color: #f8fafc; padding: 24px; text-align: center; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; line-height: 1.6; }
  .button { display: inline-block; background-color: #059669; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 15px; text-align: center; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25); }
  .muted { color: #64748b; font-size: 14px; line-height: 1.65; margin: 16px 0; }
  .details-table { width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 14px; }
  .details-table th, .details-table td { padding: 12px 14px; border-bottom: 1px solid #f1f5f9; text-align: left; }
  .details-table th { background: #f8fafc; font-weight: 600; color: #475569; width: 35%; }
  .details-table td { color: #0f172a; }
  .section { margin-bottom: 24px; }
  .section h2 { margin: 0 0 14px; font-size: 14px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; }
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
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;">
  <div class="email-wrapper" style="width: 100%; background-color: #f1f5f9; padding: 36px 12px;">
    <div class="email-container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
      <!-- Header Banner -->
      <div class="header-banner" style="background: linear-gradient(135deg, #064e3b 0%, #022c22 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
        <a href="${company.websiteUrl}" target="_blank" style="text-decoration: none;">
          <img src="${company.logoUrl}" alt="${company.name} Logo" style="max-height: 52px; max-width: 220px; width: auto; margin-bottom: 8px; display: inline-block; border: 0; outline: none;" />
          <div style="font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: 1px; margin: 0; text-transform: uppercase;">${company.name}</div>
          <div style="font-size: 12px; color: #a7f3d0; margin-top: 2px; font-weight: 500; letter-spacing: 0.5px;">HIGH-EFFICIENCY CLEAN ENERGY TECHNOLOGY</div>
        </a>
        <div style="margin-top: 18px; font-size: 20px; font-weight: 700; color: #ffffff; border-top: 1px solid rgba(255,255,255,0.15); padding-top: 14px;">
          ${title}
        </div>
      </div>

      <!-- Main Body Content -->
      <div class="email-body" style="padding: 32px 28px; color: #1e293b; font-size: 15px; line-height: 1.65;">
        ${bodyHtml}
      </div>

      <!-- Footer -->
      <div class="email-footer" style="background-color: #f8fafc; padding: 24px; text-align: center; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; line-height: 1.6;">
        <p style="margin: 0 0 6px; font-weight: 700; color: #0f172a; font-size: 14px;">${company.name}</p>
        <p style="margin: 0 0 10px; font-size: 12px; color: #64748b;">${company.address}</p>
        <p style="margin: 0 0 8px;">
          Need assistance? <a href="mailto:${company.supportEmail}" style="color: #059669; text-decoration: none; font-weight: 600;">${company.supportEmail}</a> | ${company.supportPhone}
        </p>
        <p style="margin: 0;">
          <a href="${company.websiteUrl}" style="color: #059669; text-decoration: none; font-weight: 600;">Visit Official Website</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;

const customerGreeting = (name) => `<p style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #0f172a;">Hello ${name || 'Customer'},</p>`;

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
  registration: ({ name }) => wrap('Welcome to SriTech Engineering', 'Welcome to Sri Tech', `
    ${customerGreeting(name)}
    <p class="muted">Your account has been created successfully. We are excited to help you discover our high-efficiency sustainable energy solutions.</p>
    ${actionButton('Explore Products', company.websiteUrl)}
    <p class="muted">If you have any questions, feel free to reply to this email anytime.</p>
  `),

  emailVerification: ({ name, otp, verifyUrl }) => wrap('Verify Your Email - Sri Tech', 'Verify Your Email', `
    ${customerGreeting(name)}
    <p style="color: #475569; font-size: 15px; margin-bottom: 20px;">
      Thank you for registering with <strong>SriTech Engineering</strong>. To complete your account setup and verify your email address, please use the 6-digit verification code below:
    </p>

    ${otp ? `
    <div style="background: #f0fdf4; border: 2px dashed #10b981; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
      <div style="font-size: 12px; font-weight: 700; color: #047857; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">Your Verification Code</div>
      <div style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; color: #065f46; letter-spacing: 12px; margin: 8px 0;">${otp}</div>
      <div style="font-size: 13px; color: #059669; margin-top: 8px; font-weight: 500;">⏱️ Code expires in 10 minutes</div>
    </div>
    ` : ''}

    ${verifyUrl ? actionButton('Verify Account Now', verifyUrl) : ''}

    <p style="color: #64748b; font-size: 13px; margin-top: 24px; line-height: 1.5;">
      If you did not request this verification code, please ignore this email or contact support if you have concerns.
    </p>
  `),

  passwordReset: ({ name, resetUrl }) => wrap('Reset Your Password - Sri Tech', 'Password Reset Request', `
    ${customerGreeting(name)}
    <p class="muted">We received a request to reset your password. Click the button below to set a new password for your account.</p>
    ${actionButton('Reset Password', resetUrl)}
    <p class="muted">If you did not request a password reset, your account is still secure and you can safely ignore this email.</p>
  `),

  paymentSuccessful: ({ order, viewOrderUrl, invoiceUrl }) => wrap(`Payment Received — ${order.orderId}`, 'Payment Successful', `
    ${customerGreeting(order.customerName)}
    <p class="muted">We have successfully received your payment. Your order is now being processed.</p>
    ${orderDetailsSection(order)}
    ${itemsTable(order)}
    ${actionButton('View Order Details', viewOrderUrl)}
    ${invoiceUrl ? actionButton('Download Invoice', invoiceUrl) : ''}
  `),

  orderConfirmation: ({ order, viewOrderUrl, invoiceUrl }) => wrap(`Order Confirmed — ${order.orderId}`, 'Order Confirmed', `
    ${customerGreeting(order.customerName)}
    <p class="muted">Your order has been confirmed and will be processed for dispatch shortly.</p>
    ${orderDetailsSection(order)}
    ${itemsTable(order)}
    ${actionButton('Track Your Order', viewOrderUrl)}
    ${invoiceUrl ? actionButton('Download Invoice', invoiceUrl) : ''}
  `),

  orderStatusUpdate: ({ order, statusTitle, statusNote, viewOrderUrl, trackingUrl, invoiceUrl }) => wrap(`Order Update — ${order.orderId}`, statusTitle || 'Order Status Update', `
    ${customerGreeting(order.customerName)}
    <p class="muted">Your order status has been updated to: <strong style="color: #059669;">${order.status}</strong></p>
    ${statusNote ? `<p style="background: #f8fafc; padding: 14px; border-radius: 8px; border-left: 4px solid #059669; margin: 16px 0;">${statusNote}</p>` : ''}
    ${orderDetailsSection(order)}
    <div class="section">
      <h2>Delivery Details</h2>
      <table class="details-table">
        <tr><th>Estimated Delivery</th><td>${order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Not available yet'}</td></tr>
        <tr><th>Courier Partner</th><td>${order.courierPartner || 'Not assigned yet'}</td></tr>
      </table>
    </div>
    ${itemsTable(order)}
    ${trackingUrl ? actionButton('Track Shipment', trackingUrl) : ''}
    ${viewOrderUrl ? actionButton('View Order', viewOrderUrl) : ''}
    ${invoiceUrl ? actionButton('Download Invoice', invoiceUrl) : ''}
  `),

  returnRequest: ({ order, returnRequest, viewOrderUrl }) => wrap(`Return Request Received — ${order.orderId}`, 'Return Request Submitted', `
    ${customerGreeting(order.customerName)}
    <p class="muted">We have received your return request and our team is reviewing it.</p>
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

  returnStatusUpdate: ({ order, returnRequest, statusTitle, statusNote, viewOrderUrl }) => wrap(`Return Update — ${order.orderId}`, statusTitle || 'Return Request Update', `
    ${customerGreeting(order.customerName)}
    <p class="muted">Your return request is now <strong style="color: #059669;">${returnRequest.status}</strong>.</p>
    <div class="section">
      <h2>Return Request</h2>
      <table class="details-table">
        <tr><th>Request ID</th><td>${returnRequest.returnId}</td></tr>
        <tr><th>Status</th><td>${returnRequest.status}</td></tr>
        ${statusNote ? `<tr><th>Note</th><td>${statusNote}</td></tr>` : ''}
      </table>
    </div>
    ${actionButton('View Order', viewOrderUrl)}
  `),

  refundStatusUpdate: ({ order, refundRequest, statusTitle, statusNote, viewOrderUrl }) => wrap(`Refund Update — ${order.orderId}`, statusTitle || 'Refund Update', `
    ${customerGreeting(order.customerName)}
    <p class="muted">Your refund request is now <strong style="color: #059669;">${refundRequest.status}</strong>.</p>
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
      <p style="background: #f8fafc; padding: 14px; border-radius: 8px; border-left: 4px solid #059669; margin: 16px 0;">${response}</p>
    </div>
    <p class="muted">If you need further assistance, feel free to reply to this email anytime.</p>
  `),

  supportAutoConfirmation: ({ supportQuery }) => wrap(`We received your complaint — ${supportQuery.subject}`, 'Complaint Received', `
    ${customerGreeting(supportQuery.customerName)}
    <p class="muted">Thank you for contacting Sri Tech. We have successfully received your message and created a support ticket.</p>
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

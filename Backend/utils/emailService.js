const path = require('path');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const EmailLog = require('../models/EmailLog');
const { templates } = require('./emailTemplates');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const createTransporter = () => {
  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT || 0);
  const secure = typeof process.env.EMAIL_SECURE !== 'undefined'
    ? process.env.EMAIL_SECURE === 'true'
    : port === 465;

  const transporterOptions = {
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    },
    secure,
    requireTLS: true,
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
  };

  if (host) {
    transporterOptions.host = host;
  }

  if (port) {
    transporterOptions.port = port;
  }

  if (!host && !port) {
    transporterOptions.service = process.env.EMAIL_SERVICE || 'gmail';
  }

  console.log('[emailService] creating SMTP transporter', {
    host: transporterOptions.host || transporterOptions.service,
    port: transporterOptions.port,
    secure: transporterOptions.secure,
    user: process.env.EMAIL_USER ? `${process.env.EMAIL_USER}` : 'MISSING'
  });

  return nodemailer.createTransport(transporterOptions);
};

const transporter = createTransporter();

transporter.verify().then(() => {
  console.log('[emailService] SMTP transporter verified successfully');
}).catch(err => {
  console.error('[emailService] SMTP transporter verification failed', err.message || err);
});

const MAX_RETRIES = Number(process.env.EMAIL_RETRY_MAX || 3);
const SENDER_NAME = process.env.EMAIL_FROM_NAME || 'The Sri Tech';
const SENDER_ADDRESS = process.env.EMAIL_FROM || process.env.EMAIL_USER;

const createEmailLog = async ({ recipient, subject, template, payload }) => {
  try {
    return await EmailLog.create({
      recipient,
      subject,
      template,
      status: 'pending',
      attempts: 0,
      error: '',
      payload: payload || {}
    });
  } catch (err) {
    console.warn('[emailService] email logging unavailable, continuing without persistence', err.message || err);
    return null;
  }
};

const sendEmail = async (to, subject, html, options = {}) => {
  const templateName = options.template || 'custom';
  const payload = options.payload || {};
  const recipient = Array.isArray(to) ? to.join(', ') : String(to);
  const text = options.text || String(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  const emailLog = await createEmailLog({
    recipient,
    subject,
    template: templateName,
    payload
  });

  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    if (emailLog) {
      emailLog.attempts = attempt;
      emailLog.lastAttemptAt = new Date();
      emailLog.status = attempt === 1 ? 'pending' : 'retrying';
      await emailLog.save().catch(() => {});
    }

    try {
      console.log('[emailService] connecting SMTP and sending email', { recipient, subject, user: process.env.EMAIL_USER });
      const mailOptions = {
        from: `${SENDER_NAME} <${SENDER_ADDRESS}>`,
        to,
        subject,
        html,
        text
      };
      const info = await transporter.sendMail(mailOptions);
      console.log('[emailService] sendMail response', info);

      if (emailLog) {
        emailLog.status = 'sent';
        emailLog.messageId = info.messageId || '';
        emailLog.sentAt = new Date();
        emailLog.error = '';
        await emailLog.save().catch(() => {});
      }

      console.log(`Email sent: ${subject} -> ${recipient}`);
      return info;
    } catch (err) {
      lastError = err;
      if (emailLog) {
        emailLog.status = attempt < MAX_RETRIES ? 'retrying' : 'failed';
        emailLog.error = String(err.message || err);
        await emailLog.save().catch(() => {});
      }

      console.error(`Email attempt ${attempt} failed for ${recipient}:`, err.message || err);
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  throw lastError;
};

module.exports = { sendEmail, templates };


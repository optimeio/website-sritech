require('dotenv').config();
const { sendEmail, templates } = require('./utils/emailService');

console.log('Sending test email using current SMTP configuration...');
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '********' : 'undefined');

sendEmail('thesmgroups@gmail.com', 'Test Email', templates.registration({ name: 'Test User' }), {
  template: 'registration',
  payload: { test: true }
})
  .then(info => {
    console.log('Test email sent successfully!', info);
  })
  .catch(err => {
    console.error('Test email failed to send:', err);
  });

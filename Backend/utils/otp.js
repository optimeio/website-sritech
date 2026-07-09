const crypto = require('crypto');

const OTP_LENGTH = Number(process.env.OTP_LENGTH || 6);

const generateOtp = () => {
  const min = 10 ** (OTP_LENGTH - 1);
  const max = 10 ** OTP_LENGTH;
  return crypto.randomInt(min, max).toString().padStart(OTP_LENGTH, '0');
};

module.exports = { generateOtp };

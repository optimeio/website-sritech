const User = require('../models/User');

const DEMO_EMAIL = 'demo@sritech.com';
const DEMO_PASSWORD = 'Demo@1234';

const ensureDemoUser = async () => {
  const existingUser = await User.findOne({ email: DEMO_EMAIL });
  if (existingUser) {
    if (!existingUser.isVerified) {
      existingUser.isVerified = true;
      existingUser.status = 'active';
      existingUser.password = DEMO_PASSWORD;
      await existingUser.save();
    }
    return existingUser;
  }

  const user = await User.create({
    name: 'Demo User',
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    phone: '9999999999',
    address: 'SriTech Demo Address',
    isVerified: true,
    status: 'active'
  });

  return user;
};

module.exports = { ensureDemoUser, DEMO_EMAIL, DEMO_PASSWORD };

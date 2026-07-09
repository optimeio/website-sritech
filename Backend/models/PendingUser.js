const mongoose = require('../mongoose');
const bcrypt = require('bcryptjs');

const pendingUserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  address: { type: String },
  password: { type: String, required: true },
  otp: { type: String },
  otpExpires: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

pendingUserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

pendingUserSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const overrides = new Map();
const getActiveMongoose = () => (mongoose.getActive ? mongoose.getActive() : mongoose);

const getActivePendingUserModel = () => {
  const activeMongoose = getActiveMongoose();
  const existingModel = activeMongoose.models?.PendingUser;
  if (existingModel) {
    return existingModel;
  }
  return activeMongoose.model('PendingUser', pendingUserSchema);
};

const PendingUserModelProxy = new Proxy(function PendingUserModelProxy() {}, {
  construct(target, args) {
    const activeModel = getActivePendingUserModel();
    return new activeModel(...args);
  },
  get(target, prop) {
    if (overrides.has(prop)) {
      return overrides.get(prop);
    }

    const activeModel = getActivePendingUserModel();
    const value = activeModel[prop];
    if (typeof value === 'function') {
      return value.bind(activeModel);
    }
    return value;
  },
  set(target, prop, value) {
    overrides.set(prop, value);
    return true;
  }
});

module.exports = PendingUserModelProxy;

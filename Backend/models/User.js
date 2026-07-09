const mongoose = require('../mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  label: { type: String, default: 'Home' },
  name: { type: String },
  phone: { type: String },
  addressLine1: { type: String },
  addressLine2: { type: String },
  city: { type: String },
  state: { type: String },
  zipCode: { type: String },
  country: { type: String },
  isDefault: { type: Boolean, default: false }
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  address: { type: String },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  status: { type: String, enum: ['active', 'blocked'], default: 'active' },
  cart: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  waitlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  isVerified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpires: { type: Date },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  createdAt: { type: Date, default: Date.now }
});

userSchema.add({ addresses: [addressSchema] });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;

  const storedPassword = String(this.password);
  if (storedPassword.startsWith('$2')) {
    return bcrypt.compare(enteredPassword, storedPassword);
  }

  return storedPassword === String(enteredPassword);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  delete obj.otp;
  delete obj.otpExpires;
  return obj;
};

const overrides = new Map();
const getActiveMongoose = () => (mongoose.getActive ? mongoose.getActive() : mongoose);

const getActiveUserModel = () => {
  const activeMongoose = getActiveMongoose();
  const existingModel = activeMongoose.models?.User;
  if (existingModel) {
    return existingModel;
  }
  return activeMongoose.model('User', userSchema);
};

const UserModelProxy = new Proxy(function UserModelProxy() {}, {
  construct(target, args) {
    const activeModel = getActiveUserModel();
    return new activeModel(...args);
  },
  get(target, prop) {
    if (overrides.has(prop)) {
      return overrides.get(prop);
    }

    const activeModel = getActiveUserModel();
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

module.exports = UserModelProxy;

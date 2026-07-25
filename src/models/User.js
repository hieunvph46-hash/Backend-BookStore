const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    avatar: { type: String, default: '' },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.password);
};

function userToClient(doc) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  const id = obj._id?.toString?.() || obj.id;
  return {
    _id: id,
    id,
    username: obj.username,
    email: obj.email || '',
    firstName: obj.firstName || '',
    lastName: obj.lastName || '',
    role: obj.role,
    avatar: obj.avatar || '',
  };
}

userSchema.statics.toClient = userToClient;

module.exports = mongoose.model('User', userSchema);
module.exports.userToClient = userToClient;

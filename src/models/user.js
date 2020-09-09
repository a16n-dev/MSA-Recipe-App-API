const mongoose = require('mongoose');
// Define schema for user
const userSchema = new mongoose.Schema({
  firebaseUUID: {
    type: String,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true,
  },
  profileUrl: {
    type: String,
  },
}, {
  timestamps: true,
});

userSchema.virtual('recipes', {
  ref: 'Recipe',
  localField: '_id',
  foreignField: 'user',
});

const User = mongoose.model('User', userSchema);

module.exports = User;

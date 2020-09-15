const mongoose = require('mongoose');
const Recipe = require('./recipe');
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
  image: {
    type: Buffer,
  },
}, {
  timestamps: true,
});

userSchema.virtual('recipes', {
  ref: 'Recipe',
  localField: '_id',
  foreignField: 'user',
});

userSchema.pre('remove', async function (next) {
  const user = this;
  // eslint-disable-next-line no-underscore-dangle
  await Recipe.deleteMany({ user: user._id });
  console.log('deleting assocaited recipes');
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;

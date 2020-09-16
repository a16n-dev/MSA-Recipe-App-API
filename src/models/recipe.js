const mongoose = require('mongoose');
const User = require('./user');

// Define schema for user
const recipeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  ingredients: {
    type: Array,
  },
  method: {
    type: Array,
  },
  prepTime: {
    type: String,
  },
  servings: {
    type: Number,
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  notes: {
    type: Array,
  },
  authorName: {
    type: String,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  image: {
    type: Buffer,
  },
  subscribers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
}, {
  timestamps: true,
});

recipeSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.subscribers;
  delete obj.image;
  return obj;
};

const Recipe = mongoose.model('Recipe', recipeSchema);

module.exports = Recipe;

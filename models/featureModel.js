const mongoose = require('mongoose');

const featureSchema = new mongoose.Schema({
  text: {
    type: String,
    maxLength: [1500, 'Please summarize your Request in 1500 characters or less'],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Please Login and Submit the Request'],
  },
  submittedAt: {
    type: Date,
    default: Date.now(),
  },
});

const Feature = mongoose.model('Feature', featureSchema);
module.exports = Feature;

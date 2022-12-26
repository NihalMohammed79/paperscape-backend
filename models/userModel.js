const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please Provide a Valid Email'],
  },
  password: {
    type: String,
    minlength: 7,
    select: false,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  active: {
    type: Boolean,
    default: false,
  },
  origin: {
    type: String,
    enum: ['Local', 'Google'],
    default: 'Local',
  },
  activationCode: {
    type: String,
  },
});

userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model('User', userSchema);
module.exports = User;

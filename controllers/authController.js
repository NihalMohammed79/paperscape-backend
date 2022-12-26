const crypto = require('crypto');
const { promisify } = require('util');

const jwt = require('jsonwebtoken');

const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, res, origin) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // Remove Password from Output
  user.password = undefined;

  if (origin !== 'Local') {
    res.redirect(`${process.env.ORIGIN}/home/author`);
  } else {
    res.status(statusCode).json({
      status: 'success',
      message: 'Logged in Successfully!',
      token,
    });
  }
};

exports.createSendToken = createSendToken;

const sendActivationMail = async (email, activationCode, protocol, host) => {
  const activationURL = `${protocol}://${host}/api/v1/users/activate/${activationCode}`;
  await sendEmail({
    email,
    subject: 'Please use the Link to Activate your Account',
    message: activationURL,
  });
};

exports.loginOrSignup = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if Email and Password Exist in Request Body
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }
  // 2) If User Doesn't Exist, Create User
  let user = await User.findOne({ email }).select('+password');

  if (!user) {
    const activationCode = crypto.randomBytes(32).toString('hex');

    // User Account Initially Inactive
    user = await User.create({
      email,
      password,
      role: 'user',
      active: false,
      origin: 'Local',
      activationCode,
    });

    try {
      await sendActivationMail(email, activationCode, req.protocol, req.get('host'));
      return next(new AppError('Please Activate Your Account using the Link in Your Email', 401));
    } catch (err) {
      await User.findByIdAndDelete(user._id);
      return next(new AppError('There was an error sending the Activation Email. Please try again later'), 500);
    }
  }

  // 3) Check If User Account Is Activated
  if (!user.active) {
    return next(new AppError('Please Activate Your Account using the Link in Your Email', 401));
  }

  // 4) Check if User has not Registered using Social Media
  if (user.origin !== 'Local') {
    return next(new AppError(`Password Not Linked To Your Account. Please Login using ${user.origin}`, 400));
  }

  // 5) Check Password Entered by the User
  if (await user.correctPassword(password, user.password)) {
    return next(new AppError('Incorrect Email or Password', 401));
  }

  // 6) Send Token to Client
  createSendToken(user, 200, res, 'Local');
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success', message: 'Successfully Logged Out' });
};

exports.activateAccount = catchAsync(async (req, res, next) => {
  const user = await User.findOneAndUpdate({ activationCode: req.params.token }, { active: true });

  if (!user) {
    return next(new AppError('The User Does Not Exist or the Activation Link Expired!', 400));
  }

  createSendToken(user, 200, res, 'Local');
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Get Token and Check If It Exists
  let token;

  // Optional Chaining
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('You Are Not Logged In! Please Log In To Get Access', 401));
  }

  // 2) Token Verification
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if User Still Exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('The User Belonging To This Token No Longer Exists', 401));
  }

  // 4) Grant Access to Protected Route
  res.locals.user = currentUser;
  req.user = currentUser;
  next();
});

// Middleware for Restricting Access to Dashboard Data
exports.restict = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return next(new AppError('You do not have permission to perform this action', 403));
  }
  next();
};

exports.isLoggedIn = catchAsync(async (req, res, next) => {
  // 1) Get Token and Check If It Exists
  let token;

  // Optional Chaining
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('You Are Not Logged In! Please Log In To Get Access', 401));
  }

  // 2) Token Verification
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if User Still Exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('The User Belonging To This Token No Longer Exists', 401));
  }

  // 4) Grant Access to Protected Route
  res.locals.user = currentUser;
  res.status(200).json({
    status: 'success',
    message: 'Welcome to Paperscape!',
  });
});

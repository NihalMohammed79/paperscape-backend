/* eslint-disable camelcase */
const querystring = require('node:querystring');

const axios = require('axios');

const { createSendToken } = require('./authController');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getGoogleAuthURL = (req, res, next) => {
  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const options = {
    redirect_uri: `${process.env.URL}/api/v1/users/login/google`,
    // redirect_uri: `${process.env.ORIGIN}/home/author`,
    client_id: process.env.GOOGLE_CLIENT_ID,
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email'].join(
      ' '
    ),
  };

  res.status(200).json({
    status: 'success',
    url: `${rootUrl}?${querystring.stringify(options)}`,
  });
};

exports.googleLogin = catchAsync(async (req, res, next) => {
  const { code } = req.query;

  // 1) Get Tokens from Google
  const url = 'https://oauth2.googleapis.com/token';
  const values = {
    code,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: `${process.env.URL}/api/v1/users/login/google`,
    // redirect_uri: `${process.env.ORIGIN}/home/author`,
    grant_type: 'authorization_code',
  };

  const { id_token, access_token } = await axios
    .post(url, querystring.stringify(values), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    .then((response) => response.data)
    .catch(() => {
      next(new AppError('There was an error in Logging in with Google. Please try again Later'), 500);
    });

  // 2) Fetch User Profile using the Access Token
  const googleUser = await axios
    .get(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`, {
      headers: {
        Authorization: `Bearer ${id_token}`,
      },
    })
    .then((response) => response.data)
    .catch(() => next(new AppError('There was an error in Logging in with Google. Please try again Later'), 500));

  const { email } = googleUser;
  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      email,
      role: 'user',
      active: true,
      origin: 'Google',
    });
  }
  createSendToken(user, 200, res, 'Google');
});

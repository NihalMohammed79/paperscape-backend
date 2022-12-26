const catchAsync = require('../utils/catchAsync');
const Feature = require('../models/featureModel');

exports.getAllFeatures = catchAsync(async (req, res, next) => {
  const features = await Feature.find().sort({ submittedAt: 'desc' }).populate({ path: 'user', fields: 'email' });

  res.status(200).json({
    status: 'success',
    features,
  });
});

exports.createFeature = catchAsync(async (req, res, next) => {
  await Feature.create({
    text: req.body.text,
    user: req.user._id,
  });

  res.status(200).json({
    status: 'success',
    message: 'Feature Added Successfully',
  });
});

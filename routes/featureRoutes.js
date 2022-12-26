const express = require('express');
const authController = require('../controllers/authController');
const featureController = require('../controllers/featureController');

const router = express.Router();

router.use(authController.protect);
router.route('/').get(authController.restict, featureController.getAllFeatures).post(featureController.createFeature);

module.exports = router;

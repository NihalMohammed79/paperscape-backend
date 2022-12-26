const express = require('express');
const authController = require('../controllers/authController');
const googleAuthController = require('../controllers/googleAuthController');

const router = express.Router();

router.post('/login', authController.loginOrSignup);
router.get('/logout', authController.logout);
router.get('/activate/:token', authController.activateAccount);

router.get('/login/google/url', googleAuthController.getGoogleAuthURL);
router.get('/login/google', googleAuthController.googleLogin);

router.get('/logged-in', authController.isLoggedIn);

module.exports = router;

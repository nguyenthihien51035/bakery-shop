const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Hiển thị form đăng ký
router.get('/register', authController.showRegister);

// Xử lý đăng ký
router.post('/register', authController.register);

// Hiển thị form đăng nhập
router.get('/login', authController.showLogin);

// Xử lý đăng nhập
router.post('/login', authController.login);

// Đăng xuất
router.get('/logout', authController.logout);

router.get('/forgot-password', authController.showForgotPassword);
router.post('/forgot-password', authController.forgotPassword);
router.get('/reset-password/:token', authController.showResetPassword);
router.post('/reset-password/:token', authController.resetPassword);

module.exports = router;
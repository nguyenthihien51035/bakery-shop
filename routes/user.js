const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');
const cartController = require('../controllers/cartController');
const productController = require('../controllers/productController');
const checkoutController = require('../controllers/checkoutController');
const orderController = require('../controllers/orderController');
const profileController = require('../controllers/profileController');
const { uploadAvatar } = require('../middleware/upload');


// Trang chủ
router.get('/', homeController.getHome);

router.get('/wishlist', cartController.getWishlist);
router.post('/wishlist/add', cartController.addToWishlist);
router.post('/wishlist/remove', cartController.removeFromWishlist);

router.get('/cart', cartController.getCart);
router.post('/cart/add', cartController.addToCart);
router.post('/cart/remove', cartController.removeFromCart);
router.post('/cart/update-quantity', cartController.updateCartQuantity);

router.get('/products', productController.getAllProducts);
router.get('/products/search', productController.searchProducts);
router.get('/products/category/:categoryId', productController.getProductsByCategory);
router.get('/products/:id', productController.getProductDetail);

router.get('/checkout', checkoutController.getCheckout);
router.post('/checkout/process', checkoutController.processOrder);

router.get('/orders', orderController.getUserOrders);
router.get('/orders/:id', orderController.getOrderDetail);
router.post('/orders/:id/cancel', orderController.cancelOrder);

router.get('/profile', profileController.showProfile);
router.post('/profile/update', profileController.updateProfile); 
router.post('/profile/upload-avatar', uploadAvatar.single('avatar'), profileController.uploadAvatar); // avatar
router.post('/profile/change-password', profileController.changePassword);
module.exports = router;
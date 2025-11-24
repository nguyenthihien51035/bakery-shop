const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');
const cartController = require('../controllers/cartController');
const productController = require('../controllers/productController');

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
module.exports = router;
const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const categoryController = require('../controllers/categoryController');
const productController = require('../controllers/productController');
const upload = require('../middleware/upload');
const userController = require('../controllers/userController');
const adminOrderController = require('../controllers/adminOrderController');

router.use(isAuthenticated);
router.use(isAdmin);

router.get('/', (req, res) => {
    res.render('admin/home');
});

// --- Category

// Route hiển thị danh sách danh mục
router.get('/categories', categoryController.getCategories);

// Route hiển thị trang thêm danh mục mới
router.get('/categories/create', categoryController.showCreateCategory);

// Route xử lý thêm danh mục mới (POST)
router.post('/categories/create', categoryController.createCategory);

// Route hiển thị trang sửa danh mục
router.get('/categories/edit/:id', categoryController.showEditCategory);

// Route xử lý sửa danh mục (POST)
router.post('/categories/edit/:id', categoryController.updateCategory);

// Route xóa danh mục (DELETE)
router.delete('/categories/delete/:id', categoryController.deleteCategory);

// --- Product
router.get('/products', productController.getProducts);
router.get('/products/create', productController.showCreateProduct);
router.post('/products/create', upload.array('images', 10), productController.createProduct);
router.get('/products/edit/:id', productController.showEditProduct);
router.post('/products/edit/:id', upload.array('images', 10), productController.updateProduct);
router.delete('/products/delete/:id', productController.deleteProduct);
router.get('/api/products/:id', productController.getProductDetailApi);

router.get('/users', userController.getUsers);
router.post('/users/update-role', userController.updateUserRole);
router.post('/users/toggle-status/:id', userController.toggleUserStatus);
router.delete('/users/delete/:id', userController.deleteUser);

router.get('/orders', adminOrderController.getAllOrders);
router.get('/orders/:id', adminOrderController.getOrderDetail);
router.post('/orders/:id/update-status', adminOrderController.updateOrderStatus);
router.post('/orders/:id/update-payment', adminOrderController.updatePaymentStatus);
router.delete('/orders/:id', adminOrderController.deleteOrder);
module.exports = router;
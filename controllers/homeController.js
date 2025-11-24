const Product = require('../models/product');
const Category = require('../models/category');

// Hiển thị trang chủ
exports.getHome = async (req, res) => {
    try {
        // Lấy 8 sản phẩm mới nhất và đang active
        const products = await Product.find({ isActive: true })
            .populate('category', 'name')
            .sort({ createdAt: -1 })
            .limit(8);

        const categories = await Category.find({ isActive: true }).sort({ name: 1 });
        
        res.render('user/home', {
            products: products,
            categories: categories,
            title: 'Trang chủ - Hien Bakery Shop',
            session: req.session
        });
    } catch (error) {
        console.error('Lỗi khi tải trang chủ:', error);
        res.status(500).send('Có lỗi xảy ra');
    }
};
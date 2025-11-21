const Product = require('../models/product');
const Category = require('../models/category');
const fs = require('fs');
const path = require('path');

// Hiển thị danh sách sản phẩm
exports.getProducts = async (req, res) => {
    try {
        const products = await Product.find()
            .populate('category', 'name')
            .sort({ createdAt: -1 });
        
        res.render('admin/tableProduct', {
            products: products,
            title: 'Quản lý sản phẩm',
            session: req.session
        });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách sản phẩm:', error);
        res.status(500).send('Có lỗi xảy ra');
    }
};

// Hiển thị trang thêm sản phẩm
exports.showCreateProduct = async (req, res) => {
    try {
        // Lấy danh sách danh mục để hiển thị trong select
        const categories = await Category.find({ isActive: true }).sort({ name: 1 });
        
        res.render('admin/createProduct', {
            categories: categories,
            title: 'Thêm sản phẩm mới',
            session: req.session
        });
    } catch (error) {
        console.error('Lỗi:', error);
        res.status(500).send('Có lỗi xảy ra');
    }
};

// Xử lý thêm sản phẩm mới
exports.createProduct = async (req, res) => {
    try {
        const { name, description, price, category, size, isActive } = req.body;
        
        // Validate
        if (!name || !price || !category) {
            req.flash('error', 'Vui lòng điền đầy đủ thông tin bắt buộc!');
            return res.redirect('/admin/products/create');
        }
        
        // Lấy danh sách file ảnh đã upload
        const images = req.files ? req.files.map(file => file.filename) : [];
        
        // Tạo sản phẩm mới
        const newProduct = new Product({
            name: name.trim(),
            description: description ? description.trim() : '',
            price: parseFloat(price),
            category: category,
            images: images,
            size: size ? size.trim() : '',
            isActive: isActive === 'on' ? true : false
        });
        
        await newProduct.save();
        
        console.log('Đã thêm sản phẩm mới:', newProduct.name);
        
        req.flash('success', `Thêm sản phẩm "${name}" thành công!`);
        res.redirect('/admin/products');
        
    } catch (error) {
        console.error('Lỗi khi thêm sản phẩm:', error);
        req.flash('error', 'Có lỗi xảy ra khi thêm sản phẩm!');
        res.redirect('/admin/products/create');
    }
};

// Hiển thị trang sửa sản phẩm
exports.showEditProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('category');
        const categories = await Category.find({ isActive: true }).sort({ name: 1 });
        
        if (!product) {
            req.flash('error', 'Không tìm thấy sản phẩm!');
            return res.redirect('/admin/products');
        }
        
        res.render('admin/editProduct', {
            product: product,
            categories: categories,
            title: 'Sửa sản phẩm',
            session: req.session
        });
    } catch (error) {
        console.error('Lỗi:', error);
        req.flash('error', 'Có lỗi xảy ra!');
        res.redirect('/admin/products');
    }
};

// Xử lý cập nhật sản phẩm
exports.updateProduct = async (req, res) => {
    try {
        const { name, description, price, category, size, isActive, deleteImages } = req.body;
        const productId = req.params.id;
        
        const product = await Product.findById(productId);
        if (!product) {
            req.flash('error', 'Không tìm thấy sản phẩm!');
            return res.redirect('/admin/products');
        }
        
        // Xử lý xóa ảnh cũ nếu có
        let currentImages = product.images || [];
        if (deleteImages) {
            const imagesToDelete = Array.isArray(deleteImages) ? deleteImages : [deleteImages];
            imagesToDelete.forEach(img => {
                // Xóa file khỏi server
                const imagePath = path.join(__dirname, '../public/uploads/products', img);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            });
            currentImages = currentImages.filter(img => !imagesToDelete.includes(img));
        }
        
        // Thêm ảnh mới nếu có
        const newImages = req.files ? req.files.map(file => file.filename) : [];
        const allImages = [...currentImages, ...newImages];
        
        // Cập nhật sản phẩm
        await Product.findByIdAndUpdate(productId, {
            name: name.trim(),
            description: description ? description.trim() : '',
            price: parseFloat(price),
            category: category,
            images: allImages,
            size: size ? size.trim() : '',
            isActive: isActive === 'on' ? true : false
        });
        
        console.log('Đã cập nhật sản phẩm:', name);
        
        req.flash('success', 'Cập nhật sản phẩm thành công!');
        res.redirect('/admin/products');
        
    } catch (error) {
        console.error('Lỗi khi sửa sản phẩm:', error);
        req.flash('error', 'Có lỗi xảy ra khi sửa sản phẩm!');
        res.redirect(`/admin/products/edit/${req.params.id}`);
    }
};

// Xóa sản phẩm
exports.deleteProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findById(productId);
        
        if (!product) {
            return res.json({
                success: false,
                message: 'Không tìm thấy sản phẩm!'
            });
        }
        
        // Xóa tất cả ảnh của sản phẩm
        if (product.images && product.images.length > 0) {
            product.images.forEach(img => {
                const imagePath = path.join(__dirname, '../public/uploads/products', img);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            });
        }
        
        await Product.findByIdAndDelete(productId);
        
        console.log('Đã xóa sản phẩm:', product.name);
        
        res.json({
            success: true,
            message: 'Xóa sản phẩm thành công!'
        });
        
    } catch (error) {
        console.error('Lỗi khi xóa sản phẩm:', error);
        res.json({
            success: false,
            message: 'Có lỗi xảy ra khi xóa sản phẩm!'
        });
    }
};

// API: Lấy chi tiết sản phẩm theo ID
exports.getProductDetailApi = async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findById(productId).populate('category', 'name');

        if (!product) {
            return res.json({
                success: false,
                message: 'Không tìm thấy sản phẩm!'
            });
        }

        res.json({
            success: true,
            product: product
        });

    } catch (error) {
        console.error('Lỗi khi lấy chi tiết sản phẩm API:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi lấy chi tiết sản phẩm.'
        });
    }
};
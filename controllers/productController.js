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

// Hiển thị chi tiết sản phẩm
exports.getProductDetail = async (req, res) => {
    try {
        const productId = req.params.id;
        
        // Lấy thông tin sản phẩm và populate category
        const product = await Product.findById(productId).populate('category');
        
        if (!product) {
            req.flash('error', 'Không tìm thấy sản phẩm!');
            return res.redirect('/');
        }

        // Lấy sản phẩm liên quan (cùng category, khác id, limit 4)
        const relatedProducts = await Product.find({
            category: product.category,
            _id: { $ne: productId },
            isActive: true
        }).limit(4);

        const categories = await Category.find({ isActive: true }).sort({ name: 1 });
        res.render('user/productDetail', {
            product,
            categories: categories,
            relatedProducts,
            title: product.name,
            session: req.session
        });
    } catch (error) {
        console.error('Lỗi khi lấy chi tiết sản phẩm:', error);
        req.flash('error', 'Có lỗi xảy ra khi tải sản phẩm!');
        res.redirect('/');
    }
};

// Lấy danh sách tất cả sản phẩm
exports.getAllProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 12;
        const skip = (page - 1) * limit;

        // Lấy filter từ query
        const categoryId = req.query.category;
        const sortBy = req.query.sort || 'newest';

        // Build query
        let query = { isActive: true };
        if (categoryId) {
            query.category = categoryId;
        }

        // Sorting
        let sortOption = { createdAt: -1 }; // Mặc định: mới nhất
        switch (sortBy) {
            case 'price_asc':
                sortOption = { price: 1 };
                break;
            case 'price_desc':
                sortOption = { price: -1 };
                break;
            case 'name_asc':
                sortOption = { name: 1 };
                break;
            case 'name_desc':
                sortOption = { name: -1 };
                break;
        }

        const products = await Product.find(query)
            .populate('category')
            .skip(skip)
            .limit(limit)
            .sort(sortOption);

        const totalProducts = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / limit);

        // Lấy tất cả categories để hiển thị filter
        const categories = await Category.find({ isActive: true }).sort({ name: 1 });

        res.render('user/products', {
            products,
            categories,
            currentPage: page,
            totalPages,
            totalProducts,
            selectedCategory: categoryId,
            selectedSort: sortBy,
            title: 'Sản phẩm',
            session: req.session
        });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách sản phẩm:', error);
        req.flash('error', 'Có lỗi xảy ra!');
        res.redirect('/');
    }
};

// Tìm kiếm sản phẩm
exports.searchProducts = async (req, res) => {
    try {
        const keyword = req.query.keyword || '';
        const page = parseInt(req.query.page) || 1;
        const limit = 12;
        const skip = (page - 1) * limit;

        const searchQuery = {
            isActive: true,
            $or: [
                { name: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } }
            ]
        };

        const products = await Product.find(searchQuery)
            .populate('category')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const totalProducts = await Product.countDocuments(searchQuery);
        const totalPages = Math.ceil(totalProducts / limit);

        // Lấy categories để hiển thị
        const categories = await Category.find({ isActive: true }).sort({ name: 1 });

        res.render('user/products', {
            products,
            categories,
            currentPage: page,
            totalPages,
            totalProducts,
            selectedCategory: null,
            selectedSort: req.query.sort || 'newest',
            keyword,
            title: `Tìm kiếm: ${keyword}`,
            session: req.session
        });
    } catch (error) {
        console.error('Lỗi khi tìm kiếm:', error);
        req.flash('error', 'Có lỗi xảy ra khi tìm kiếm!');
        res.redirect('/');
    }
};

// Lọc sản phẩm theo category
exports.getProductsByCategory = async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        const page = parseInt(req.query.page) || 1;
        const limit = 12;
        const skip = (page - 1) * limit;

        // Kiểm tra category có tồn tại không
        const category = await Category.findById(categoryId);
        if (!category) {
            req.flash('error', 'Không tìm thấy danh mục!');
            return res.redirect('/products');
        }

        const products = await Product.find({ 
            category: categoryId,
            isActive: true
        })
            .populate('category')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const totalProducts = await Product.countDocuments({ 
            category: categoryId,
            isActive: true
        });
        const totalPages = Math.ceil(totalProducts / limit);

        // Lấy tất cả categories
        const categories = await Category.find({ isActive: true }).sort({ name: 1 });

        res.render('user/products', {
            products,
            categories,
            currentPage: page,
            totalPages,
            totalProducts,
            selectedCategory: categoryId,
            selectedSort: req.query.sort || 'newest',
            title: `Danh mục: ${category.name}`,
            session: req.session
        });
    } catch (error) {
        console.error('Lỗi khi lọc theo danh mục:', error);
        req.flash('error', 'Có lỗi xảy ra!');
        res.redirect('/products');
    }
};
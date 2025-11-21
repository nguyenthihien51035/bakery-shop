const Category = require('../models/category');

// Hiển thị danh sách danh mục
exports.getCategories = async (req, res) => {
    try {
        const Product = require('../models/product');
         // Lấy tất cả danh mục, sắp xếp theo ngày tạo mới nhất
        const categories = await Category.find().sort({ createdAt: -1 });

         // Đếm số sản phẩm cho từng danh mục
        for (let category of categories) {
            category.productCount = await Product.countDocuments({ 
                category: category._id 
            });
        }
    
        res.render('admin/tableCategory', {
            categories: categories,
            title: 'Quản lý danh mục sản phẩm',
            session: req.session
        });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách danh mục:', error);
        res.status(500).send('Có lỗi xảy ra khi tải danh sách danh mục');
    }
};

// Hiển thị trang thêm danh mục
exports.showCreateCategory = (req, res) => {
    res.render('admin/createCategory', {
        title: 'Thêm danh mục mới'
    });
};

// Xử lý thêm danh mục mới
exports.createCategory = async (req, res) => {
    try {
        const { name, description, isActive } = req.body;
        
        // Kiểm tra xem tên danh mục đã tồn tại chưa
        const existingCategory = await Category.findOne({ 
            name: { $regex: new RegExp('^' + name + '$', 'i') } // không phân biệt hoa thường
        });
        
        if (existingCategory) {
            return res.status(400).send(`
                <script>
                    alert('Tên danh mục "${name}" đã tồn tại!');
                    window.history.back();
                </script>
            `);
        }
        
        // Tạo danh mục mới
        const newCategory = new Category({
            name: name.trim(),
            description: description ? description.trim() : '',
            isActive: isActive === 'on' ? true : false
        });
        
        await newCategory.save();
        
        // Thông báo thành công và chuyển về trang danh sách
        res.send(`
            <script>
                alert('Thêm danh mục "${name}" thành công!');
                window.location.href = '/admin/categories';
            </script>
        `);
        
    } catch (error) {
        console.error('Lỗi khi thêm danh mục:', error);
        res.status(500).send(`
            <script>
                alert('Có lỗi xảy ra khi thêm danh mục!');
                window.history.back();
            </script>
        `);
    }
};

// Hiển thị trang sửa danh mục
exports.showEditCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        
        if (!category) {
            return res.status(404).send('Không tìm thấy danh mục');
        }
        
        res.render('admin/editCategory', {
            category: category,
            title: 'Sửa danh mục'
        });
    } catch (error) {
        console.error('Lỗi khi lấy thông tin danh mục:', error);
        res.status(500).send('Có lỗi xảy ra');
    }
};

// Xử lý cập nhật danh mục
exports.updateCategory = async (req, res) => {
    try {
        const { name, description, isActive } = req.body;
        const categoryId = req.params.id;
        
        // Validate
        if (!name || name.trim() === '') {
            req.flash('error', 'Tên danh mục không được để trống!');
            return res.redirect(`/admin/categories/edit/${categoryId}`);
        }
        
        // Kiểm tra tên trùng (trừ chính nó)
        const existingCategory = await Category.findOne({
            name: { $regex: new RegExp('^' + name.trim() + '$', 'i') },
            _id: { $ne: categoryId }
        });
        
        if (existingCategory) {
            req.flash('error', `Tên danh mục "${name}" đã tồn tại!`);
            return res.redirect(`/admin/categories/edit/${categoryId}`);
        }
        
        await Category.findByIdAndUpdate(categoryId, {
            name: name.trim(),
            description: description ? description.trim() : '',
            isActive: isActive === 'on' ? true : false
        });
        
        console.log('Đã cập nhật danh mục:', name);
        
        req.flash('success', 'Cập nhật danh mục thành công!');
        res.redirect('/admin/categories');
        
    } catch (error) {
        console.error('Lỗi khi sửa danh mục:', error);
        req.flash('error', 'Có lỗi xảy ra khi sửa danh mục!');
        res.redirect(`/admin/categories/edit/${req.params.id}`);
    }
};

// Xóa danh mục
exports.deleteCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        
        // Kiểm tra xem danh mục có sản phẩm không
        // const Product = require('../models/product');
        // const productCount = await Product.countDocuments({ category: categoryId });
        // if (productCount > 0) {
        //     return res.json({
        //         success: false,
        //         message: 'Không thể xóa danh mục vì còn ' + productCount + ' sản phẩm!'
        //     });
        // }
        
        const deletedCategory = await Category.findByIdAndDelete(categoryId);
        
        if (!deletedCategory) {
            return res.json({
                success: false,
                message: 'Không tìm thấy danh mục!'
            });
        }
        
        res.json({
            success: true,
            message: 'Xóa danh mục thành công!'
        });
        
    } catch (error) {
        console.error('Lỗi khi xóa danh mục:', error);
        res.json({
            success: false,
            message: 'Có lỗi xảy ra khi xóa danh mục!'
        });
    }
};
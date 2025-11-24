const Product = require('../models/product');
const Category = require('../models/category');

exports.getWishlist = async (req, res) => {
    try {
        let wishlistProducts = [];
        
        // Lấy danh sách wishlist từ session
        if (req.session.wishlist && req.session.wishlist.length > 0) {
            wishlistProducts = await Product.find({
                _id: { $in: req.session.wishlist },
                isActive: true
            }).populate('category', 'name');
        }

        const categories = await Category.find({ isActive: true }).sort({ name: 1 });
        
        res.render('user/wishlist', {
            products: wishlistProducts,
            categories: categories,
            title: 'Sản phẩm yêu thích - Hien Bakery Shop',
            session: req.session
        });
        
    } catch (error) {
        console.error('Lỗi khi lấy wishlist:', error);
        res.status(500).send('Có lỗi xảy ra');
    }
};

exports.addToCart = async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;
        
        // Khởi tạo cart nếu chưa có
        if (!req.session.cart) {
            req.session.cart = [];
        }
        
        // Kiểm tra sản phẩm đã có trong giỏ chưa
        const existingItem = req.session.cart.find(item => item.productId === productId);
        
        if (existingItem) {
            existingItem.quantity += parseInt(quantity);
        } else {
            req.session.cart.push({
                productId: productId,
                quantity: parseInt(quantity)
            });
        }
        
        // Cập nhật số lượng
        req.session.cartCount = req.session.cart.reduce((total, item) => total + item.quantity, 0);
        
        res.json({
            success: true,
            message: 'Đã thêm vào giỏ hàng!',
            cartCount: req.session.cartCount
        });
        
    } catch (error) {
        console.error('Lỗi thêm giỏ hàng:', error);
        res.json({
            success: false,
            message: 'Có lỗi xảy ra!'
        });
    }
};

// Thêm vào yêu thích
exports.addToWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        
        // Khởi tạo wishlist nếu chưa có
        if (!req.session.wishlist) {
            req.session.wishlist = [];
        }
        
        // Kiểm tra đã có chưa
        if (req.session.wishlist.includes(productId)) {
            return res.json({
                success: false,
                message: 'Sản phẩm đã có trong danh sách yêu thích!'
            });
        }
        
        req.session.wishlist.push(productId);
        req.session.wishlistCount = req.session.wishlist.length;
        
        res.json({
            success: true,
            message: 'Đã thêm vào danh sách yêu thích!',
            wishlistCount: req.session.wishlistCount
        });
        
    } catch (error) {
        console.error('Lỗi thêm wishlist:', error);
        res.json({
            success: false,
            message: 'Có lỗi xảy ra!'
        });
    }
};

// Xóa khỏi yêu thích
exports.removeFromWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        
        if (!req.session.wishlist) {
            req.session.wishlist = [];
        }
        
        req.session.wishlist = req.session.wishlist.filter(id => id !== productId);
        req.session.wishlistCount = req.session.wishlist.length;
        
        res.json({
            success: true,
            message: 'Đã xóa khỏi danh sách yêu thích!',
            wishlistCount: req.session.wishlistCount
        });
        
    } catch (error) {
        console.error('Lỗi xóa wishlist:', error);
        res.json({
            success: false,
            message: 'Có lỗi xảy ra!'
        });
    }
};

// Hiển thị trang giỏ hàng
exports.getCart = async (req, res) => {
    try {
        let cartItems = [];
        let subtotal = 0;
        
        // Lấy thông tin sản phẩm trong giỏ hàng
        if (req.session.cart && req.session.cart.length > 0) {
            const productIds = req.session.cart.map(item => item.productId);
            const products = await Product.find({
                _id: { $in: productIds },
                isActive: true
            }).populate('category', 'name');
            
            // Ghép thông tin sản phẩm với số lượng
            cartItems = req.session.cart.map(cartItem => {
                const product = products.find(p => p._id.toString() === cartItem.productId);
                if (product) {
                    const itemTotal = product.price * cartItem.quantity;
                    subtotal += itemTotal;
                    
                    return {
                        productId: product._id,
                        name: product.name,
                        description: product.description,
                        price: product.price,
                        images: product.images,
                        quantity: cartItem.quantity,
                        total: itemTotal
                    };
                }
                return null;
            }).filter(item => item !== null);
        }
        
        // Tính phí ship và giảm giá (có thể custom sau)
        const shipping = subtotal > 0 ? 30000 : 0; // 30k ship nếu có hàng
        const discount = 0; // Chưa có mã giảm giá
        const total = subtotal + shipping - discount;
        
        const categories = await Category.find({ isActive: true }).sort({ name: 1 });

        res.render('user/cart', {
            cartItems: cartItems,
            categories: categories,
            subtotal: subtotal,
            shipping: shipping,
            discount: discount,
            total: total,
            title: 'Giỏ hàng - Hien Bakery Shop',
            session: req.session
        });

    } catch (error) {
        console.error('Lỗi khi lấy giỏ hàng:', error);
        res.status(500).send('Có lỗi xảy ra');
    }
};

// Xóa sản phẩm khỏi giỏ hàng
exports.removeFromCart = async (req, res) => {
    try {
        const { productId } = req.body;
        
        if (!req.session.cart) {
            req.session.cart = [];
        }
        
        // Xóa sản phẩm
        req.session.cart = req.session.cart.filter(item => item.productId !== productId);
        
        // Cập nhật số lượng
        req.session.cartCount = req.session.cart.reduce((total, item) => total + item.quantity, 0);
        
        res.json({
            success: true,
            message: 'Đã xóa sản phẩm khỏi giỏ hàng!',
            cartCount: req.session.cartCount
        });
        
    } catch (error) {
        console.error('Lỗi xóa giỏ hàng:', error);
        res.json({
            success: false,
            message: 'Có lỗi xảy ra!'
        });
    }
};

exports.updateCartQuantity = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        
        // Validate
        if (!productId || !quantity || quantity < 1) {
            return res.json({
                success: false,
                message: 'Dữ liệu không hợp lệ!'
            });
        }

        // Lấy giỏ hàng từ session
        let cart = req.session.cart || [];
        
        // Tìm sản phẩm trong giỏ
        const itemIndex = cart.findIndex(item => item.productId === productId);
        
        if (itemIndex === -1) {
            return res.json({
                success: false,
                message: 'Không tìm thấy sản phẩm trong giỏ hàng!'
            });
        }

        // Cập nhật số lượng
        cart[itemIndex].quantity = parseInt(quantity);
        
        // Lưu lại session
        req.session.cart = cart;

        // Lấy thông tin sản phẩm từ DB để tính giá
        const product = await Product.findById(productId);
        
        if (!product) {
            return res.json({
                success: false,
                message: 'Không tìm thấy sản phẩm!'
            });
        }

        // Tính tổng tiền của item vừa cập nhật
        const itemTotal = product.price * parseInt(quantity);

        // Tính tổng giỏ hàng
        const productIds = cart.map(item => item.productId);
        const products = await Product.find({ _id: { $in: productIds }, isActive: true });
        
        let subtotal = 0;
        cart.forEach(cartItem => {
            const prod = products.find(p => p._id.toString() === cartItem.productId);
            if (prod) {
                subtotal += prod.price * cartItem.quantity;
            }
        });

        // Tính tổng số lượng items
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        
        // Cập nhật cartCount trong session
        req.session.cartCount = totalItems;

        const shipping = subtotal >= 1500000 ? 0 : 30000; // Miễn phí ship nếu >= 1tr500
        const discount = 0;
        const total = subtotal + shipping - discount;

        res.json({
            success: true,
            message: 'Đã cập nhật giỏ hàng!',
            cartCount: totalItems,
            itemTotal: itemTotal,
            cartSummary: {
                subtotal,
                shipping,
                discount,
                total
            }
        });

    } catch (error) {
        console.error('Lỗi cập nhật giỏ hàng:', error);
        res.json({
            success: false,
            message: 'Có lỗi xảy ra khi cập nhật giỏ hàng!'
        });
    }
};
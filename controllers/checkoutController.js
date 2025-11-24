const Order = require('../models/order');
const Product = require('../models/product');
const User = require('../models/user');
const Category = require('../models/category');
const vietqr = require('../utils/vietqr');

// Hiển thị trang checkout
exports.getCheckout = async (req, res) => {
    try {
        if (!req.session.userId) {
            req.flash('error', 'Vui lòng đăng nhập để thanh toán!');
            return res.redirect('/login');
        }

        const userId = req.session.userId;
        
        // Lấy thông tin user
        const user = await User.findById(userId);
        
        // Lấy giỏ hàng từ session
        const sessionCart = req.session.cart || [];

        if (sessionCart.length === 0) {
            req.flash('error', 'Giỏ hàng trống!');
            return res.redirect('/cart');
        }

        // Populate thông tin sản phẩm
        const productIds = sessionCart.map(item => item.productId);
        const products = await Product.find({ _id: { $in: productIds } });

        const cart = {
            items: sessionCart.map(item => {
                const product = products.find(p => p._id.toString() === item.productId);
                return {
                    product: product,
                    quantity: item.quantity
                };
            })
        };

        // Tính tổng tiền
        const subtotal = cart.items.reduce((sum, item) => {
            return sum + (item.product.price * item.quantity);
        }, 0);

        // Phí ship: 30k, miễn phí nếu > 1tr500
        const shippingFee = subtotal >= 1500000 ? 0 : 30000;
        const total = subtotal + shippingFee;

        // Load categories cho header
        const categories = await Category.find({ isActive: true }).sort({ name: 1 });

        res.render('user/checkout', {
            user,
            cart,
            subtotal,
            shippingFee,
            total,
            categories,
            title: 'Thanh toán',
            session: req.session
        });

    } catch (error) {
        console.error('Lỗi checkout:', error);
        req.flash('error', 'Có lỗi xảy ra!');
        res.redirect('/cart');
    }
};

// Xử lý đặt hàng
exports.processOrder = async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.json({ success: false, message: 'Vui lòng đăng nhập!' });
        }

        const { 
            customerName, 
            phone, 
            email, 
            shippingAddress, 
            deliveryDate, 
            deliveryTime, 
            paymentMethod,
            note 
        } = req.body;

        // Validate
        if (!customerName || !phone || !shippingAddress || !deliveryDate || !deliveryTime) {
            return res.json({ success: false, message: 'Vui lòng điền đầy đủ thông tin!' });
        }

        const userId = req.session.userId;
        const sessionCart = req.session.cart || [];

        if (sessionCart.length === 0) {
            return res.json({ success: false, message: 'Giỏ hàng trống!' });
        }

        // Populate thông tin sản phẩm
        const productIds = sessionCart.map(item => item.productId);
        const products = await Product.find({ _id: { $in: productIds } });

        const cart = {
            items: sessionCart.map(item => {
                const product = products.find(p => p._id.toString() === item.productId);
                return {
                    product: product,
                    quantity: item.quantity
                };
            })
        };

        // Tính tiền
        const subtotal = cart.items.reduce((sum, item) => {
            return sum + (item.product.price * item.quantity);
        }, 0);

        const shippingFee = subtotal >= 1500000 ? 0 : 30000;
        const total = subtotal + shippingFee;

        // Tạo mã đơn hàng duy nhất
        const orderNumber = 'DH' + Date.now();

        // Tạo order
        const order = new Order({
            orderNumber: orderNumber,
            user: userId,
            customerName,
            phone,
            email,
            shippingAddress,
            deliveryDate,
            deliveryTime,
            items: cart.items.map(item => ({
                product: item.product._id,
                name: item.product.name,
                price: item.product.price,
                quantity: item.quantity,
                image: item.product.images[0]
            })),
            subtotal,
            shippingFee,
            total,
            paymentMethod,
            note
        });
        await order.save();

        // Nếu thanh toán chuyển khoản, tạo QR code
        let qrData = null;
        if (paymentMethod === 'bank_transfer') {
            qrData = await vietqr.generatePaymentQR(
                total,
                order.orderNumber,
                `Thanh toan don hang ${order.orderNumber}`
            );
        }

        // Xóa giỏ hàng
        req.session.cart = [];
        req.session.cartCount = 0;

        res.json({ 
            success: true, 
            message: 'Đặt hàng thành công!',
            orderId: order._id,
            orderNumber: order.orderNumber,
            paymentMethod: paymentMethod,
            qrData: qrData // Trả về thông tin QR
        });

    } catch (error) {
        console.error('Lỗi đặt hàng:', error);
        res.json({ success: false, message: 'Có lỗi xảy ra!' });
    }
};
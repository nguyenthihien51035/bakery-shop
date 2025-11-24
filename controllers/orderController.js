const Order = require('../models/order');
const Category = require('../models/category');

// Hiển thị danh sách đơn hàng của user
exports.getUserOrders = async (req, res) => {
    try {
        if (!req.session.userId) {
            req.flash('error', 'Vui lòng đăng nhập!');
            return res.redirect('/login');
        }
        
        // Lấy tất cả đơn hàng sắp xếp mới nhất trước
        const orders = await Order.find({ user: req.session.userId })
            .sort({ createdAt: -1 })
            .populate('items.product', 'name images');
        const categories = await Category.find({ isActive: true }).sort({ name: 1 });

        res.render('user/orders', {
            orders: orders,
            categories: categories,
            title: 'Đơn hàng của tôi',
            session: req.session
        });
        
    } catch (error) {
        console.error('Lỗi khi lấy đơn hàng:', error);
        res.status(500).send('Có lỗi xảy ra');
    }
};

// Xem chi tiết đơn hàng
exports.getOrderDetail = async (req, res) => {
    try {
        if (!req.session.userId) {
            req.flash('error', 'Vui lòng đăng nhập!');
            return res.redirect('/login');
        }
        
        const order = await Order.findOne({
            _id: req.params.id,
            user: req.session.userId
        }).populate('items.product', 'name images');
        
        if (!order) {
            req.flash('error', 'Không tìm thấy đơn hàng!');
            return res.redirect('/orders');
        }
        
        res.render('user/orderDetail', {
            order: order,
            title: 'Chi tiết đơn hàng',
            session: req.session
        });
        
    } catch (error) {
        console.error('Lỗi:', error);
        res.status(500).send('Có lỗi xảy ra');
    }
};

// Hủy đơn hàng
exports.cancelOrder = async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.json({ success: false, message: 'Vui lòng đăng nhập!' });
        }
        
        const order = await Order.findOne({
            _id: req.params.id,
            user: req.session.userId
        });
        
        if (!order) {
            return res.json({ success: false, message: 'Không tìm thấy đơn hàng!' });
        }
        
        // Chỉ cho phép hủy nếu đơn hàng đang pending hoặc confirmed
        if (!['pending', 'confirmed'].includes(order.orderStatus)) {
            return res.json({ 
                success: false, 
                message: 'Không thể hủy đơn hàng đang xử lý hoặc đã giao!' 
            });
        }
        
        order.orderStatus = 'cancelled';
        await order.save();
        
        res.json({ 
            success: true, 
            message: 'Đã hủy đơn hàng thành công!' 
        });
        
    } catch (error) {
        console.error('Lỗi hủy đơn:', error);
        res.json({ success: false, message: 'Có lỗi xảy ra!' });
    }
};
const Order = require('../models/order');

// Hiển thị danh sách tất cả đơn hàng
exports.getAllOrders = async (req, res) => {
    try {
        const { status, paymentStatus, search } = req.query;
        
        // Build query filter
        let filter = {};
        
        if (status) {
            filter.orderStatus = status;
        }
        
        if (paymentStatus) {
            filter.paymentStatus = paymentStatus;
        }
        
        if (search) {
            filter.$or = [
                { orderNumber: { $regex: search, $options: 'i' } },
                { customerName: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Lấy đơn hàng
        const orders = await Order.find(filter)
            .populate('user', 'username email')
            .sort({ createdAt: -1 });
        
        res.render('admin/tableOrder', {
            orders: orders,
            filter: { status, paymentStatus, search },
            title: 'Quản lý đơn hàng',
            session: req.session
        });
        
    } catch (error) {
        console.error('Lỗi:', error);
        res.status(500).send('Có lỗi xảy ra');
    }
};

// Xem chi tiết đơn hàng
exports.getOrderDetail = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'username email')
            .populate('items.product', 'name images');
        
        if (!order) {
            req.flash('error', 'Không tìm thấy đơn hàng!');
            return res.redirect('/admin/orders');
        }
        
        res.render('admin/orderDetail', {
            order: order,
            title: 'Chi tiết đơn hàng',
            session: req.session
        });
        
    } catch (error) {
        console.error('Lỗi:', error);
        req.flash('error', 'Có lỗi xảy ra!');
        res.redirect('/admin/orders');
    }
};

// Cập nhật trạng thái đơn hàng
exports.updateOrderStatus = async (req, res) => {
    try {
        const { orderStatus } = req.body;
        const orderId = req.params.id;
        
        const order = await Order.findById(orderId);
        if (!order) {
            return res.json({ success: false, message: 'Không tìm thấy đơn hàng!' });
        }
        
        order.orderStatus = orderStatus;
        
        // Nếu đơn hàng delivered và thanh toán COD, tự động đổi paymentStatus thành paid
        if (orderStatus === 'delivered' && order.paymentMethod === 'cod') {
            order.paymentStatus = 'paid';
        }
        
        await order.save();
        
        console.log('Đã cập nhật trạng thái đơn hàng:', order.orderNumber);
        
        res.json({ 
            success: true, 
            message: 'Cập nhật trạng thái thành công!' 
        });
        
    } catch (error) {
        console.error('Lỗi:', error);
        res.json({ success: false, message: 'Có lỗi xảy ra!' });
    }
};

// Cập nhật trạng thái thanh toán
exports.updatePaymentStatus = async (req, res) => {
    try {
        const { paymentStatus } = req.body;
        const orderId = req.params.id;
        
        const order = await Order.findById(orderId);
        if (!order) {
            return res.json({ success: false, message: 'Không tìm thấy đơn hàng!' });
        }
        
        order.paymentStatus = paymentStatus;
        await order.save();
        
        console.log('Đã cập nhật trạng thái thanh toán:', order.orderNumber);
        
        res.json({ 
            success: true, 
            message: 'Cập nhật trạng thái thanh toán thành công!' 
        });
        
    } catch (error) {
        console.error('Lỗi:', error);
        res.json({ success: false, message: 'Có lỗi xảy ra!' });
    }
};

// Xóa đơn hàng
exports.deleteOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        
        if (!order) {
            return res.json({ success: false, message: 'Không tìm thấy đơn hàng!' });
        }
        
        // Chỉ cho phép xóa đơn hàng đã hủy hoặc đã giao
        if (!['cancelled', 'delivered'].includes(order.orderStatus)) {
            return res.json({ 
                success: false, 
                message: 'Chỉ có thể xóa đơn hàng đã hủy hoặc đã giao!' 
            });
        }
        
        await Order.findByIdAndDelete(req.params.id);
        
        console.log('Đã xóa đơn hàng:', order.orderNumber);
        
        res.json({ 
            success: true, 
            message: 'Xóa đơn hàng thành công!' 
        });
        
    } catch (error) {
        console.error('Lỗi:', error);
        res.json({ success: false, message: 'Có lỗi xảy ra!' });
    }
};
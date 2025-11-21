const User = require('../models/user');

// Hiển thị danh sách người dùng
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        
        res.render('admin/tableUser', {
            users: users,
            title: 'Quản lý người dùng',
            session: req.session
        });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách người dùng:', error);
        res.status(500).send('Có lỗi xảy ra');
    }
};

// Cập nhật quyền người dùng
exports.updateUserRole = async (req, res) => {
    try {
        const { userId, role } = req.body;
        
        // Validate
        if (!userId || !role) {
            return res.json({
                success: false,
                message: 'Thiếu thông tin!'
            });
        }
        
        if (!['user', 'admin'].includes(role)) {
            return res.json({
                success: false,
                message: 'Quyền không hợp lệ!'
            });
        }
        
        // Không cho phép tự thay đổi quyền của chính mình
        if (userId === req.session.userId) {
            return res.json({
                success: false,
                message: 'Không thể thay đổi quyền của chính bạn!'
            });
        }
        
        // Cập nhật role
        await User.findByIdAndUpdate(userId, { role: role });
        
        console.log('Đã cập nhật quyền user:', userId, '→', role);
        
        res.json({
            success: true,
            message: 'Cập nhật quyền thành công!'
        });
        
    } catch (error) {
        console.error('Lỗi khi cập nhật quyền:', error);
        res.json({
            success: false,
            message: 'Có lỗi xảy ra!'
        });
    }
};

// Toggle trạng thái active/inactive
exports.toggleUserStatus = async (req, res) => {
    try {
        const userId = req.params.id;
        
        // Không cho phép khóa chính mình
        if (userId === req.session.userId) {
            return res.json({
                success: false,
                message: 'Không thể khóa tài khoản của chính bạn!'
            });
        }
        
        const user = await User.findById(userId);
        if (!user) {
            return res.json({
                success: false,
                message: 'Không tìm thấy người dùng!'
            });
        }
        
        // Đảo ngược trạng thái
        user.isActive = !user.isActive;
        await user.save();
        
        console.log('Đã', user.isActive ? 'kích hoạt' : 'khóa', 'user:', user.email);
        
        res.json({
            success: true,
            message: user.isActive ? 'Đã kích hoạt tài khoản!' : 'Đã khóa tài khoản!',
            isActive: user.isActive
        });
        
    } catch (error) {
        console.error('Lỗi khi thay đổi trạng thái:', error);
        res.json({
            success: false,
            message: 'Có lỗi xảy ra!'
        });
    }
};

// Xóa người dùng
exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        
        // Không cho phép xóa chính mình
        if (userId === req.session.userId) {
            return res.json({
                success: false,
                message: 'Không thể xóa tài khoản của chính bạn!'
            });
        }
        
        const user = await User.findById(userId);
        if (!user) {
            return res.json({
                success: false,
                message: 'Không tìm thấy người dùng!'
            });
        }
        
        await User.findByIdAndDelete(userId);
        
        console.log('Đã xóa user:', user.email);
        
        res.json({
            success: true,
            message: 'Xóa người dùng thành công!'
        });
        
    } catch (error) {
        console.error('Lỗi khi xóa người dùng:', error);
        res.json({
            success: false,
            message: 'Có lỗi xảy ra!'
        });
    }
};
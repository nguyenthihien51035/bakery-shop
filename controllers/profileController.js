const User = require('../models/user');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Hiển thị trang profile
exports.showProfile = async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        
        if (!user) {
            req.flash('error', 'Không tìm thấy thông tin người dùng!');
            // Redirect tùy theo role
            const redirectUrl = user?.role === 'admin' ? '/admin' : '/';
            return res.redirect(redirectUrl);
        }

        let categories = [];
        if (user.role === 'user') {
            const Category = require('../models/category');
            categories = await Category.find({ isActive: true }).sort({ name: 1 });
        }
        
        // Render view tùy theo role
        const viewPath = user.role === 'admin' ? 'admin/profile' : 'user/profile';
        
        res.render(viewPath, {
            user: user,
            categories: categories, 
            title: 'Thông tin cá nhân',
            session: req.session
        });
        
    } catch (error) {
        console.error('Lỗi:', error);
        res.status(500).send('Có lỗi xảy ra');
    }
};

// Cập nhật thông tin cá nhân
exports.updateProfile = async (req, res) => {
    try {
        const { username, phone, address } = req.body;
        const userId = req.session.userId;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.json({ success: false, message: 'Không tìm thấy người dùng!' });
        }
        
        // Kiểm tra username trùng (trừ chính mình)
        if (username !== user.username) {
            const existingUser = await User.findOne({
                username: username,
                _id: { $ne: userId }
            });
            
            if (existingUser) {
                return res.json({ 
                    success: false, 
                    message: 'Tên đăng nhập đã tồn tại!' 
                });
            }
        }
        
        // Cập nhật avatar nếu có
        let avatarPath = user.avatar;
        if (req.file) {
            // Xóa avatar cũ
            if (user.avatar) {
                const oldAvatarPath = path.join(__dirname, '../public/uploads/avatars', user.avatar);
                if (fs.existsSync(oldAvatarPath)) {
                    fs.unlinkSync(oldAvatarPath);
                }
            }
            avatarPath = req.file.filename;
        }
        
        // Cập nhật thông tin
        user.username = username;
        user.phone = phone || null;
        user.address = address || null;
        user.avatar = avatarPath;
        
        await user.save();
        
        // Cập nhật session
        req.session.username = user.username;
        
        console.log('Đã cập nhật profile:', user.username);
        
        res.json({ 
            success: true, 
            message: 'Cập nhật thông tin thành công!',
            avatar: avatarPath
        });
        
    } catch (error) {
        console.error('Lỗi:', error);
        res.json({ success: false, message: 'Có lỗi xảy ra!' });
    }
};

// Đổi mật khẩu
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const userId = req.session.userId;
        
        // Validate
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.json({ 
                success: false, 
                message: 'Vui lòng điền đầy đủ thông tin!' 
            });
        }
        
        if (newPassword.length < 6) {
            return res.json({ 
                success: false, 
                message: 'Mật khẩu mới phải có ít nhất 6 ký tự!' 
            });
        }
        
        if (newPassword !== confirmPassword) {
            return res.json({ 
                success: false, 
                message: 'Mật khẩu xác nhận không khớp!' 
            });
        }
        
        // Lấy user
        const user = await User.findById(userId);
        if (!user) {
            return res.json({ success: false, message: 'Không tìm thấy người dùng!' });
        }
        
        // Kiểm tra mật khẩu hiện tại
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.json({ 
                success: false, 
                message: 'Mật khẩu hiện tại không đúng!' 
            });
        }
        
        // Cập nhật mật khẩu mới
        user.password = newPassword; // Sẽ tự động hash bởi pre-save hook
        await user.save();
        
        console.log('Đã đổi mật khẩu:', user.username);
        
        res.json({ 
            success: true, 
            message: 'Đổi mật khẩu thành công!' 
        });
        
    } catch (error) {
        console.error('Lỗi:', error);
        res.json({ success: false, message: 'Có lỗi xảy ra!' });
    }
};

// Upload avatar riêng
exports.uploadAvatar = async (req, res) => {
    try {
        const userId = req.session.userId;
        
        if (!req.file) {
            return res.json({ success: false, message: 'Vui lòng chọn ảnh!' });
        }
        
        const user = await User.findById(userId);
        if (!user) {
            return res.json({ success: false, message: 'Không tìm thấy người dùng!' });
        }
        
        // Xóa avatar cũ
        if (user.avatar) {
            const oldAvatarPath = path.join(__dirname, '../public/uploads/avatars', user.avatar);
            if (fs.existsSync(oldAvatarPath)) {
                fs.unlinkSync(oldAvatarPath);
            }
        }
        
        // Cập nhật avatar mới
        user.avatar = req.file.filename;
        await user.save();
        
        console.log('Đã cập nhật avatar:', user.username);
        
        res.json({ 
            success: true, 
            message: 'Cập nhật avatar thành công!',
            avatar: req.file.filename
        });
        
    } catch (error) {
        console.error('Lỗi upload avatar:', error);
        res.json({ success: false, message: 'Có lỗi xảy ra!' });
    }
};
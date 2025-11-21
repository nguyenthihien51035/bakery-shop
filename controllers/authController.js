const crypto = require('crypto');
const { sendResetPasswordEmail } = require('../config/email');
const User = require('../models/user');

// Hiển thị trang đăng ký
exports.showRegister = (req, res) => {
    res.render('auth/register', {
        title: 'Đăng ký tài khoản'
    });
};

// Xử lý đăng ký
exports.register = async (req, res) => {
    try {
        const { username, email, password, confirmPassword } = req.body;
        
        // Validate
        if (!username || !email || !password || !confirmPassword) {
            req.flash('error', 'Vui lòng điền đầy đủ thông tin!');
            return res.redirect('/register');
        }
        
        if (username.length < 3) {
            req.flash('error', 'Tên đăng nhập phải có ít nhất 3 ký tự!');
            return res.redirect('/register');
        }
        
        if (password.length < 6) {
            req.flash('error', 'Mật khẩu phải có ít nhất 6 ký tự!');
            return res.redirect('/register');
        }
        
        if (password !== confirmPassword) {
            req.flash('error', 'Mật khẩu xác nhận không khớp!');
            return res.redirect('/register');
        }
        
        // Kiểm tra email đã tồn tại
        const existingEmail = await User.findOne({ email: email });
        if (existingEmail) {
            req.flash('error', 'Email đã được sử dụng!');
            return res.redirect('/register');
        }
        
        // Tạo user mới (mặc định role = 'user')
        const newUser = new User({
            username: username.trim(),
            email: email.trim().toLowerCase(),
            password: password,
            role: 'user' // Mặc định là user
        });
        
        await newUser.save();
        
        console.log('Đăng ký thành công:', newUser.username);
        
        req.flash('success', 'Đăng ký thành công! Vui lòng đăng nhập.');
        res.redirect('/login');
        
    } catch (error) {
        console.error('Lỗi khi đăng ký:', error);
        req.flash('error', 'Có lỗi xảy ra khi đăng ký!');
        res.redirect('/register');
    }
};

// Hiển thị trang đăng nhập
exports.showLogin = (req, res) => {
    res.render('auth/login', {
        title: 'Đăng nhập'
    });
};

// Xử lý đăng nhập
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body; 
        
        // Validate
        if (!email || !password) {
            req.flash('error', 'Vui lòng nhập email và mật khẩu!');
            return res.redirect('/login');
        }
        
        // Tìm user theo email
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            req.flash('error', 'Email hoặc mật khẩu không đúng!');
            return res.redirect('/login');
        }
        
        // Kiểm tra password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            req.flash('error', 'Email hoặc mật khẩu không đúng!');
            return res.redirect('/login');
        }
        
        // Kiểm tra tài khoản có active không
        if (!user.isActive) {
            req.flash('error', 'Tài khoản của bạn đã bị khóa!');
            return res.redirect('/login');
        }
        
        // Lưu thông tin vào session
        req.session.userId = user._id;
        req.session.username = user.username;
        req.session.email = user.email;
        req.session.role = user.role;
        
        console.log('Đăng nhập thành công:', user.email, '- Role:', user.role);
        
        // Redirect theo role
        if (user.role === 'admin') {
            req.flash('success', 'Chào mừng Admin ' + user.username + '!');
            res.redirect('/admin');
        } else {
            req.flash('success', 'Đăng nhập thành công!');
            res.redirect('/');
        }
        
    } catch (error) {
        console.error('Lỗi khi đăng nhập:', error);
        req.flash('error', 'Có lỗi xảy ra khi đăng nhập!');
        res.redirect('/login');
    }
};

// Đăng xuất
exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Lỗi khi đăng xuất:', err);
        }
        res.redirect('/login');
    });
};

// Hiển thị trang quên mật khẩu
exports.showForgotPassword = (req, res) => {
    res.render('auth/forgotPassword', {
        title: 'Quên mật khẩu'
    });
};

// Xử lý gửi email reset password
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            req.flash('error', 'Vui lòng nhập email!');
            return res.redirect('/forgot-password');
        }
        
        // Tìm user
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            // Không thông báo user không tồn tại (bảo mật)
            req.flash('success', 'Nếu email tồn tại, chúng tôi đã gửi link đặt lại mật khẩu!');
            return res.redirect('/forgot-password');
        }
        
        // Tạo reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        
        // Lưu token vào database (hash trước khi lưu)
        user.resetPasswordToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');
        user.resetPasswordExpires = Date.now() + 3600000; // 1 giờ
        
        await user.save();
        
        // Gửi email
        const emailSent = await sendResetPasswordEmail(user.email, resetToken, user.username);
        
        if (emailSent) {
            console.log('Đã gửi email reset password cho:', user.email);
            req.flash('success', 'Link đặt lại mật khẩu đã được gửi đến email của bạn!');
        } else {
            req.flash('error', 'Có lỗi khi gửi email. Vui lòng thử lại!');
        }
        
        res.redirect('/forgot-password');
        
    } catch (error) {
        console.error('Lỗi khi xử lý quên mật khẩu:', error);
        req.flash('error', 'Có lỗi xảy ra. Vui lòng thử lại!');
        res.redirect('/forgot-password');
    }
};

// Hiển thị trang đặt lại mật khẩu
exports.showResetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        
        // Hash token để so sánh với database
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');
        
        // Tìm user có token hợp lệ và chưa hết hạn
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });
        
        if (!user) {
            req.flash('error', 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn!');
            return res.redirect('/forgot-password');
        }
        
        res.render('auth/resetPassword', {
            title: 'Đặt lại mật khẩu',
            token: token
        });
        
    } catch (error) {
        console.error('Lỗi:', error);
        req.flash('error', 'Có lỗi xảy ra!');
        res.redirect('/forgot-password');
    }
};

// Xử lý đặt lại mật khẩu
exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password, confirmPassword } = req.body;
        
        // Validate
        if (!password || !confirmPassword) {
            req.flash('error', 'Vui lòng điền đầy đủ thông tin!');
            return res.redirect(`/reset-password/${token}`);
        }
        
        if (password.length < 6) {
            req.flash('error', 'Mật khẩu phải có ít nhất 6 ký tự!');
            return res.redirect(`/reset-password/${token}`);
        }
        
        if (password !== confirmPassword) {
            req.flash('error', 'Mật khẩu xác nhận không khớp!');
            return res.redirect(`/reset-password/${token}`);
        }
        
        // Hash token
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');
        
        // Tìm user
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });
        
        if (!user) {
            req.flash('error', 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn!');
            return res.redirect('/forgot-password');
        }
        
        // Cập nhật mật khẩu mới
        user.password = password; 
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        
        await user.save();
        
        console.log('Đã đặt lại mật khẩu cho:', user.email);
        
        req.flash('success', 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập.');
        res.redirect('/login');
        
    } catch (error) {
        console.error('Lỗi khi đặt lại mật khẩu:', error);
        req.flash('error', 'Có lỗi xảy ra!');
        res.redirect(`/reset-password/${req.params.token}`);
    }
};
exports.isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    }
    req.flash('error', 'Vui lòng đăng nhập!');
    res.redirect('/login');
};

// Kiểm tra là Admin
exports.isAdmin = (req, res, next) => {
    if (req.session && req.session.userId && req.session.role === 'admin') {
        return next();
    }
    req.flash('error', 'Bạn không có quyền truy cập!');
    res.redirect('/');
};

// Kiểm tra là User
exports.isUser = (req, res, next) => {
    if (req.session && req.session.userId && req.session.role === 'user') {
        return next();
    }
    req.flash('error', 'Bạn không có quyền truy cập!');
    res.redirect('/admin');
};
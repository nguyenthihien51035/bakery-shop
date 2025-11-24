const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const connectDB = require('./connect');
const flash = require('connect-flash');

const app = express();
const PORT = 4000;

connectDB();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Cấu hình session
app.use(session({
    secret: 'my-news-app-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: false // Để true nếu dùng HTTPS
    }
}));

app.use(flash());

// Middleware truyền session vào view
app.use((req, res, next) => {
    res.locals.session = req.session || {};
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.cartCount = req.session.cartCount || 0;
    res.locals.wishlistCount = req.session.wishlistCount || 0;
    next();
});

// Static files
app.use(express.static('public'));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');

app.use('/', userRoutes);
app.use('/admin', adminRoutes);
app.use('/', authRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

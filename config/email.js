const nodemailer = require('nodemailer');

// Cấu hình email transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,       
    port: process.env.SMTP_PORT,       
    secure: false,                      
    auth: {
        user: process.env.SMTP_USER,    
        pass: process.env.SMTP_PASS     
    }
});

// Function gửi email
const sendResetPasswordEmail = async (email, resetToken, username) => {
    const resetUrl = `http://localhost:4000/reset-password/${resetToken}`;
    
    const mailOptions = {
        from: 'Hien Bakery Shop <your-email@gmail.com>',
        to: email,
        subject: 'Đặt lại mật khẩu - Hien Bakery',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #696cff;">Yêu cầu đặt lại mật khẩu</h2>
                <p>Xin chào <strong>${username}</strong>,</p>
                <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
                <p>Vui lòng nhấp vào nút bên dưới để đặt lại mật khẩu:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" 
                       style="background-color: #696cff; color: white; padding: 12px 30px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;">
                        Đặt lại mật khẩu
                    </a>
                </div>
                <p>Hoặc copy link sau vào trình duyệt:</p>
                <p style="background-color: #f5f5f5; padding: 10px; border-radius: 5px; word-break: break-all;">
                    ${resetUrl}
                </p>
                <p style="color: #e74c3c;">
                    <strong>Lưu ý:</strong> Link này chỉ có hiệu lực trong vòng <strong>1 giờ</strong>.
                </p>
                <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                <p style="color: #999; font-size: 12px;">
                    Email này được gửi tự động, vui lòng không trả lời.<br>
                    © 2025 Hien Bakery Shop. All rights reserved.
                </p>
            </div>
        `
    };
    
    try {
        await transporter.sendMail(mailOptions);
        console.log('Email đã được gửi đến:', email);
        return true;
    } catch (error) {
        console.error('Lỗi khi gửi email:', error);
        return false;
    }
};

module.exports = { sendResetPasswordEmail };
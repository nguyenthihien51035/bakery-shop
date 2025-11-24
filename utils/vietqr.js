const QRCode = require('qrcode');

// Thông tin tài khoản ngân hàng
const BANK_CONFIG = {
    bankId: '970436',
    accountNo: '10277141000', 
    accountName: 'NGUYEN THI HIEN', 
    template: 'compact'      
};

// Tạo QR Code thanh toán
exports.generatePaymentQR = async (amount, orderNumber, description) => {
    try {
        // Format số tiền (không có dấu phẩy, chấm)
        const formattedAmount = Math.round(amount);
        
        // Nội dung chuyển khoản
        const content = description || `Thanh toan don hang ${orderNumber}`;
        
        // URL VietQR API
        const vietQRUrl = `https://img.vietqr.io/image/${BANK_CONFIG.bankId}-${BANK_CONFIG.accountNo}-${BANK_CONFIG.template}.png?amount=${formattedAmount}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent(BANK_CONFIG.accountName)}`;
        
        return {
            success: true,
            qrUrl: vietQRUrl,
            bankInfo: {
                bankName: 'VIETCOMBANK', 
                accountNo: BANK_CONFIG.accountNo,
                accountName: BANK_CONFIG.accountName,
                amount: formattedAmount,
                content: content
            }
        };
        
    } catch (error) {
        console.error('Lỗi tạo QR:', error);
        return {
            success: false,
            message: 'Không thể tạo mã QR'
        };
    }
};

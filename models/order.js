const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  
  // Thông tin nhận hàng
  customerName: {
    type: String,
    required: true
  },
  
  phone: {
    type: String,
    required: true
  },
  
  email: String,
  
  shippingAddress: {
    type: String,
    required: true
  },
  
  deliveryDate: {
    type: Date,
    required: true
  },
  
  deliveryTime: {
    type: String,
    required: true 
  },
  
  // Sản phẩm
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: String,
    price: Number,
    quantity: Number,
    image: String
  }],
  
  // Giá
  subtotal: {
    type: Number,
    required: true
  },
  
  shippingFee: {
    type: Number,
    default: 30000
  },
  
  total: {
    type: Number,
    required: true
  },
  
  // Thanh toán
  paymentMethod: {
    type: String,
    enum: ['cod', 'bank_transfer'],
    default: 'cod'
  },
  
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  
  // Trạng thái đơn hàng
  orderStatus: {  
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled'],  // ← Sửa 'preparing' thành 'processing'
    default: 'pending'
  },
  
  note: String
  
}, { timestamps: true });

// Tự động tạo mã đơn hàng
orderSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = 'ORD' + String(count + 1).padStart(6, '0');
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
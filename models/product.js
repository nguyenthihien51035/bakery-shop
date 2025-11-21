const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },

  description: String, 

  price: { type: Number, required: true, min: 0 },

  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  
  images: [String], // Mảng chứa tên file ảnh
  
  size: String, // "18cm", "Nhỏ (1-2 người)", "20cm"...
  
  isActive: { type: Boolean, default: true }
  
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
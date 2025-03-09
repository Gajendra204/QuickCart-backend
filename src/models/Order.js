const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  items: [{
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
    quantity: Number
  }],
  total: { type: Number, required: true },
  mobile: { type: String, required: true },
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
  status: { type: String, default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
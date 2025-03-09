const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  shopkeeper: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shopkeeper',
    required: true
  },
  barcode: { type: String, unique: true },
  barcodeImage: {type: String, unique: true},
  address: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Store', storeSchema);
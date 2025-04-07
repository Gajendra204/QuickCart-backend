const mongoose = require("mongoose");

// const orderSchema = new mongoose.Schema({
//   items: [{
//     item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
//     quantity: Number
//   }],
//   total: { type: Number, required: true },
//   mobile: { type: String, required: true },
//   store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
//   status: { type: String, default: 'Pending' },
//   createdAt: { type: Date, default: Date.now }
// });

// module.exports = mongoose.model('Order', orderSchema);

const orderSchema = new mongoose.Schema({
  items: [
    {
      item: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
      quantity: Number,
    },
  ],
  total: { type: Number, required: true },
  mobile: { type: String, required: true },
  store: { type: mongoose.Schema.Types.ObjectId, ref: "Store" },
  status: {
    type: String,
    default: "Pending",
    enum: ["Pending", "Processing", "Completed", "Cancelled"],
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Add pre-save hook to update updatedAt
orderSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Order', orderSchema);

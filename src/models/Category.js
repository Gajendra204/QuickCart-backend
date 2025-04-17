const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Store",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

// Check if model exists before compiling
module.exports = mongoose.models.Category || mongoose.model("Category", categorySchema);
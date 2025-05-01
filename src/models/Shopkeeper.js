const mongoose = require("mongoose");

const shopkeeperSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Shopkeeper", shopkeeperSchema);

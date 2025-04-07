const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const mongoose = require("mongoose");
const Shopkeeper = require("../models/Shopkeeper");
const Store = require("../models/Store");
const Item = require("../models/Item");
const Category = require("../models/category");
const fs = require("fs");
const path = require("path");
const bwipjs = require("bwip-js");
const Order = require("../models/Order"); // Ensure correct path

// Image upload setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
exports.upload = multer({ storage });

// Shopkeeper Registration
exports.register = async (req, res) => {
  try {
    console.log("Ha bhai athe aa giyo");
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("aajaya ree");
    const shopkeeper = new Shopkeeper({
      name,
      email,
      password: hashedPassword,
    });
    await shopkeeper.save();
    res.status(201).json({ message: "Shopkeeper created" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Shopkeeper Login
exports.login = async (req, res) => {
  try {
    console.log("Request reached here in login,", req.body);
    const { email, password } = req.body;
    const shopkeeper = await Shopkeeper.findOne({ email });
    if (!shopkeeper || !(await bcrypt.compare(password, shopkeeper.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ id: shopkeeper._id }, process.env.JWT_SECRET);
    res.json({ token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Create Store
exports.createStore = async (req, res) => {
  try {
    const { name, address } = req.body;

    // Create the store
    const store = new Store({
      name,
      address,
      shopkeeper: req.shopkeeper._id,
      barcode: new mongoose.Types.ObjectId().toString(), // Use store ID as barcode
    });
    await store.save();

    // Generate barcode image
    const barcodeData = store._id.toString(); // Use store ID as barcode data
    const barcodeImagePath = path.join(
      __dirname,
      `../public/barcodes/${store._id}.png`
    );

    // Ensure the "public/barcodes" directory exists
    if (!fs.existsSync(path.join(__dirname, "../public/barcodes"))) {
      fs.mkdirSync(path.join(__dirname, "../public/barcodes"), {
        recursive: true,
      });
    }

    bwipjs.toBuffer(
      {
        bcid: "code128", // Barcode type
        text: barcodeData, // Data to encode
        scale: 3, // Scaling factor
        height: 10, // Barcode height
        includetext: true, // Include human-readable text
        textxalign: "center", // Center-align text
      },
      async (err, png) => {
        if (err) {
          console.error("Error generating barcode:", err);
          return res.status(500).json({ error: "Failed to generate barcode" });
        }

        // Save the barcode image to the public folder
        fs.writeFileSync(barcodeImagePath, png);

        // Update the store with the barcode image URL
        store.barcodeImage = `/barcodes/${store._id}.png`;
        await store.save();
        res.status(201).json(store);
      }
    );
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Create Category
exports.createCategory = async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Create Item
exports.createItem = async (req, res) => {
  try {
    const item = new Item({
      ...req.body,
      image: req.file ? req.file.path : null,
    });
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get Orders by Shopkeeper (for shopkeepers)
exports.getShopkeeperOrders = async (req, res) => {
  try {
    console.log("Fetching orders for shopkeeper:", req.shopkeeper._id);
    // Find all stores owned by this shopkeeper
    const stores = await Store.find({ shopkeeper: req.shopkeeper._id });
    // console.log("Shopkeeper's stores:", stores);
    const storeIds = stores.map((store) => store._id);

    // Find all orders for these stores
    const orders = await Order.find({ store: { $in: storeIds } })
      .populate("store", "name")
      .populate("items.item", "name mrp discount");

    res.json(orders);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    console.log("Updating order status:", orderId, status);
    // Verify the order belongs to this shopkeeper's store
    const order = await Order.findById(orderId).populate("store");
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const store = await Store.findOne({
      _id: order.store._id,
      shopkeeper: req.shopkeeper._id,
    });

    if (!store) {
      return res
        .status(403)
        .json({ error: "Not authorized to update this order" });
    }

    order.status = status;
    await order.save();

    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

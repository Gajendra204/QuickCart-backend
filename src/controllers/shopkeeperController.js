const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const mongoose = require("mongoose");
const Shopkeeper = require("../models/Shopkeeper");
const Store = require("../models/Store");
const Item = require("../models/Item");
const Category = require("../models/Category.js");
const fs = require("fs");
const path = require("path");
const bwipjs = require("bwip-js");
const Order = require("../models/Order"); // Ensure correct path
const { sendPasswordResetEmail } = require("../services/emailService");

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

// Forgot Password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const shopkeeper = await Shopkeeper.findOne({ email });

    if (!shopkeeper) {
      return res
        .status(404)
        .json({ error: "No account found with this email" });
    }

    // Generate a password reset token
    const resetToken = jwt.sign(
      { id: shopkeeper._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Save the reset token and its expiry to the shopkeeper document
    shopkeeper.resetPasswordToken = resetToken;
    shopkeeper.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await shopkeeper.save();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // Send password reset email
    await sendPasswordResetEmail(email, resetUrl);

    res.json({
      message: "Password reset link has been sent to your email",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(400).json({ error: "Password reset request failed" });
  }
};

// Verify Reset Token
exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    const shopkeeper = await Shopkeeper.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!shopkeeper) {
      return res
        .status(400)
        .json({ error: "Password reset token is invalid or has expired" });
    }

    res.json({ message: "Token is valid", email: shopkeeper.email });
  } catch (err) {
    res.status(400).json({ error: "Token verification failed" });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const shopkeeper = await Shopkeeper.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!shopkeeper) {
      return res
        .status(400)
        .json({ error: "Password reset token is invalid or has expired" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password and clear reset token fields
    shopkeeper.password = hashedPassword;
    shopkeeper.resetPasswordToken = undefined;
    shopkeeper.resetPasswordExpires = undefined;
    await shopkeeper.save();

    res.json({ message: "Password has been reset successfully" });
  } catch (err) {
    res.status(400).json({ error: "Password reset failed" });
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
        const populatedStore = await Store.findById(store._id).populate(
          "shopkeeper"
        );
        res.status(201).json(populatedStore);
        // res.status(201).json(store);
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
    const populatedCategory = await Category.findById(category._id).populate(
      "store"
    );
    res.status(201).json(populatedCategory);
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
    const populatedItem = await Item.findById(item._id)
      .populate("category")
      .populate("store");
    res.status(201).json(populatedItem);
    // res.status(400).json({ error: err.message });
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

exports.getStores = async (req, res) => {
  try {
    const stores = await Store.find({ shopkeeper: req.shopkeeper._id });
    res.json(stores);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get single store by ID
exports.getStoreById = async (req, res) => {
  try {
    const store = await Store.findOne({
      _id: req.params.id,
      shopkeeper: req.shopkeeper._id,
    });
    if (!store) {
      return res.status(404).json({ error: "Store not found" });
    }
    res.json(store);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all categories
exports.getCategories = async (req, res) => {
  try {
    // First get all stores belonging to this shopkeeper
    const stores = await Store.find({ shopkeeper: req.shopkeeper._id });
    const storeIds = stores.map((store) => store._id);

    // Then get all categories for these stores
    const categories = await Category.find({ store: { $in: storeIds } });
    res.json(categories);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get single category by ID
exports.getCategoryById = async (req, res) => {
  try {
    // First verify the category belongs to a store owned by this shopkeeper
    const category = await Category.findById(req.params.id).populate("store");
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    const store = await Store.findOne({
      _id: category.store._id,
      shopkeeper: req.shopkeeper._id,
    });

    if (!store) {
      return res
        .status(403)
        .json({ error: "Not authorized to access this category" });
    }

    res.json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get categories by store
exports.getCategoriesByStore = async (req, res) => {
  try {
    // First verify the store belongs to this shopkeeper
    const store = await Store.findOne({
      _id: req.params.storeId,
      shopkeeper: req.shopkeeper._id,
    });

    if (!store) {
      return res
        .status(403)
        .json({ error: "Not authorized to access this store" });
    }

    const categories = await Category.find({ store: store._id });
    res.json(categories);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all items
exports.getItems = async (req, res) => {
  try {
    // First get all stores belonging to this shopkeeper
    const stores = await Store.find({ shopkeeper: req.shopkeeper._id });
    const storeIds = stores.map((store) => store._id);

    // Then get all items for these stores
    const items = await Item.find({ store: { $in: storeIds } })
      .populate("category")
      .populate("store");
    res.json(items);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get single item by ID
exports.getItemById = async (req, res) => {
  try {
    // First verify the item belongs to a store owned by this shopkeeper
    const item = await Item.findById(req.params.id)
      .populate("category")
      .populate("store");

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    const store = await Store.findOne({
      _id: item.store._id,
      shopkeeper: req.shopkeeper._id,
    });

    if (!store) {
      return res
        .status(403)
        .json({ error: "Not authorized to access this item" });
    }

    res.json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get items by category
exports.getItemsByCategory = async (req, res) => {
  try {
    // First verify the category belongs to a store owned by this shopkeeper
    const category = await Category.findById(req.params.categoryId).populate(
      "store"
    );
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    const store = await Store.findOne({
      _id: category.store._id,
      shopkeeper: req.shopkeeper._id,
    });

    if (!store) {
      return res
        .status(403)
        .json({ error: "Not authorized to access this category" });
    }

    const items = await Item.find({ category: category._id })
      .populate("category")
      .populate("store");
    res.json(items);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update Store
exports.updateStore = async (req, res) => {
  try {
    const { name, address } = req.body;

    // First verify the store belongs to this shopkeeper
    const store = await Store.findOne({
      _id: req.params.id,
      shopkeeper: req.shopkeeper._id,
    });

    if (!store) {
      return res
        .status(404)
        .json({ error: "Store not found or not authorized" });
    }

    const updatedStore = await Store.findByIdAndUpdate(
      req.params.id,
      { name, address },
      { new: true }
    ).populate("shopkeeper");

    if (!updatedStore) {
      return res.status(404).json({ error: "Store not found" });
    }

    res.json(updatedStore);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update Item
exports.updateItem = async (req, res) => {
  try {
    const { name, description, mrp, discount, category, store } = req.body;

    // First verify the item belongs to a store owned by this shopkeeper
    const existingItem = await Item.findById(req.params.id);
    if (!existingItem) {
      return res.status(404).json({ error: "Item not found" });
    }

    const storeCheck = await Store.findOne({
      _id: existingItem.store,
      shopkeeper: req.shopkeeper._id,
    });

    if (!storeCheck) {
      return res
        .status(403)
        .json({ error: "Not authorized to update this item" });
    }

    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      { name, description, mrp, discount, category, store },
      { new: true }
    )
      .populate("category")
      .populate("store");

    if (!updatedItem) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json(updatedItem);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete Item
exports.deleteItem = async (req, res) => {
  try {
    const item = await Item.findOneAndDelete({
      _id: req.params.id,
      store: {
        $in: await Store.find({ shopkeeper: req.shopkeeper._id }).distinct(
          "_id"
        ),
      },
    });

    if (!item) {
      return res
        .status(404)
        .json({ error: "Item not found or not authorized" });
    }

    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update Category
exports.updateCategory = async (req, res) => {
  try {
    const { name, store } = req.body;

    // First verify the category belongs to a store owned by this shopkeeper
    const existingCategory = await Category.findById(req.params.id);
    if (!existingCategory) {
      return res.status(404).json({ error: "Category not found" });
    }

    const storeCheck = await Store.findOne({
      _id: existingCategory.store,
      shopkeeper: req.shopkeeper._id,
    });

    if (!storeCheck) {
      return res
        .status(403)
        .json({ error: "Not authorized to update this category" });
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      { name, store },
      { new: true }
    ).populate("store");

    if (!updatedCategory) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json(updatedCategory);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete Category
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findOneAndDelete({
      _id: req.params.id,
      store: {
        $in: await Store.find({ shopkeeper: req.shopkeeper._id }).distinct(
          "_id"
        ),
      },
    });

    if (!category) {
      return res
        .status(404)
        .json({ error: "Category not found or not authorized" });
    }

    // Delete associated items
    await Item.deleteMany({ category: req.params.id });

    res.json({ message: "Category and its items deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete Store
exports.deleteStore = async (req, res) => {
  try {
    const store = await Store.findOneAndDelete({
      _id: req.params.id,
      shopkeeper: req.shopkeeper._id,
    });

    if (!store) {
      return res
        .status(404)
        .json({ error: "Store not found or not authorized" });
    }

    // Delete associated categories and items
    await Category.deleteMany({ store: req.params.id });
    await Item.deleteMany({ store: req.params.id });

    res.json({ message: "Store and its contents deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

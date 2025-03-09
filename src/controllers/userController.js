const mongoose = require("mongoose");
const Store = require("../models/Store");

const Item = require("../models/Item");
const Order = require("../models/Order");
const Category = require("../models/category");

// Get Store by Barcode
exports.getStoreByBarcode = async (req, res) => {
  try {
    const store = await Store.findOne({
      _id: new mongoose.Types.ObjectId(req.params.barcode),
    });
    if (!store) {
      return res.status(404).json({ error: "Store not found" });
    }
    console.log("Store ID Type:", typeof store._id);
    console.log("story id::: ", store._id);
    // Fetch categories and items for the store
    const categories = await Category.find({
      store: store._id,
    });
    const items = await Item.find({
      store: store._id,
    });
    
    res.json({
      store,
      categories,
      items,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get Categories by Store
exports.getCategoriesByStore = async (req, res) => {
  try {
    const categories = await category.find({ store: req.params.storeId });
    res.json(categories);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get Items by Category
exports.getItemsByCategory = async (req, res) => {
  try {
    const items = await Item.find({ category: req.params.categoryId });
    res.json(items);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Create Order
exports.createOrder = async (req, res) => {
  try {
    const { items, mobile, storeId } = req.body;

    // Calculate total
    const itemIds = items.map((i) => i.item);
    const dbItems = await Item.find({ _id: { $in: itemIds } });

    let total = 0;
    items.forEach((orderItem) => {
      const dbItem = dbItems.find((i) => i._id.equals(orderItem.item));
      total += (dbItem.mrp - (dbItem.discount || 0)) * orderItem.quantity;
    });

    const order = new Order({
      items,
      total,
      mobile,
      store: storeId,
    });

    await order.save();
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

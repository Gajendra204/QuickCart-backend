const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const mongoose = require('mongoose');
const Shopkeeper = require('../models/Shopkeeper');
const Store = require('../models/Store');
const Item = require('../models/Item');
const Category = require('../models/category');
const fs = require('fs');
const path = require('path');
const bwipjs = require('bwip-js');

// Image upload setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
exports.upload = multer({ storage });

// Shopkeeper Registration
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('aajaya ree')
    const shopkeeper = new Shopkeeper({ name, email, password: hashedPassword });
    await shopkeeper.save();
    res.status(201).json({ message: 'Shopkeeper created' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Shopkeeper Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const shopkeeper = await Shopkeeper.findOne({ email });
    if (!shopkeeper || !await bcrypt.compare(password, shopkeeper.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
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
    const barcodeImagePath = path.join(__dirname, `../public/barcodes/${store._id}.png`);

    // Ensure the "public/barcodes" directory exists
    if (!fs.existsSync(path.join(__dirname, '../public/barcodes'))) {
      fs.mkdirSync(path.join(__dirname, '../public/barcodes'), { recursive: true });
    }

    bwipjs.toBuffer(
      {
        bcid: 'code128', // Barcode type
        text: barcodeData, // Data to encode
        scale: 3, // Scaling factor
        height: 10, // Barcode height
        includetext: true, // Include human-readable text
        textxalign: 'center', // Center-align text
      },
      async (err, png) => {
        if (err) {
          console.error('Error generating barcode:', err);
          return res.status(500).json({ error: 'Failed to generate barcode' });
        }

        // Save the barcode image to the public folder
        fs.writeFileSync(barcodeImagePath, png);

        // Update the store with the barcode image URL
        store.barcodeImage = `/barcodes/${store._id}.png`;
        await store.save();
        res.status(201).json(store);
      });
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
      image: req.file ? req.file.path : null
    });
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
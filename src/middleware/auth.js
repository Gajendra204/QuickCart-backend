const jwt = require('jsonwebtoken');
const Shopkeeper = require('../models/Shopkeeper');

module.exports = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const shopkeeper = await Shopkeeper.findById(decoded.id);
    if (!shopkeeper) throw new Error();
    req.shopkeeper = shopkeeper;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Authentication failed' });
  }
}; 
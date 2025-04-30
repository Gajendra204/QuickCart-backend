const jwt = require("jsonwebtoken");
const Shopkeeper = require("../models/Shopkeeper");

module.exports = async (req, res, next) => {
  try {
    console.log("Auth middleware - Request path:", req.path);
    console.log("Auth middleware - Request method:", req.method);
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ error: "No authentication token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const shopkeeper = await Shopkeeper.findById(decoded.id);

    if (!shopkeeper) {
      return res.status(401).json({ error: "Shopkeeper not found" });
    }

    req.shopkeeper = shopkeeper;
    next();
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    res.status(401).json({ error: "Authentication failed" });
  }
};

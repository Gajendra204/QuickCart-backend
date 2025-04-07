const express = require("express");
const router = express.Router();
const {
  register,
  login,
  createStore,
  createCategory,
  createItem,
  upload,
  getShopkeeperOrders,
  updateOrderStatus,
} = require("../controllers/shopkeeperController");
const auth = require("../middleware/auth");

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes
router.use(auth);
router.post("/stores", createStore);
router.post("/categories", createCategory);
router.post("/items", upload.single("image"), createItem);
router.get("/orders", getShopkeeperOrders);
router.patch("/orders/:orderId", updateOrderStatus);

module.exports = router;

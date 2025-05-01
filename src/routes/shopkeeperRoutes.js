const express = require("express");
const router = express.Router();
const {
  register,
  login,
  forgotPassword,
  verifyResetToken,
  resetPassword,
  createStore,
  updateStore,
  deleteStore,
  createCategory,
  updateCategory,
  deleteCategory,
  createItem,
  updateItem,
  deleteItem,
  upload,
  getShopkeeperOrders,
  updateOrderStatus,
  getStores,
  getStoreById,
  getCategories,
  getCategoryById,
  getCategoriesByStore,
  getItems,
  getItemById,
  getItemsByCategory,
} = require("../controllers/shopkeeperController");
const auth = require("../middleware/auth");

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.get("/reset-password/:token", verifyResetToken);
router.post("/reset-password/:token", resetPassword);

// Protected routes
router.use(auth);
router.post("/stores", createStore);
router.get("/stores", getStores);
router.get("/stores/:id", getStoreById);
router.put("/stores/:id", updateStore);
router.delete("/stores/:id", deleteStore);
router.post("/categories", createCategory);
router.get("/categories", getCategories);
router.get("/categories/:id", getCategoryById);
router.get("/stores/:storeId/categories", getCategoriesByStore);
router.put("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);
router.post("/items", upload.single("image"), createItem);
router.get("/items", getItems);
router.get("/items/:id", getItemById);
router.get("/categories/:categoryId/items", getItemsByCategory);
router.put("/items/:id", updateItem);
router.delete("/items/:id", deleteItem);
router.get("/orders", getShopkeeperOrders);
router.put("/orders/:orderId/status", updateOrderStatus);

module.exports = router;

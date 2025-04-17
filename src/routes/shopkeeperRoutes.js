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
  getStores,
  getStoreById,
  getCategories,
  getCategoryById,
  getCategoriesByStore,
  getItems,
  getItemById,
  getItemsByCategory,
  // deleteStore,  // Import the delete methods
  // deleteCategory,
  // deleteItem
} = require("../controllers/shopkeeperController");
const auth = require("../middleware/auth");

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes
router.use(auth);
router.post("/stores", createStore);
router.get('/stores', getStores);
router.get('/stores/:id', getStoreById);
// router.delete('/stores/:id', deleteStore);  // Add the delete route
router.post("/categories", createCategory);
// router.delete('/categories/:id', deleteCategory);  // Add the delete route
router.post("/items", upload.single("image"), createItem);
// router.delete('/items/:id', deleteItem);  // Add the delete route
router.get("/orders", getShopkeeperOrders);
router.patch("/orders/:orderId", updateOrderStatus);
router.get('/categories', getCategories); 
router.get('/categories/:id', getCategoryById);
router.get('/stores/:storeId/categories', getCategoriesByStore);
router.get('/items', getItems);
router.get('/items/:id', getItemById);
router.get('/categories/:categoryId/items', getItemsByCategory);


module.exports = router;
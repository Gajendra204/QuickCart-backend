const express = require("express");
const router = express.Router();
const {
  getStoreByBarcode,
  getCategoriesByStore,
  getItemsByCategory,
  createOrder,
  getOrdersByMobile,
} = require("../controllers/userController");

// Get store by barcode
router.get("/stores/:barcode", getStoreByBarcode); // barcode is storecode

router.get("/orders/:mobile", getOrdersByMobile);
router.get("/categories/:storeId", getCategoriesByStore);
router.get("/items/:categoryId", getItemsByCategory);
router.post("/orders", createOrder);

module.exports = router;

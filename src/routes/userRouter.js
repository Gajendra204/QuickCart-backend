const express = require('express');
const router = express.Router();
const { 
  getStoreByBarcode,
  getCategoriesByStore,
  getItemsByCategory,
  createOrder
} = require('../controllers/userController');

// Get store by barcode
router.get('/stores/:barcode', getStoreByBarcode);// barcode is storecode


router.get('/categories/:storeId', getCategoriesByStore);
router.get('/items/:categoryId', getItemsByCategory);
router.post('/orders', createOrder);

module.exports = router;
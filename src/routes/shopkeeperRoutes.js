const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  createStore, 
  createCategory, 
  createItem, 
  upload 
} = require('../controllers/shopkeeperController');
const auth = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.use(auth);
router.post('/stores', createStore);
router.post('/categories', createCategory);
router.post('/items', upload.single('image'), createItem);

module.exports = router;
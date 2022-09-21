const express = require('express');

const adminController = require('../controllers/admin');
const adminValidator = require('../validators/admin');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

// /admin/add-product => GET
router.get('/add-product', isAuth, adminController.getAddProduct);

router.get('/products', isAuth, adminController.getProducts);

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

router.post(
  '/edit-product',
  isAuth,
  adminValidator.postEditProduct,
  adminController.postEditProduct
);

router.delete('/product/:productId', isAuth, adminController.deleteProduct);

router.post(
  '/add-product',
  isAuth,
  adminValidator.postAddProduct,
  adminController.postAddProduct
);

module.exports = router;

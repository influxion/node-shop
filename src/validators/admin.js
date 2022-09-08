const { body } = require('express-validator');

exports.postAddProduct = [
  body('title').isString().isLength({ min: 3 }).trim(),
  body('imageUrl').isURL(),
  body('price').isFloat().isDecimal({ decimal_digits: '2,2' }),
  body('description').isLength({ min: 3, max: 255 }).trim(),
];

exports.postEditProduct = [
  body('title').isString().isLength({ min: 3 }).trim(),
  body('imageUrl').isURL(),
  body('price').isFloat().isDecimal({ decimal_digits: '2,2' }),
  body('description').isLength({ min: 3, max: 255 }).trim(),
];

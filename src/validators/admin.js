const { body } = require('express-validator');

exports.postAddProduct = [
  body('title', 'Title must contain at least 3 characters.')
    .isString()
    .isLength({ min: 3 })
    .trim(),
  body('price', 'Price must be formatted using 2 decimal places.')
    .isFloat()
    .isDecimal({ force_decimal: true, decimal_digits: '2,' }),
  body(
    'description',
    'Description must contain at least 3 characters and no more than 255.'
  )
    .isLength({ min: 3, max: 255 })
    .trim(),
];

exports.postEditProduct = [
  body('title', 'Title must contain at least 3 characters.')
    .isString()
    .isLength({ min: 3 })
    .trim(),
  body('price', 'Price must be formatted using 2 decimal places.')
    .isFloat()
    .isDecimal({ force_decimal: true, decimal_digits: '2,' }),
  body(
    'description',
    'Description must contain at least 3 characters and no more than 255.'
  )
    .isLength({ min: 3, max: 255 })
    .trim(),
];

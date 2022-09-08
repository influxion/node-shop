const { body } = require('express-validator');

const User = require('../models/user');

exports.postLogin = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email.')
    .normalizeEmail(),
  body('password', 'Password must be valid.')
    .isLength({ min: 5 })
    .isAlphanumeric()
    .trim(),
];

exports.postSignup = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email.')
    .custom(async (value, { req }) => {
      try {
        const userDoc = await User.findOne({ email: value });
        if (userDoc) {
          throw new Error('Email exists already, please pick a different one.');
        }
        return true;
      } catch (error) {
        throw error;
      }
    })
    .normalizeEmail(),
  body(
    'password',
    'Please enter a password with only numbers and text and at least 5 characters.'
  )
    .isLength({ min: 5 })
    .isAlphanumeric()
    .trim(),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords have to match!');
      }
      return true;
    })
    .trim(),
];

exports.postReset = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email.')
    .normalizeEmail(),
];

exports.postNewPassword = [
  body(
    'password',
    'Please enter a password with only numbers and text and at least 5 characters.'
  )
    .isLength({ min: 5 })
    .isAlphanumeric()
    .trim(),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords have to match!');
      }
      return true;
    })
    .trim(),
];

const express = require('express');
const { check, body } = require('express-validator');

const authController = require('../controllers/auth');
const User = require('../models/user');

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please enter a valid email.'),
    body('password', 'Password must be valid.')
      .isLength({ min: 5 })
      .isAlphanumeric(),
  ],
  authController.postLogin
);

router.post(
  '/signup',
  [
    check('email')
      .isEmail()
      .withMessage('Please enter a valid email.')
      .custom(async (value, { req }) => {
        try {
          const userDoc = await User.findOne({ email: value });
          if (userDoc) {
            throw new Error(
              'Email exists already, please pick a different one.'
            );
          }
          return true;
        } catch (error) {
          throw error;
        }
      }),
    body(
      'password',
      'Please enter a password with only numbers and text and at least 5 characters.'
    )
      .isLength({ min: 5 })
      .isAlphanumeric(),
    body('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords have to match!');
      }
      return true;
    }),
  ],
  authController.postSignup
);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post(
  '/reset',
  check('email').isEmail().withMessage('Please enter a valid email.'),
  authController.postReset
);

router.get('/reset/:token', authController.getNewPassword);

router.post(
  '/new-password',
  [
    body(
      'password',
      'Please enter a password with only numbers and text and at least 5 characters.'
    )
      .isLength({ min: 5 })
      .isAlphanumeric(),
    body('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords have to match!');
      }
      return true;
    }),
  ],
  authController.postNewPassword
);

module.exports = router;

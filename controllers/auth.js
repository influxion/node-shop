const crypto = require('crypto');

const bcrypt = require('bcryptjs');
const sgMail = require('@sendgrid/mail');

const User = require('../models/user');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.getLogin = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/login', {
    path: '/login',
    docTitle: 'Login',
    errorMessage: message,
  });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/signup', {
    path: '/login',
    docTitle: 'Login',
    errorMessage: message,
  });
};

exports.postSignup = async (req, res, next) => {
  try {
    const { email, password, confirmPassword } = req.body;

    const userDoc = await User.findOne({ email });

    if (userDoc) {
      req.flash('error', 'Email exists already, please pick a different one.');
      res.redirect('/signup');
      return;
    }

    if (password !== confirmPassword) {
      req.flash('error', 'Passwords do not match!');
      res.redirect('/signup');
      return;
    }

    const hashedPass = await bcrypt.hash(password, 12);

    const user = new User({
      email,
      password: hashedPass,
      cart: { item: [] },
    });
    await user.save();

    res.redirect('/login');

    await sgMail.send({
      to: email,
      from: process.env.SHOP_EMAIL,
      subject: 'Signup succeeded!',
      html: '<h1>You successfully signed up!</h1>',
    });
  } catch (error) {
    console.log(error);
  }
};

exports.postLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      req.flash('error', 'Invalid email or password.');
      res.redirect('/login');
      return;
    }

    const passMatch = await bcrypt.compare(password, user.password);

    if (!passMatch) {
      console.log('Wrong password!');
      req.flash('error', 'Invalid email or password.');
      res.redirect('/login');
      return;
    }

    req.session.isLoggedIn = true;
    req.session.user = user;
    req.session.save((err) => {
      if (err) console.log(err);
      res.redirect('/');
      return;
    });
  } catch (error) {
    console.log(error);
    console.log('ERROR unable to login!');
    res.redirect('/login');
  }
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    if (err) console.log(err);
    res.redirect('/');
  });
};

exports.getReset = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/reset', {
    path: '/reset',
    docTitle: 'Reset Password',
    errorMessage: message,
  });
};

exports.postReset = async (req, res, next) => {
  try {
    let token;
    crypto.randomBytes(32, (err, buffer) => {
      if (err) {
        console.log(err);
        return res.redirect('/reset');
      }
      token = buffer.toString('hex');
    });

    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      req.flash('error', 'No account with that email found.');
      res.redirect('/reset');
      return;
    }

    user.resetToken = token;
    user.resetTokenExpiration = Date.now() + 3600000;
    await user.save();

    res.redirect('/');
    await sgMail.send({
      to: req.body.email,
      from: process.env.SHOP_EMAIL,
      subject: 'Password reset',
      html: `
          <p>You requested a password reset</p>
          <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to reset your password.</p>
        `,
    });
  } catch (error) {
    console.log(error);
  }
};

exports.getNewPassword = async (req, res, next) => {
  try {
    const token = req.params.token;
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() },
    });

    if (!user) {
      res.redirect('/reset');
      return;
    }

    let message = req.flash('error');
    if (message.length > 0) {
      message = message[0];
    } else {
      message = null;
    }

    res.render('auth/new-password', {
      path: '/new-password',
      docTitle: 'New Password',
      errorMessage: message,
      userId: user._id.toString(),
      passwordToken: token,
    });
  } catch (error) {
    console.log(error);
  }
};

exports.postNewPassword = async (req, res, next) => {
  try {
    const {
      password: newPassword,
      confirmPassword: newConfirmPassword,
      userId,
      passwordToken,
    } = req.body;

    if (newPassword !== newConfirmPassword) {
      req.flash('error', 'Passwords do not match!');
      res.redirect(`/reset/${passwordToken}`);
      return;
    }

    const user = await User.findOne({
      resetToken: passwordToken,
      resetTokenExpiration: { $gt: Date.now() },
      _id: userId,
    });

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    const resetUser = user;

    resetUser.password = hashedPassword;
    resetUser.resetToken = undefined;
    resetUser.resetTokenExpiration = undefined;
    await resetUser.save();

    res.redirect('/login');
  } catch (error) {
    console.log(error);
  }
};

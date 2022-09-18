const mongoose = require('mongoose');

const { validationResult } = require('express-validator');

const Product = require('../models/product');

exports.postAddProduct = async (req, res, next) => {
  const { title, imageUrl, description, price } = req.body;
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).render('admin/edit-product', {
        docTitle: 'Add Product',
        path: '/admin/add-product',
        editing: false,
        hasError: true,
        product: {
          title,
          imageUrl,
          price,
          description,
        },
        errorMessage: errors.array()[0].msg,
        validationErrors: errors.array(),
      });
    }
    const product = new Product({
      title,
      price,
      description,
      imageUrl,
      userId: req.session.user._id,
    });
    await product.save();
    console.log('Created product!');
    res.redirect('/admin/products');
  } catch (err) {
    // return res.status(500).render('admin/edit-product', {
    //   docTitle: 'Add Product',
    //   path: '/admin/add-product',
    //   editing: false,
    //   hasError: true,
    //   product: {
    //     title,
    //     imageUrl,
    //     price,
    //     description,
    //   },
    //   errorMessage: 'Database operation failed, please try again!',
    //   validationErrors: [],
    // });

    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.getAddProduct = (req, res, next) => {
  if (!req.session.isLoggedIn) {
    res.redirect('/login');
    return;
  }
  res.render('admin/edit-product', {
    docTitle: 'Add Product',
    path: '/admin/add-product',
    hasError: false,
    editing: false,
    errorMessage: null,
    validationErrors: [],
  });
};

exports.getEditProduct = async (req, res, next) => {
  try {
    const editMode = req.query.edit;
    if (!editMode) {
      return res.redirect('/');
    }

    const prodId = req.params.productId;
    const product = await Product.findById(prodId);
    if (!product) {
      res.redirect('/');
    }
    res.render('admin/edit-product', {
      docTitle: 'Edit Product',
      path: '/admin/products',
      editing: editMode,
      product: product,
      hasError: false,
      errorMessage: null,
      validationErrors: [],
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.postEditProduct = async (req, res, next) => {
  try {
    const { title, imageUrl, description, price, productId } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).render('admin/edit-product', {
        docTitle: 'Add Product',
        path: '/admin/add-product',
        editing: true,
        hasError: true,
        product: {
          title,
          imageUrl,
          price,
          description,
          _id: productId,
        },
        errorMessage: errors.array()[0].msg,
        validationErrors: errors.array(),
      });
    }

    const product = await Product.findById(productId);
    if (product.userId.toString() !== req.session.user._id.toString()) {
      res.redirect('/');
      return;
    }
    product.title = title;
    product.description = description;
    product.price = price;
    product.imageUrl = imageUrl;
    await product.save();
    console.log('Updated product!');
    res.redirect('/admin/products');
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.postDeleteProduct = async (req, res, next) => {
  try {
    const prodId = req.body.productId;
    await Product.deleteOne({ _id: prodId, userId: req.session.user._id });
    console.log('Destroyed!');
    res.redirect('/admin/products');
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.getProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ userId: req.session.user._id });
    //* .select('title price -_id') You are able to select which fields you want to get back from the database
    //* .populate('userId', 'name'); You are able to populate fields using the id of another piece of data, and if you want to narrow down the amount of fields you are populating you can just simply put the names of the fields that you want as other args
    res.render('admin/products', {
      prods: products,
      docTitle: 'Admin Products',
      path: '/admin/products',
      hasError: false,
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

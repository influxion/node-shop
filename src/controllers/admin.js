const fileHelper = require('../util/file');

const { validationResult } = require('express-validator');

const Product = require('../models/product');

exports.postAddProduct = async (req, res, next) => {
  const { title, description, price } = req.body;
  const image = req.file;
  const imageUrl = image.path;
  try {
    const errors = validationResult(req);
    if (!image) {
      return res.status(422).render('admin/edit-product', {
        docTitle: 'Add Product',
        path: '/admin/add-product',
        editing: false,
        hasError: true,
        product: {
          title,
          price,
          description,
        },
        errorMessage: 'There is no attached file or it is not of type image.',
        validationErrors: [...errors.array(), { param: 'image' }],
      });
    }
    if (!errors.isEmpty()) {
      fileHelper.deleteFile(imageUrl);
      return res.status(422).render('admin/edit-product', {
        docTitle: 'Add Product',
        path: '/admin/add-product',
        editing: false,
        hasError: true,
        product: {
          title,
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
    const { title, description, price, productId } = req.body;
    const image = req.file;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).render('admin/edit-product', {
        docTitle: 'Add Product',
        path: '/admin/add-product',
        editing: true,
        hasError: true,
        product: {
          title,
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
    if (image) {
      fileHelper.deleteFile(product.imageUrl);
      product.imageUrl = image.path;
    }
    await product.save();
    console.log('Updated product!');
    res.redirect('/admin/products');
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const prodId = req.params.productId;
    const product = await Product.findById(prodId);
    if (!product) {
      throw new Error('Product not found');
    }
    fileHelper.deleteFile(product.imageUrl);
    await Product.deleteOne({ _id: prodId, userId: req.session.user._id });
    console.log('Destroyed!');
    res.status(200).json({ message: 'Success!' });
  } catch (err) {
    res.status(500).json({ message: 'Deleting product failed!' });
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

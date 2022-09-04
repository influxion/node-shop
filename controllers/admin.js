const Product = require('../models/product');

exports.postAddProduct = async (req, res, next) => {
  try {
    const { title, imageUrl, description, price } = req.body;
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
    console.log(err);
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
    editing: false,
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
    });
  } catch (err) {
    console.log(err);
    res.redirect('/admin/products');
  }
};

exports.postEditProduct = async (req, res, next) => {
  try {
    const { title, imageUrl, description, price, productId } = req.body;
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
    console.log(err);
  }
};

exports.postDeleteProduct = async (req, res, next) => {
  try {
    const prodId = req.body.productId;
    await Product.deleteOne({ _id: prodId, userId: req.session.user._id });
    console.log('Destroyed!');
    res.redirect('/admin/products');
  } catch (err) {
    console.log(err);
    console.log('ERROR unable to delete product!');
    res.redirect('/admin/products');
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
    });
  } catch (err) {
    console.log(err);
  }
};

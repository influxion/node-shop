const Product = require('../models/product');
const Order = require('../models/order');
const User = require('../models/user');

exports.getProducts = async (req, res, next) => {
  try {
    const products = await Product.find();
    res.render('shop/index', {
      prods: products,
      docTitle: 'Shop',
      path: '/products',
    });
  } catch (err) {
    console.log(err);
  }
};

exports.getProduct = async (req, res, next) => {
  try {
    const prodId = req.params.productId;
    const product = await Product.findById(prodId);
    res.render('shop/product-detail', {
      product: product,
      docTitle: product.title,
      path: '/products',
    });
  } catch (err) {
    console.log(err);
    res.redirect('/products');
  }
};

exports.getIndex = async (req, res, next) => {
  try {
    const products = await Product.find();
    res.render('shop/index', {
      prods: products,
      docTitle: 'Shop',
      path: '/',
    });
  } catch (err) {
    console.log(err);
  }
};

exports.getCart = (req, res, next) => {
  User.findById(req.session.user._id)
    .populate('cart.items.productId')
    .then((user) => {
      const products = user.cart.items;
      console.log(products);
      res.render('shop/cart', {
        docTitle: 'Your Cart',
        path: '/cart',
        products: products,
      });
    })
    .catch((err) => console.log(err));
};

exports.postCart = async (req, res, next) => {
  try {
    const prodId = req.body.productId;
    const product = await Product.findById(prodId);

    const user = await User.findById(req.session.user._id);
    await user.addToCart(product);
    res.redirect('/cart');
  } catch (err) {
    console.log(err);
  }
};

exports.postCartDeleteItem = async (req, res, next) => {
  try {
    const prodId = req.body.productId;
    const user = await User.findById(req.session.user._id);
    await user.removeFromCart(prodId);

    console.log('Product deleted from cart!');
    await res.redirect('/cart');
  } catch (error) {
    console.log(error);
  }
};

exports.postOrder = (req, res, next) => {
  User.findById(req.session.user._id)
    .populate('cart.items.productId')
    .then((user) => {
      const products = user.cart.items.map((i) => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.session.user.email,
          userId: req.session.user,
        },
        products,
      });
      return order.save();
    })
    .then(() => {
      return User.findById(req.session.user._id);
    })
    .then((user) => {
      return user.clearCart();
    })
    .then(() => {
      res.redirect('/orders');
    })
    .catch((err) => console.log(err));
};

exports.getOrders = (req, res, next) => {
  Order.find({ 'user.userId': req.session.user._id })
    .then((orders) => {
      res.render('shop/orders', {
        docTitle: 'Your Orders',
        path: '/orders',
        orders,
      });
    })
    .catch((err) => console.log(err));
};

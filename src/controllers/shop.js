const fs = require('fs');
const path = require('path');

const stripe = require('stripe')(process.env.STRIPE_API_KEY);
const PDFDocument = require('pdfkit');

const Product = require('../models/product');
const Order = require('../models/order');
const User = require('../models/user');

const ITEMS_PER_PAGE = 2;

exports.getProducts = async (req, res, next) => {
  const page = +req.query.page || 1;
  try {
    const totalItems = await Product.find().countDocuments();
    const products = await Product.find()
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);
    res.render('shop/product-list', {
      prods: products,
      docTitle: 'Products',
      path: '/products',
      currentPage: page,
      hasNextPage: ITEMS_PER_PAGE * page < totalItems,
      hasPreviousPage: page > 1,
      nextPage: page + 1,
      previousPage: page - 1,
      lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
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
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.getIndex = async (req, res, next) => {
  const page = +req.query.page || 1;
  try {
    const totalItems = await Product.find().countDocuments();
    const products = await Product.find()
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);
    res.render('shop/index', {
      prods: products,
      docTitle: 'Shop',
      path: '/',
      currentPage: page,
      hasNextPage: ITEMS_PER_PAGE * page < totalItems,
      hasPreviousPage: page > 1,
      nextPage: page + 1,
      previousPage: page - 1,
      lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.getCart = async (req, res, next) => {
  try {
    const user = await User.findById(req.session.user._id).populate(
      'cart.items.productId'
    );
    const products = user.cart.items;
    res.render('shop/cart', {
      docTitle: 'Your Cart',
      path: '/cart',
      products: products,
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.postCart = async (req, res, next) => {
  try {
    const prodId = req.body.productId;
    const product = await Product.findById(prodId);

    const user = await User.findById(req.session.user._id);
    await user.addToCart(product);
    res.redirect('/cart');
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.postCartDeleteItem = async (req, res, next) => {
  try {
    const prodId = req.body.productId;
    const user = await User.findById(req.session.user._id);
    await user.removeFromCart(prodId);

    console.log('Product deleted from cart!');
    await res.redirect('/cart');
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.getCheckout = async (req, res, next) => {
  try {
    const user = await User.findById(req.session.user._id).populate(
      'cart.items.productId'
    );
    user.checkoutSession = undefined;
    const products = user.cart.items;
    const total = products.reduce((acc, curr) => {
      acc += curr.quantity * curr.productId.price;
      return acc;
    }, 0);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: products.map((p) => {
        return {
          name: p.productId.title,
          description: p.productId.description,
          amount: p.productId.price * 100,
          currency: 'usd',
          quantity: p.quantity,
        };
      }),
      success_url: `${req.protocol}://${req.get('host')}/checkout/success`,
      cancel_url: `${req.protocol}://${req.get('host')}/checkout/cancel`,
    });
    user.checkoutSession = session.id;
    await user.save();
    res.render('shop/checkout', {
      docTitle: 'Checkout',
      path: '/cart',
      products: products,
      totalSum: total,
      sessionId: session.id,
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.getCheckoutSuccess = async (req, res, next) => {
  try {
    const user = await User.findById(req.session.user._id).populate(
      'cart.items.productId'
    );
    const session = await stripe.checkout.sessions.retrieve(
      user.checkoutSession
    );
    if (session.payment_status === 'unpaid') {
      return res.redirect('/checkout');
    } else if (session.payment_status === 'paid') {
      const products = user.cart.items.map((i) => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.session.user.email,
          userId: req.session.user,
          checkoutSession: user.checkoutSession,
        },
        products,
      });
      await order.save();
      user.checkoutSession = undefined;
      await user.clearCart();
      res.redirect('/orders');
    } else {
      throw new Error('Unable to retrieve payment status!');
    }
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.postOrder = async (req, res, next) => {
  try {
    const user = await User.findById(req.session.user._id).populate(
      'cart.items.productId'
    );
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
    await order.save();
    await user.clearCart();
    res.redirect('/orders');
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ 'user.userId': req.session.user._id });
    res.render('shop/orders', {
      docTitle: 'Your Orders',
      path: '/orders',
      orders,
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.getInvoice = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.findById(orderId);

    if (!order) {
      throw new Error('No order found.');
    }

    if (order.user.userId.toString() !== req.session.user._id.toString()) {
      throw new Error('Unauthorized!');
    }

    const invoiceName = 'invoice-' + orderId + '.pdf';
    invoicePath = path.join(__dirname, `../../data/invoices/${invoiceName}`);

    const pdfDoc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="' + invoiceName + '"'
    );
    pdfDoc.pipe(fs.createWriteStream(invoicePath));
    pdfDoc.pipe(res);
    pdfDoc.fontSize(26).text('Invoice');
    pdfDoc.fontSize(14).text('-----------------------------');
    let totalPrice = 0;
    order.products.forEach((prod) => {
      totalPrice += prod.quantity * prod.product.price;
      pdfDoc.text(
        `${prod.product.title} - ${prod.quantity} x $${prod.product.price}`
      );
    });
    pdfDoc.text('-----------------------------');
    pdfDoc.fontSize(20).text('Total Price: $' + totalPrice.toFixed(2));

    pdfDoc.end();
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');

const errorController = require('./controllers/error');

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const store = new MongoDBStore({
  uri: process.env.CONNECTION_URL,
  collection: 'sessions',
});
const csrfProtection = csrf(); //

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, './views'));

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

app.use(bodyParser.urlencoded({ extended: false })); //* for parsing any data we may need to parse
app.use(express.static(path.join(__dirname, './public'))); //* making public folder accessible to the server so we can use css
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store,
  })
);
app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get('/500', errorController.get500);

app.use(errorController.get404);

app.use((error, req, res, next) => {
  res.redirect('/500');
});

const PORT = process.env.PORT || 3001;
(async () => {
  try {
    await mongoose.connect(process.env.CONNECTION_URL);

    console.log('Connected to database!');

    app.listen(PORT);
    console.log(`Server listening on port ${PORT}`);
  } catch (error) {
    console.log(error);
  }
})();

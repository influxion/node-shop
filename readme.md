# Node SHOP

Online e-commerce shop built with strictly back-end tools including, MongoDB, Mongoose, Express, EJS and many more to all come together and create a secure online shop.

## Features

• Sessions

• Account creation

• Password resets

• Product creation

• And much more...

## Installation

Use the package manager [npm](https://nodejs.org/en/download/) to install onto your machine.

Once files have been downloaded onto your machine in the main directory run.

```bash
npm i
```

In the top level of the directory add a `data` folder and add 2 subfolders, `images` & `invoices`.

Finally, add your `.env` file and add the following code and replace the "<>" with your info.

NOTE: You will need both a SendGrid API key & a Stripe API key. Both are able to be obtained for free from their sites by creating an account.

```env
PORT=<set to your desired port>
CONNECTION_URL=<mongodb connection url string>
SESSION_SECRET=<this can be any string>
STRIPE_API_KEY=<this is your stripe api secret key>
SENDGRID_API_KEY=<this is your sendgrid API key used to send the email confirmations>
SHOP_EMAIL=<any email address, valid or not>
```

## Usage

Within your terminal run the command

```bash
npm start
```

Once ran you will be able to go to the port that you selected in your `.env` file and voila!

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const bodyParser = require('body-parser');

const app = express();

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

// Render homepage
app.get('/', (req, res) => {
    res.render('index.ejs');
});

// Handle checkout
app.post('/checkout', async (req, res) => {
    try {
        // Retrieve quantities from the form submission
        const nodejsQuantity = parseInt(req.body['nodejs-quantity']) || 1;
        const javascriptQuantity = parseInt(req.body['javascript-quantity']) || 1;
        const reactjsQuantity = parseInt(req.body['reactjs-quantity']) || 1;

        // Define product prices in cents
        const prices = {
            nodejs: 50 * 100, // $50.00
            javascript: 40 * 100, // $40.00
            reactjs: 20 * 100, // $20.00
        };

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'GYM SHARK Hoodie',
                        },
                        unit_amount: prices.nodejs,
                    },
                    quantity: nodejsQuantity,
                },
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Nike T-Shirt',
                        },
                        unit_amount: prices.javascript,
                    },
                    quantity: javascriptQuantity,
                },
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Puma T-Shirt',
                        },
                        unit_amount: prices.reactjs,
                    },
                    quantity: reactjsQuantity,
                },
            ],
            mode: 'payment',
            shipping_address_collection: {
                allowed_countries: ['US', 'BR'],
            },
            success_url: `${process.env.BASE_URL}/complete?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.BASE_URL}/cancel`,
        });

        // Redirect to Stripe checkout
        res.redirect(session.url);
    } catch (error) {
        console.error('Error creating Stripe session:', error.message);
        res.status(500).send('Something went wrong.');
    }
});

// Handle successful payment
app.get('/complete', async (req, res) => {
    try {
        const sessionId = req.query.session_id;
        const [session, lineItems] = await Promise.all([
            stripe.checkout.sessions.retrieve(sessionId, { expand: ['payment_intent.payment_method'] }),
            stripe.checkout.sessions.listLineItems(sessionId),
        ]);

        console.log('Payment Details:', JSON.stringify(session));
        console.log('Line Items:', JSON.stringify(lineItems));

        res.send('Your payment was successful.');
    } catch (error) {
        console.error('Error retrieving session:', error.message);
        res.status(500).send('Something went wrong.');
    }
});

// Handle canceled payment
app.get('/cancel', (req, res) => {
    res.redirect('/');
});

// Start server
app.listen(3000, () => console.log('Server started on port 3000'));


const { validationResult } = require('express-validator');

const HttpError = require('../../helpers/http-error');
const UserSubscription = require('../../models/user-subscription');

const createUserSubscription = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid data received', 422));
    }

    const { currency, value, name, email } = req.body;

    let customer;
    try {
        customer = await mollieClient.customers.create({
            name,
            email
        });
    } catch (error) {
        return next(new HttpError('Unable to create mollie client', 500));
    }

    if (!customer) {
        return next(new HttpError('Error creating mollie customer', 422));
    }

    let subscription;
    try {
        subscription = await mollieClient.customers_subscriptions.create({
            customerId: customer.id,
            amount: {
                currency,
                value: '100.00'
            },
            interval: '1 month',
            description: 'User subscription',
            webhookUrl: 'https://webshop.example.org/subscriptions/webhook/'
        });
    } catch (error) {
        console.log({ error });
        return next(new HttpError('Unable to subscribe', 500));
    }

    if (!subscription) {
        return next(new HttpError('Error creating subscription'));
    }

    console.log({ subscription });

    res.send('User subscription created');
};

exports.createUserSubscription = createUserSubscription;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { createMollieClient } = require('@mollie/api-client');
const mollieClient = createMollieClient({ apiKey: 'test_AMt6z2jyeDycDgPHPb6chye5w39RWM' });

const HttpError = require('../../helpers/http-error');
const User = require('../../models/user');
const Package = require('../../models/package');

const signup = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid data received', 422));
    }

    const { username, email, password, packageId, cardToken, paymentMethod } = req.body;

    let existingUser;
    try {
        existingUser = await User.findOne({ email: email });
    } catch (error) {
        return next(new HttpError('Signup failed. Try again', 500));
    }

    if (existingUser) {
        return next(new HttpError('Email already registered', 422));
    }

    let hashedPassword;
    try {
        hashedPassword = await bcrypt.hash(password, 12);
    } catch (error) {
        return next(new HttpError('Password hashing failed. Try again', 500));
    }

    let customer;
    try {
        customer = await mollieClient.customers.create({
            name: username,
            email
        });
    } catch (error) {
        return next(new HttpError('Unable to create mollie client', 500));
    }

    if (!customer) {
        return next(new HttpError('Error creating mollie customer', 422));
    }

    let firstPayment;
    try {
        firstPayment = await mollieClient.customers_payments.create({
            customerId: customer.id,
            method: 'ideal',
            amount: {
                currency: 'EUR',
                value: '1.00',
            },
            description: 'First payment',
            sequenceType: "first",
            redirectUrl: 'http://localhost:5000/',

        });
    } catch (error) {
        console.log({ error });
        return next(new HttpError('Error creating first payment', 500));
    }

    console.log({ firstPayment });

    let getMandate;
    try {
        getMandate = await mollieClient.customers_mandates.get(
            firstPayment.mandateId,
            { customerId: firstPayment.customerId }
        );
    } catch (error) {
        console.log({ error });
        return next(new HttpError('Error getting mandate', 500));
    };

    console.log({ getMandate });

    let subscription;
    try {
        subscription = await mollieClient.customers_subscriptions.create({
            customerId: customer.id,
            amount: {
                currency: 'USD',
                value: '100.00'
            },
            interval: '1 month',
            mandateId: getMandate.id,
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

    // const newUser = new User({
    //     username,
    //     email,
    //     password: hashedPassword
    // });

    // try {
    //     await newUser.save();
    // } catch (error) {
    //     return next(new HttpError('Cannot create user. Try again', 500));
    // }

    // res.status(201).json({ userId: newUser.id, email: newUser.email, username: newUser.username })

    res.json({ firstPayment });
};

const login = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid data received', 422));
    }

    const { email, password, specialCode } = req.body;

    let existingUser;
    try {
        existingUser = await User.findOne({ email: email });
    } catch (error) {
        return next(new HttpError('Error fetching user', 500));
    }

    if (!existingUser) {
        return next(new HttpError('Invalid email', 422));
    }

    if (specialCode !== '') {
        if (specialCode !== existingUser.specialCode) {
            return next(new HttpError('Code does not match against the user', 422));
        }
        let validPassword;
        try {
            validPassword = await bcrypt.compare(password, existingUser.password);
        } catch (error) {
            return next(new HttpError('Error validating password', 500));
        }

        if (!validPassword) {
            return next(new HttpError('Password incorrect', 422));
        }
        res.json({ userId: existingUser.id, email: existingUser.email, username: existingUser.username });
    } else {
        let validPassword;
        try {
            validPassword = await bcrypt.compare(password, existingUser.password);
        } catch (error) {
            return next(new HttpError('Error validating password', 500));
        }

        if (!validPassword) {
            return next(new HttpError('Password incorrect', 422));
        }
        res.json({ userId: existingUser.id, email: existingUser.email, username: existingUser.username });
    }

};

const getPackages = async (req, res, next) => {
    let allPackages;
    try {
        allPackages = await Package.find({});
    } catch (error) {
        return next(new HttpError('Error accessing the database', 500));
    };

    if (!allPackages || allPackages.length === 0) {
        return next(new HttpError('No packages found', 500));
    }

    res.json({ packages: allPackages.map(package => package.toObject({ getters: true })) });
};

const changePassword = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new HttpError('Invalid data is received from frontend!', 422);
    }

    const { oldPassword, newPassword } = req.body;

    const userId = req.params.userId;

    let foundUser;
    try {
        foundUser = await User.findById(userId);
    } catch (error) {
        return next(new HttpError('Error accessing database', 500));
    };

    if (!foundUser) {
        return next(new HttpError('No user found against user id', 422));
    }

    let prevPassword;
    try {
        prevPassword = bcrypt.compare(oldPassword, foundUser.password);
    } catch (error) {
        return next(new HttpError('Error retrieving password', 500));
    };

    if (!prevPassword) {
        return next(new HttpError('Old password is incorrect', 422));
    }

    let hashedPassword;
    try {
        hashedPassword = await bcrypt.hash(newPassword, 12);
    } catch (error) {
        return next(new HttpError('Password hashing failed. Try again', 500));
    }

    foundUser.password = hashedPassword;

    try {
        await foundUser.save();
    } catch (error) {
        return next(new HttpError('Error updating password', 500));
    };

    res.json({ message: 'Password updated successfully' });
};

const userForgetPassword = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid data received from frontend', 422));
    }

    const { email, password } = req.body;

    let findUser;
    try {
        findUser = await User.findOne({ email: email });
    } catch (error) {
        return next(new HttpError('Error fetching user from database', 500));
    };

    if (!findUser) {
        return next(new HttpError('No user found against the email', 422));
    }

    let hashedPassword;
    try {
        hashedPassword = await bcrypt.hash(password, 12);
    } catch (error) {
        return next(new HttpError('Password hashing failed. Try again', 500));
    }

    findUser.password = hashedPassword;

    try {
        await findUser.save();
    } catch (error) {
        return next(new HttpError('Error saving password to database', 500));
    };

    res.json({ message: 'Password updated successfully' });
};

exports.signup = signup;
exports.login = login;
exports.getPackages = getPackages;
exports.changePassword = changePassword;
exports.userForgetPassword = userForgetPassword;
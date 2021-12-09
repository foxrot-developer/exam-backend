const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const stripe = require('stripe')('sk_test_51K3gR8GptmPxUZeMVyiVoakC2tYzXDict6ZdlvauzE4cDDK57MuBGQ9IHoZNDIlMJCOSpZUwEd7x8VXGzIKPjOKb00hz7QBzvB');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

const HttpError = require('../../helpers/http-error');
const User = require('../../models/user');
const Package = require('../../models/package');
const UserSubscription = require('../../models/user-subscription');
const { text } = require('express');

const signup = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid data received', 422));
    }

    const { username, email, password, packageId, paymentMethod } = req.body;

    let existingUser;
    try {
        existingUser = await User.findOne({ email: email });
    } catch (error) {
        return next(new HttpError('Signup failed. Try again', 500));
    }

    if (existingUser) {
        return next(new HttpError('Email already registered', 422));
    }

    let existingPackage;
    try {
        existingPackage = await Package.findById(packageId);
    } catch (error) {
        return next(new HttpError('Error accessing database', 500));
    };

    if (!existingPackage) {
        return next(new HttpError('Cannot find package against provided package id', 422));
    }

    let hashedPassword;
    try {
        hashedPassword = await bcrypt.hash(password, 12);
    } catch (error) {
        return next(new HttpError('Password hashing failed. Try again', 500));
    }

    let customer;
    try {
        customer = await stripe.customers.create({
            payment_method: paymentMethod,
            email: email,
            invoice_settings: {
                default_payment_method: paymentMethod
            }
        });
    } catch (error) {
        console.log(error);
        return next(new HttpError('Stripe error creating customer', 500));
    };

    let subscription;
    try {
        subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [
                { plan: existingPackage.planid }
            ],
            expand: ['latest_invoice.payment_intent']
        });
    } catch (error) {
        console.log(error);
        return next(new HttpError('Stripe error creating subscription', 500));
    };

    const status = subscription['latest_invoice']['payment_intent']['status'];
    const client_secret = subscription['latest_invoice']['payment_intent']['client_secret'];

    const newUser = new User({
        username,
        email,
        password: hashedPassword,
        packageId,
        freeAccess: false,
        block: false,
        customerId: customer.id,
        specialCode: '',
        enrolled: [],
        completed: []
    });

    const newSubscription = new UserSubscription({
        subscription: {
            free: false
        },
        user: newUser.id,
        package: packageId,
        subscriptionid: subscription.id
    });

    try {
        const session = await mongoose.startSession();
        session.startTransaction();
        await newUser.save({ session: session });
        await newSubscription.save({ session: session });
        await session.commitTransaction();
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error saving data in database', 500));
    }

    let transporter;
    try {
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'usama.bashirb1@gmail.com',
                pass: 'ubtutyte'
            }
        })
    } catch (error) {
        console.log(error);
        return next(new HttpError('Transporter error', 500));
    };

    let mailDetails
    try {
        mailDetails = {
            from: 'usama.bashirb1@gmail.com',
            to: email,
            subject: 'Package subscription confirmation',
            text: `Your subscription of ${existingPackage.package_name} is confirmed`
        }
    } catch (error) {
        console.log(error);
        return next(new HttpError('Mail details error', 500));
    }

    try {
        transporter.sendMail(mailDetails);
    } catch (error) {
        console.log(error);
        return next(new HttpError('Mail sending error', 500));
    };

    res.json({ userId: newUser.id, username: newUser.username, email: newUser.email, freeAccess: newUser.freeAccess, subscriptionid: newUser.subscriptionid, status, client_secret });

};

const login = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid data received', 422));
    }

    const { email, password, specialCode } = req.body;

    console.log({ specialCode });

    let existingUser;
    try {
        existingUser = await User.findOne({ email: email });
    } catch (error) {
        return next(new HttpError('Error fetching user', 500));
    }

    if (!existingUser) {
        return next(new HttpError('Invalid email', 422));
    }

    if (specialCode !== '' && specialCode !== undefined) {
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
        res.json({ userId: existingUser.id, email: existingUser.email, username: existingUser.username, freeAccess: existingUser.freeAccess, subscriptionid: existingUser.subscriptionid });
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
        res.json({ userId: existingUser.id, email: existingUser.email, username: existingUser.username, freeAccess: existingUser.freeAccess, subscriptionid: existingUser.subscriptionid });
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
        console.log(error);
        return next(new HttpError('Error saving password to database', 500));
    };

    res.json({ message: 'Password updated successfully' });
};

exports.signup = signup;
exports.login = login;
exports.getPackages = getPackages;
exports.changePassword = changePassword;
exports.userForgetPassword = userForgetPassword;
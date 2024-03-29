const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const stripe = require('stripe')('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');
// const stripe = require('stripe')('sk_test_51K3gR8GptmPxUZeMVyiVoakC2tYzXDict6ZdlvauzE4cDDK57MuBGQ9IHoZNDIlMJCOSpZUwEd7x8VXGzIKPjOKb00hz7QBzvB');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

const HttpError = require('../../helpers/http-error');
const User = require('../../models/user');
const Package = require('../../models/package');
const ArPackage = require('../../models/ar-package');
const NlPackage = require('../../models/nl-package');
const UserSubscription = require('../../models/user-subscription');
const PaidExam = require('../../models/paid-exam');
const EmailTemplate = require('../../models/email-template');

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
            cancel_at_period_end: true,
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
            host: 'smtp.transip.email',
            port: 465,
            secure: true, // true for 465, false for other ports
            auth: {
                user: 'info@alshahbarijschool.nl', // your domain email address
                pass: 'D3velop1nJDE' // your password
            }
        })
    } catch (error) {
        console.log(error);
        return next(new HttpError('Transporter error', 500));
    };

    let existingEmailTemplate;
    try {
        existingEmailTemplate = await EmailTemplate.findById('61c86f420eb00d6b409944b4');
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error fetching data from database', 500));
    };

    if (!existingEmailTemplate) {
        return next(new HttpError('No email template found against id', 500));
    }

    let mailDetails
    try {
        mailDetails = {
            from: 'info@alshahbarijschool.nl',
            to: email,
            subject: 'Package subscription confirmation',
            text: existingEmailTemplate.templateText
        }
    } catch (error) {
        console.log(error);
        return next(new HttpError('Mail details error', 500));
    }

    try {
        transporter.sendMail(mailDetails, function (err, data) {
            if (err) {
                console.log(err);
            }
            else {
                console.log('Email sent to email');
            }
        });
    } catch (error) {
        console.log(error);
        return next(new HttpError('Mail sending error', 500));
    };

    res.json({ userId: newUser.id, username: newUser.username, email: newUser.email, freeAccess: newUser.freeAccess, subscriptionid: newUser.subscriptionid, status, client_secret });

};

const idealSignup = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid data received', 422));
    }

    const { email, packageId } = req.body;

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

    let paymentIntent;
    try {
        paymentIntent = await stripe.paymentIntents.create({
            amount: parseInt(existingPackage.price * 100),
            currency: 'eur',
            payment_method_types: ['ideal'],
        });
    } catch (error) {
        console.log(error);
        return next(new HttpError('Stripe error creating payment intent', 500));
    };

    res.json({ client_secret: paymentIntent.client_secret });
};

const createIdealUser = async (req, res, next) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid data received', 422));
    }

    const { username, email, password, packageId } = req.body;

    let hashedPassword;
    try {
        hashedPassword = await bcrypt.hash(password, 12);
    } catch (error) {
        return next(new HttpError('Password hashing failed. Try again', 500));
    }

    const newUser = new User({
        username,
        email,
        password: hashedPassword,
        packageId,
        freeAccess: false,
        block: false,
        customerId: '',
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
        subscriptionid: ''
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
            host: 'smtp.transip.email',
            port: 465,
            secure: true, // true for 465, false for other ports
            auth: {
                user: 'info@alshahbarijschool.nl', // your domain email address
                pass: 'D3velop1nJDE' // your password
            }
        })
    } catch (error) {
        console.log(error);
        return next(new HttpError('Transporter error', 500));
    };

    let existingEmailTemplate;
    try {
        existingEmailTemplate = await EmailTemplate.findById('61c86f420eb00d6b409944b4');
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error fetching data from database', 500));
    };

    if (!existingEmailTemplate) {
        return next(new HttpError('No email template found against id', 500));
    }

    let mailDetails
    try {
        mailDetails = {
            from: 'info@alshahbarijschool.nl',
            to: email,
            subject: 'Package subscription confirmation',
            text: existingEmailTemplate.templateText
        }
    } catch (error) {
        console.log(error);
        return next(new HttpError('Mail details error', 500));
    }

    try {
        transporter.sendMail(mailDetails, function (err, data) {
            if (err) {
                console.log(err);
            }
            else {
                console.log('Email sent to email');
            }
        });
    } catch (error) {
        console.log(error);
        return next(new HttpError('Mail sending error', 500));
    };

    res.json({ userId: newUser.id, username: newUser.username, email: newUser.email, freeAccess: newUser.freeAccess, subscriptionid: newUser.subscriptionid });

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

    if (!existingUser.block) {
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
            res.json({ userId: existingUser.id, email: existingUser.email, username: existingUser.username, freeAccess: existingUser.freeAccess, subscriptionid: existingUser.subscriptionid, enrolled: existingUser.enrolled.map(enroll => enroll.toObject({ getters: true })), completed: existingUser.completed.map(enroll => enroll.toObject({ getters: true })) });
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
            res.json({ userId: existingUser.id, email: existingUser.email, username: existingUser.username, freeAccess: existingUser.freeAccess, subscriptionid: existingUser.subscriptionid, enrolled: existingUser.enrolled, completed: existingUser.completed });
        }
    }
    else {
        return next(new HttpError('User is blocked', 500));
    }

};

const getPackages = async (req, res, next) => {

    if (req.headers.lang === 'en') {
        let allPackages;
        try {
            allPackages = await Package.find({});
        } catch (error) {
            return next(new HttpError('Error accessing the database', 500));
        };

        if (!allPackages || allPackages.length === 0) {
            return next(new HttpError('No packages found', 200));
        }

        res.json({ packages: allPackages.map(package => package.toObject({ getters: true })) });
    }
    else if (req.headers.lang === 'ar') {
        let allArPackages;
        try {
            allArPackages = await ArPackage.find({});
        } catch (error) {
            return next(new HttpError('Error accessing the database', 500));
        };

        if (!allArPackages || allArPackages.length === 0) {
            return next(new HttpError('No packages found', 200));
        }

        res.json({ packages: allArPackages.map(package => package.toObject({ getters: true })) });
    }
    else if (req.headers.lang === 'nl') {
        let allNlPackages;
        try {
            allNlPackages = await NlPackage.find({});
        } catch (error) {
            return next(new HttpError('Error accessing the database', 500));
        };

        if (!allNlPackages || allNlPackages.length === 0) {
            return next(new HttpError('No packages found', 200));
        }

        res.json({ packages: allNlPackages.map(package => package.toObject({ getters: true })) });
    }
    else {
        res.json({ message: 'Invalid or no lang header found' });
    }

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

const examEnrollment = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid data received from frontend', 422));
    }

    const { examId, userId, lang } = req.body;

    let existingPaidExam;
    try {
        existingPaidExam = await PaidExam.findById(examId.toString());
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error fetching data from database', 500));
    }

    if (!existingPaidExam) {
        return next(new HttpError('Exam not found', 422));
    }

    let existingUser;
    try {
        existingUser = await User.findById(userId);
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error fetching user from database', 500));
    };

    if (!existingUser) {
        return next(new HttpError('No user found against id', 422));
    }

    try {
        existingUser.enrolled.push({ examId: existingPaidExam.id, lang: lang });
        await existingUser.save();
    } catch (error) {
        return next(new HttpError('Error saving data to database', 500));
    };

    res.json({ userId: existingUser.id, email: existingUser.email, username: existingUser.username, freeAccess: existingUser.freeAccess, subscriptionid: existingUser.subscriptionid, enrolled: existingUser.enrolled, completed: existingUser.completed });
};

const getUserDetails = async (req, res, next) => {
    const userId = req.params.userId;

    let existingUser;
    try {
        existingUser = await User.findById(userId);
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error fetching data from database', 500));
    };

    if (!existingUser) {
        return next(new HttpError('No user found against id', 422));
    }

    res.json({ user: existingUser });
}

exports.signup = signup;
exports.login = login;
exports.getPackages = getPackages;
exports.changePassword = changePassword;
exports.userForgetPassword = userForgetPassword;
exports.examEnrollment = examEnrollment;
exports.getUserDetails = getUserDetails;
exports.idealSignup = idealSignup;
exports.createIdealUser = createIdealUser;
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const stripe = require('stripe')('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');
// const stripe = require('stripe')('sk_test_51K3gR8GptmPxUZeMVyiVoakC2tYzXDict6ZdlvauzE4cDDK57MuBGQ9IHoZNDIlMJCOSpZUwEd7x8VXGzIKPjOKb00hz7QBzvB');
const nodemailer = require('nodemailer');

const HttpError = require('../../helpers/http-error');
const User = require('../../models/user');
const Package = require('../../models/package');
const userSubscription = require('../../models/user-subscription');
const Admin = require('../../models/admin');
const PaymentMethod = require('../../models/payment-method');
const WebProfile = require('../../models/web-profile');
const ArWebProfile = require('../../models/ar-web-profile');
const NlWebProfile = require('../../models/nl-web-profile');
const ArPackage = require('../../models/ar-package');
const NlPackage = require('../../models/nl-package');
const PageSection = require('../../models/page-section');
const ArPageSection = require('../../models/ar-page-section');
const NlPageSection = require('../../models/nl-page-section');
const EmailTemplate = require('../../models/email-template');

const getUsers = async (req, res, next) => {
    let allUsers;
    try {
        allUsers = await User.find({}, '-password');
    } catch (error) {
        return next(new HttpError('Error fetching users from database', 500));
    }

    if (!allUsers || allUsers.length === 0) {
        return next(new HttpError('No users found', 500));
    }

    res.json({ users: allUsers.map(user => user.toObject({ getters: true })) });
};

const updateUser = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new HttpError('Invalid data received from frontend', 422);
    }

    const { username, email } = req.body;
    const userId = req.params.userId;

    let existingUser;
    try {
        existingUser = await User.findById(userId);
    } catch (error) {
        return next(new HttpError('Error fetching user from database', 500));
    }

    if (!existingUser) {
        return next(new HttpError('Cannot find user from provided user id', 422));
    }

    existingUser.username = username;
    existingUser.email = email;

    try {
        await existingUser.save();
    } catch (error) {
        return next(new HttpError('Error updating user', 500));
    }

    res.status(200).json({ user: existingUser.toObject({ getters: true }) });
};

const deletePackage = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid data received from frontend', 422));
    }

    const pkgId = req.params.pkgId;

    let existingPackage;
    try {
        existingPackage = await Package.findById(pkgId);
    } catch (error) {
        return next(new HttpError('Error accessing database', 500));
    };

    if (!existingPackage) {
        return next(new HttpError('No package found', 422));
    }

    // Ar
    let existingArPackage;
    try {
        existingArPackage = await ArPackage.findOne({ enId: pkgId });
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error fetching data from database', 500));
    };

    if (!existingArPackage) {
        return next(new HttpError('No ar package found against the id', 422));
    }

    // Nl
    let existingNlPackage;
    try {
        existingNlPackage = await NlPackage.findOne({ enId: pkgId });
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error fetching data from database', 500));
    };

    if (!existingNlPackage) {
        return next(new HttpError('No ar package found against the id', 422));
    }

    let existingPlan;
    try {
        existingPlan = await stripe.plans.del(
            existingPackage.planid
        );
    } catch (error) {
        return next(new HttpError('Stripe deletion error', 500));
    };

    let existingProduct;
    try {
        existingProduct = await stripe.products.del(
            existingPackage.productid
        );
    } catch (error) {
        console.log(error);
        return next(new HttpError('Stripe error deleting product'));
    };


    try {
        const session = await mongoose.startSession();
        session.startTransaction();
        await existingPackage.remove();
        await existingArPackage.remove();
        await existingNlPackage.remove();
        await session.commitTransaction();
    } catch (error) {
        return next(new HttpError('Cannot delete package', 500));
    };

    res.json({ message: 'Package deleted successfully' });
};

const deleteUser = async (req, res, next) => {
    const userId = req.params.userId;

    let existingUser;
    try {
        existingUser = await User.findById(userId);
    } catch (error) {
        return next(new HttpError('Error fetching user', 500));
    }

    if (!existingUser) {
        return next(new HttpError('No user found', 422));
    }

    let existingSubs;
    try {
        existingSubs = await userSubscription.findOne({ user: userId });
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error fetching subscription data from database', 500));
    };

    if (!existingSubs) {
        return next(new HttpError('No subscription found', 422));
    }

    if (!existingUser.freeAccess && existingSubs.subscriptionid !== '') {

        let deleteSubs;
        try {
            deleteSubs = await stripe.subscriptions.del(
                existingSubs.subscriptionid
            );
        } catch (error) {
            console.log(error);
            return next(new HttpError('Stripe error canceling subscription'));
        };
    }

    try {
        const session = await mongoose.startSession();
        session.startTransaction();
        await existingUser.remove();
        await existingSubs.remove();
        await session.commitTransaction();
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error deleting user', 500));
    }

    res.status(200).json({ message: 'User deleted successfully' });
};

const createPackage = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new HttpError('Invalid data received from frontend!', 422);
    }

    const {
        package_name,
        package_name_ar,
        package_name_nl,
        price,
        price_ar,
        price_nl,
        description,
        description_ar,
        description_nl,
        duration,
        duration_ar,
        duration_nl,
        no_exam,
        repeat,
        langs,
        langs_ar,
        langs_nl,
        interval
    } = req.body;

    let existingPackage;
    try {
        existingPackage = await Package.findOne({ package_name: package_name });
    } catch (error) {
        return next(new HttpError('Error accessing database', 500));
    };

    if (existingPackage) {
        return next(new HttpError('Package name already exists', 422));
    }

    let product;
    try {
        product = await stripe.products.create({
            name: package_name,
        });
    } catch (error) {
        return next(new HttpError('Stripe error creating product'));
    };

    let plan;
    try {
        plan = await stripe.plans.create({
            amount: price * 100,
            currency: 'eur',
            interval: duration,
            interval_count: interval,
            product: product.id
        });
    } catch (error) {
        console.log('Stripe error', error);
        return next(new HttpError('Stripe plan creation error', 500));
    };

    if (!plan) {
        return next(new HttpError('Cannot create plan', 500));
    }


    const newPackage = new Package({
        package_name,
        price,
        description,
        duration,
        planid: plan.id,
        active: true,
        productid: product.id,
        no_exam,
        repeat,
        langs,
        interval
    });

    const newArPackage = new ArPackage({
        enId: newPackage.id,
        package_name: package_name_ar,
        price: price_ar,
        description: description_ar,
        duration: duration_ar,
        planid: plan.id,
        active: true,
        productid: product.id,
        no_exam,
        repeat,
        langs: langs_ar,
        interval
    });

    const newNlPackage = new NlPackage({
        enId: newPackage.id,
        package_name: package_name_nl,
        price: price_nl,
        description: description_nl,
        duration: duration_nl,
        planid: plan.id,
        active: true,
        productid: product.id,
        no_exam,
        repeat,
        langs: langs_nl,
        interval
    });

    try {
        const session = await mongoose.startSession();
        session.startTransaction();
        await newPackage.save({ session: session });
        await newArPackage.save({ session: session });
        await newNlPackage.save({ session: session });
        await session.commitTransaction();
    } catch (error) {
        return next(new HttpError('Cannot create new package', 500));
    };

    res.status(201).json({ newPackage });
};

const editPackage = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid data received', 422));
    }

    const {
        package_name,
        package_name_ar,
        package_name_nl,
        price,
        description,
        description_ar,
        description_nl,
        duration,
        duration_ar,
        duration_nl,
        no_exam,
        repeat,
        langs,
        interval
    } = req.body;

    const pkgId = req.params.pkgId;

    let existingPackage;
    try {
        existingPackage = await Package.findById(pkgId);
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error getting en packages from database', 500));
    };

    if (!existingPackage) {
        return next(new HttpError('No package found against pkg id', 422));
    }

    // Ar
    let existingArPackage;
    try {
        existingArPackage = await ArPackage.findOne({ enId: pkgId });
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error getting ar packages from database', 500));
    };

    if (!existingArPackage) {
        return next(new HttpError('No package found against pkg id', 422));
    }

    // Nl
    let existingNlPackage;
    try {
        existingNlPackage = await NlPackage.findOne({ enId: pkgId });
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error getting nl packages from database', 500));
    };

    if (!existingNlPackage) {
        return next(new HttpError('No package found against pkg id', 422));
    }

    let existingPlan;
    try {
        existingPlan = await stripe.plans.del(
            existingPackage.planid
        );
    } catch (error) {
        return next(new HttpError('Stripe plan deletion error', 500));
    };

    let existingProduct;
    try {
        existingProduct = await stripe.products.update(
            existingPackage.productid,
            { name: package_name }
        );
    } catch (error) {
        console.log(error);
        return next(new HttpError('Stripe error updating product', 500))
    };

    let newPlan;
    try {
        newPlan = await stripe.plans.create({
            amount: price * 100,
            currency: 'eur',
            interval: duration,
            interval_count: interval,
            product: existingPackage.productid,
        });
    } catch (error) {
        console.log(error);
        return next(new HttpError('Stripe error crating plan', 500));
    };

    existingPackage.package_name = package_name;
    existingPackage.description = description;
    existingPackage.price = price;
    existingPackage.duration = duration;
    existingPackage.no_exam = no_exam;
    existingPackage.repeat = repeat;
    existingPackage.langs = langs;
    existingPackage.interval = interval;
    existingPackage.planid = newPlan.id

    existingArPackage.package_name = package_name_ar;
    existingArPackage.description = description_ar;
    existingArPackage.price = price;
    existingArPackage.duration = duration_ar;
    existingArPackage.no_exam = no_exam;
    existingArPackage.repeat = repeat;
    existingArPackage.langs = langs;
    existingArPackage.interval = interval;
    existingPackage.planid = newPlan.id

    existingNlPackage.package_name = package_name_nl;
    existingNlPackage.description = description_nl;
    existingNlPackage.price = price;
    existingNlPackage.duration = duration_nl;
    existingNlPackage.no_exam = no_exam;
    existingNlPackage.repeat = repeat;
    existingNlPackage.langs = langs;
    existingNlPackage.interval = interval;
    existingPackage.planid = newPlan.id

    try {
        const session = await mongoose.startSession();
        session.startTransaction();
        await existingPackage.save({ session: session });
        await existingArPackage.save({ session: session });
        await existingNlPackage.save({ session: session });
        await session.commitTransaction();
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error updating data in database', 500));
    };

    res.json({ message: 'Package updated successfully' });

};

const createUser = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid data received', 422));
    }

    const { username, password, packageId, specialCode, email } = req.body;

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

    let existingPackage;
    try {
        existingPackage = await Package.findById(packageId);
    } catch (error) {
        return next(new HttpError('Error accessing database', 500));
    };

    if (!existingPackage) {
        return next(new HttpError('Cannot find package against provided package id', 422));
    }

    const newUser = new User({
        username,
        email,
        password: hashedPassword,
        packageId,
        freeAccess: true,
        block: false,
        customerId: '',
        specialCode,
        enrolled: [],
        completed: []
    });

    const newSubscription = new userSubscription({
        subscription: {
            free: true
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

    res.status(201).json({ message: 'User created successfully' });
};

const adminLogin = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid data received from frontend', 422));
    }

    const { email, password } = req.body;

    let hashedPassword;
    try {
        hashedPassword = await bcrypt.hash(password, 12);
    } catch (error) {
        return next(new HttpError('Password hashing failed. Try again', 500));
    }

    let existingAdmin;
    try {
        existingAdmin = await Admin.findOne({ email: email });
    } catch (error) {
        return next(new HttpError('Error fetching admin', 500));
    };

    if (!existingAdmin) {
        return next(new HttpError('Email not found', 422));
    }

    let validPassword;
    try {
        validPassword = await bcrypt.compare(password, existingAdmin.password);
    } catch (error) {
        return next(new HttpError('Error validating password', 500));
    };

    if (!validPassword) {
        return next(new HttpError('Password incorrect', 422));
    }

    res.json({ adminId: existingAdmin.id, name: existingAdmin.name, email: existingAdmin.email });
};

const adminUpdatePassword = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid data received from frontend', 422));
    }

    const { oldpassword, newPassword } = req.body;
    const adminId = req.params.adminId;

    let existingAdmin;
    try {
        existingAdmin = await Admin.findById(adminId);
    } catch (error) {
        return next(new HttpError('Error fetching admin data from database', 500));
    };

    if (!existingAdmin) {
        return next(new HttpError('Admin not found against provided id', 422));
    }

    let prevPassword;
    try {
        prevPassword = bcrypt.compare(oldpassword, existingAdmin.password);
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

    existingAdmin.password = hashedPassword;

    try {
        await existingAdmin.save();
    } catch (error) {
        return next(new HttpError('Error updating password', 500));
    };

    res.json({ message: 'Password updated successfully' });


};

const adminUpdateProfile = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid data received from frontend', 422));
    }

    const { email, name } = req.body;
    const adminId = req.params.adminId;

    let existingAdmin;
    try {
        existingAdmin = await Admin.findById(adminId);
    } catch (error) {
        return next(new HttpError('Error fetching admin data from database', 500));
    };

    if (!existingAdmin) {
        return next(new HttpError('Admin not found against provided id', 422));
    }

    existingAdmin.email = email;
    existingAdmin.name = name;

    try {
        await existingAdmin.save();
    } catch (error) {
        return next(new HttpError('Error updating user', 500));
    };

    res.json({ adminId: existingAdmin.id, name: existingAdmin.name, email: existingAdmin.email });
};

const adminUserBlock = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid data received from frontend', 422));
    }

    const { block } = req.body;
    const userId = req.params.userId;

    let existingUser;
    try {
        existingUser = await User.findById(userId);
    } catch (error) {
        return next(new HttpError('Error fetching data from database', 500));
    };

    if (!existingUser) {
        return next(new HttpError('No user found against provided user id', 422));
    }

    existingUser.block = block;

    try {
        await existingUser.save();
    } catch (error) {
        return next(new HttpError('Error updating user', 500));
    };

    res.json({ message: 'User updated successfully' });

};

const activePackage = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid data received from frontend', 422));
    }

    const { active } = req.body;
    const pkgId = req.params.pkgId;

    let existingPackage;
    try {
        existingPackage = await Package.findById(pkgId);
    } catch (error) {
        return next(new HttpError('Error accessing database', 500));
    };

    if (!existingPackage) {
        return next(new HttpError('No package found against provided package id', 422));
    }

    // Ar
    let existingArPackage;
    try {
        existingArPackage = await ArPackage.findOne({ enId: pkgId });
    } catch (error) {
        return next(new HttpError('Error accessing database', 500));
    };

    if (!existingArPackage) {
        return next(new HttpError('No ar package found against provided package id', 422));
    }

    // Nl
    let existingNlPackage;
    try {
        existingNlPackage = await NlPackage.findOne({ enId: pkgId });
    } catch (error) {
        return next(new HttpError('Error accessing database', 500));
    };

    if (!existingNlPackage) {
        return next(new HttpError('No nl package found against provided package id', 422));
    }

    let existingPlan;
    try {
        existingPlan = await stripe.plans.update(
            existingPackage.planid,
            { active: active }
        );
    } catch (error) {
        console.log(error);
        return next(new HttpError('Stripe plan activation error', 500));
    };

    let existingProduct;
    try {
        existingProduct = await stripe.products.update(
            existingPackage.productid,
            { active: active }
        );
    } catch (error) {
        console.log(error);
        return next(new HttpError('Stripe product activation error', 500));
    };

    existingPackage.active = active;
    existingArPackage.active = active;
    existingNlPackage.active = active;

    try {
        const session = await mongoose.startSession();
        session.startTransaction();
        await existingPackage.save({ session: session });
        await existingArPackage.save({ session: session });
        await existingNlPackage.save({ session: session });
        await session.commitTransaction();
    } catch (error) {
        return next(new HttpError('Error updating package', 500));
    };

    res.json({ message: 'Package updated successfully' });
};

const userSubscriptionDetails = async (req, res, next) => {
    const userId = req.params.userId;

    let existingUser;
    try {
        existingUser = await User.findById(userId);
    } catch (error) {
        return next(new HttpError('Error fetching user', 500));
    }

    if (!existingUser) {
        return next(new HttpError('No user found', 422));
    }

    let existingSubs;
    try {
        existingSubs = await userSubscription.findOne({ user: userId });
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error fetching subscription data from database', 500));
    };

    if (!existingSubs) {
        return next(new HttpError('No subscription found', 422));
    }

    if (req.headers.lang === 'en') {
        let existingPackage;
        try {
            existingPackage = await Package.findById(existingSubs.package);
        } catch (error) {
            console.log(error);
            return next(new HttpError('Error getting package from database', 500));
        };

        if (!existingPackage) {
            return next(new HttpError('No package found against package id', 500));
        }

        if (!existingUser.freeAccess && existingSubs.subscriptionid !== '') {
            let getSubs;
            try {
                getSubs = await stripe.subscriptions.retrieve(
                    existingSubs.subscriptionid
                );
            } catch (error) {
                console.log(error);
                return next(new HttpError('Stripe error getting subscription details', 500));
            };

            res.json({ subscription_details: getSubs, package_details: existingPackage });
        } else {
            res.json({ package_details: existingPackage, subscription_details: 'free' });
        }
    }

    else if (req.headers.lang === 'ar') {
        let existingArPackage;
        try {
            existingArPackage = await ArPackage.findOne({ enId: existingSubs.package });
        } catch (error) {
            console.log(error);
            return next(new HttpError('Error getting package from database', 500));
        };

        if (!existingArPackage) {
            return next(new HttpError('No package found against package id', 500));
        }

        if (!existingUser.freeAccess && existingSubs.subscriptionid !== '') {
            let getSubs;
            try {
                getSubs = await stripe.subscriptions.retrieve(
                    existingSubs.subscriptionid
                );
            } catch (error) {
                console.log(error);
                return next(new HttpError('Stripe error getting subscription details', 500));
            };

            res.json({ subscription_details: getSubs, package_details: existingArPackage });
        } else {
            res.json({ package_details: existingArPackage, subscription_details: 'free' });
        }
    }

    else if (req.headers.lang === 'nl') {
        let existingNlPackage;
        try {
            existingNlPackage = await NlPackage.findOne({ enId: existingSubs.package });
        } catch (error) {
            console.log(error);
            return next(new HttpError('Error getting package from database', 500));
        };

        if (!existingNlPackage) {
            return next(new HttpError('No package found against package id', 500));
        }

        if (!existingUser.freeAccess && existingSubs.subscriptionid !== '') {
            let getSubs;
            try {
                getSubs = await stripe.subscriptions.retrieve(
                    existingSubs.subscriptionid
                );
            } catch (error) {
                console.log(error);
                return next(new HttpError('Stripe error getting subscription details', 500));
            };

            res.json({ subscription_details: getSubs, package_details: existingNlPackage });
        } else {
            res.json({ package_details: existingNlPackage, subscription_details: 'free' });
        }
    }
    else {
        return next(new HttpError('Invaid or no lang header found', 422));
    }

};

const activePaymentMethod = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid data received from frontend', 422));
    }

    const { active } = req.body;
    const payId = req.params.payId;

    let existingPayment;
    try {
        existingPayment = await PaymentMethod.findById(payId);
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error fetching data from database', 500));
    };

    if (!existingPayment) {
        return next(new HttpError('No payment method found against the id', 422));
    }

    existingPayment.active = active;

    try {
        await existingPayment.save();
    } catch (error) {
        console.log(error);
        return next(new HttpError('Unable to update payment method', 500));
    }

    res.json({ message: 'Payment method updated successfully' });
};

const allPayments = async (req, res, next) => {

    let existingPayments;
    try {
        existingPayments = await PaymentMethod.find({});
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error fetching data from database', 500));
    };

    if (!existingPayments) {
        return next(new HttpError('No payment methods found', 422));;
    }

    res.json({ payment_methods: existingPayments.map(payment => payment.toObject({ getters: true })) });
};

const updateWebProfile = async (req, res, next) => {
    const { location, location_ar, location_nl, address, address_ar, address_nl, contact, contact_ar, contact_nl, email, email_ar, email_nl, hours, hours_ar, hours_nl } = req.body;

    const profileId = req.params.profileId;

    let existingWebProfile;
    try {
        existingWebProfile = await WebProfile.findById(profileId);
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error getting data from database', 500));
    }

    if (!existingWebProfile) {
        return next(new HttpError('No data found in database', 422));
    }

    // Ar
    let existingArWebProfile;
    try {
        existingArWebProfile = await ArWebProfile.findOne({ enId: profileId });
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error fetching data from database', 500));
    };

    if (!existingArWebProfile) {
        return next(new HttpError('No ar result found against id', 422));
    }

    // Nl
    let existingNlWebProfile;
    try {
        existingNlWebProfile = await NlWebProfile.findOne({ enId: profileId });
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error fetching data from database', 500));
    };

    if (!existingNlWebProfile) {
        return next(new HttpError('No nl result found against id', 422));
    }


    if (location) {
        existingWebProfile.location = location;
        existingArWebProfile.location = location_ar;
        existingNlWebProfile.location = location_nl;

        try {
            const session = await mongoose.startSession();
            session.startTransaction();
            await existingWebProfile.save({ session: session });
            await existingArWebProfile.save({ session: session });
            await existingNlWebProfile.save({ session: session });
            await session.commitTransaction();
        } catch (error) {
            console.log(error);
            return next(new HttpError('Error saving location to database', 500));
        };

    }

    if (contact) {
        existingWebProfile.contact = contact;
        existingArWebProfile.contact = contact_ar;
        existingNlWebProfile.contact = contact_nl;

        try {
            const session = await mongoose.startSession();
            session.startTransaction();
            await existingWebProfile.save({ session: session });
            await existingArWebProfile.save({ session: session });
            await existingNlWebProfile.save({ session: session });
            await session.commitTransaction();
        } catch (error) {
            console.log(error);
            return next(new HttpError('Error saving contact to database', 500));
        };

    }

    if (address) {
        existingWebProfile.address = address;
        existingArWebProfile.address = address_ar;
        existingNlWebProfile.address = address_nl;

        try {
            const session = await mongoose.startSession();
            session.startTransaction();
            await existingWebProfile.save({ session: session });
            await existingArWebProfile.save({ session: session });
            await existingNlWebProfile.save({ session: session });
            await session.commitTransaction();
        } catch (error) {
            console.log(error);
            return next(new HttpError('Error saving address to database', 500));
        };
    }

    if (email) {
        existingWebProfile.email = email;
        existingArWebProfile.email = email_ar;
        existingNlWebProfile.email = email_nl;

        try {
            const session = await mongoose.startSession();
            session.startTransaction();
            await existingWebProfile.save({ session: session });
            await existingArWebProfile.save({ session: session });
            await existingNlWebProfile.save({ session: session });
            await session.commitTransaction();
        } catch (error) {
            console.log(error);
            return next(new HttpError('Error saving address to database', 500));
        };
    }

    if (hours) {
        existingWebProfile.hours = hours;
        existingArWebProfile.hours = hours_ar;
        existingNlWebProfile.hours = hours_nl;

        try {
            const session = await mongoose.startSession();
            session.startTransaction();
            await existingWebProfile.save({ session: session });
            await existingArWebProfile.save({ session: session });
            await existingNlWebProfile.save({ session: session });
            await session.commitTransaction();
        } catch (error) {
            console.log(error);
            return next(new HttpError('Error saving address to database', 500));
        };
    }

    res.json({ message: 'Profile updated successfully' });

};

const webProfile = async (req, res, next) => {
    const profileId = req.params.profileId;

    if (req.headers.lang === 'en') {
        let existingWebProfile;
        try {
            existingWebProfile = await WebProfile.findById(profileId);
        } catch (error) {
            console.log(error);
            return next(new HttpError('Error getting data from database', 500));
        }

        if (!existingWebProfile) {
            return next(new HttpError('No data found in database', 422));
        }

        res.json({ profileId: existingWebProfile.id, address: existingWebProfile.address, location: existingWebProfile.location, contact: existingWebProfile.contact, email: existingWebProfile.email, hours: existingWebProfile.hours });

    }

    else if (req.headers.lang === 'ar') {
        // Ar
        let existingArWebProfile;
        try {
            existingArWebProfile = await ArWebProfile.findOne({ enId: profileId });
        } catch (error) {
            console.log(error);
            return next(new HttpError('Error fetching data from database', 500));
        };

        if (!existingArWebProfile) {
            return next(new HttpError('No ar result found against id', 422));
        }

        res.json({ enId: existingArWebProfile.enId, profileId: existingArWebProfile.id, address: existingArWebProfile.address, location: existingArWebProfile.location, contact: existingArWebProfile.contact, email: existingArWebProfile.email, hours: existingArWebProfile.hours });

    }

    else if (req.headers.lang === 'nl') {
        // Nl
        let existingNlWebProfile;
        try {
            existingNlWebProfile = await NlWebProfile.findOne({ enId: profileId });
        } catch (error) {
            console.log(error);
            return next(new HttpError('Error fetching data from database', 500));
        };

        if (!existingNlWebProfile) {
            return next(new HttpError('No nl result found against id', 422));
        }

        res.json({ enId: existingNlWebProfile.enId, profileId: existingNlWebProfile.id, address: existingNlWebProfile.address, location: existingNlWebProfile.location, contact: existingNlWebProfile.contact, email: existingNlWebProfile.email, hours: existingNlWebProfile.hours });

    }
    else {
        res.json({ message: 'Invalid language header or no header found' });
    }

};

const resetUserPassword = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid data received', 422));
    }

    const { password } = req.body;
    const userId = req.params.userId;

    let existingUser;
    try {
        existingUser = await User.findById(userId);
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error getting user data from database', 500));
    }

    if (!existingUser) {
        return next(new HttpError('No user found against the user id', 422));
    }

    let hashedPassword;
    try {
        hashedPassword = await bcrypt.hash(password, 12);
    } catch (error) {
        return next(new HttpError('Password hashing failed. Try again', 500));
    }

    existingUser.password = hashedPassword;

    try {
        await existingUser.save();
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error updating user password in database', 500));
    }

    res.json({ message: 'User password reset successful' });
};

const heroUpdate = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid data received', 422));
    }

    const {
        hero,
        hero_ar,
        hero_nl
    } = req.body;

    const profileId = req.params.profileId;

    let existingWebProfile;
    try {
        existingWebProfile = await PageSection.findById(profileId);
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error getting data from database', 500));
    };

    if (!existingWebProfile) {
        return next(new HttpError('No profile found against id', 422));
    }

    // Ar
    let existingArWebProfile;
    try {
        existingArWebProfile = await ArPageSection.findOne({ enId: profileId });
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error getting data from database', 500));
    };

    if (!existingArWebProfile) {
        return next(new HttpError('No profile found against id', 422));
    }

    // Nl
    let existingNlWebProfile;
    try {
        existingNlWebProfile = await NlPageSection.findOne({ enId: profileId });
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error getting data from database', 500));
    };

    if (!existingNlWebProfile) {
        return next(new HttpError('No profile found against id', 422));
    }

    existingWebProfile.hero = hero;
    existingArWebProfile.hero = hero_ar;
    existingNlWebProfile.hero = hero_nl;

    try {
        const session = await mongoose.startSession();
        session.startTransaction();
        await existingWebProfile.save({ session: session });
        await existingArWebProfile.save({ session: session });
        await existingNlWebProfile.save({ session: session });
        await session.commitTransaction();
    } catch (error) {
        console.log(error);
        return next(new HttpError('Cannot updating hero section', 500));
    };

    res.json({ message: "Hero section updated successfully" });
};

const aboutUpdate = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid data received', 422));
    }

    const {
        about,
        about_ar,
        about_nl
    } = req.body;

    const profileId = req.params.profileId;

    let existingWebProfile;
    try {
        existingWebProfile = await PageSection.findById(profileId);
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error getting data from database', 500));
    };

    if (!existingWebProfile) {
        return next(new HttpError('No profile found against id', 422));
    }

    // Ar
    let existingArWebProfile;
    try {
        existingArWebProfile = await ArPageSection.findOne({ enId: profileId });
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error getting data from database', 500));
    };

    if (!existingArWebProfile) {
        return next(new HttpError('No profile found against id', 422));
    }

    // Nl
    let existingNlWebProfile;
    try {
        existingNlWebProfile = await NlPageSection.findOne({ enId: profileId });
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error getting data from database', 500));
    };

    if (!existingNlWebProfile) {
        return next(new HttpError('No profile found against id', 422));
    }

    existingWebProfile.about = about;
    existingArWebProfile.about = about_ar;
    existingNlWebProfile.about = about_nl;

    try {
        const session = await mongoose.startSession();
        session.startTransaction();
        await existingWebProfile.save({ session: session });
        await existingArWebProfile.save({ session: session });
        await existingNlWebProfile.save({ session: session });
        await session.commitTransaction();
    } catch (error) {
        console.log(error);
        return next(new HttpError('Cannot updating about section', 500));
    };

    res.json({ message: "About section updated successfully" });
};

const contactUpdate = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid data received', 422));
    }

    const {
        contact,
        contact_ar,
        contact_nl
    } = req.body;

    const profileId = req.params.profileId;

    let existingWebProfile;
    try {
        existingWebProfile = await PageSection.findById(profileId);
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error getting data from database', 500));
    };

    if (!existingWebProfile) {
        return next(new HttpError('No profile found against id', 422));
    }

    // Ar
    let existingArWebProfile;
    try {
        existingArWebProfile = await ArPageSection.findOne({ enId: profileId });
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error getting data from database', 500));
    };

    if (!existingArWebProfile) {
        return next(new HttpError('No profile found against id', 422));
    }

    // Nl
    let existingNlWebProfile;
    try {
        existingNlWebProfile = await NlPageSection.findOne({ enId: profileId });
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error getting data from database', 500));
    };

    if (!existingNlWebProfile) {
        return next(new HttpError('No profile found against id', 422));
    }

    existingWebProfile.contact = contact;
    existingArWebProfile.contact = contact_ar;
    existingNlWebProfile.contact = contact_nl;

    try {
        const session = await mongoose.startSession();
        session.startTransaction();
        await existingWebProfile.save({ session: session });
        await existingArWebProfile.save({ session: session });
        await existingNlWebProfile.save({ session: session });
        await session.commitTransaction();
    } catch (error) {
        console.log(error);
        return next(new HttpError('Cannot updating contact section', 500));
    };

    res.json({ message: "Contact section updated successfully" });
};

const languageUpdate = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid data received', 422));
    }

    const {
        language,
        language_ar,
        language_nl
    } = req.body;

    const profileId = req.params.profileId;

    let existingWebProfile;
    try {
        existingWebProfile = await PageSection.findById(profileId);
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error getting data from database', 500));
    };

    if (!existingWebProfile) {
        return next(new HttpError('No profile found against id', 422));
    }

    // Ar
    let existingArWebProfile;
    try {
        existingArWebProfile = await ArPageSection.findOne({ enId: profileId });
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error getting data from database', 500));
    };

    if (!existingArWebProfile) {
        return next(new HttpError('No profile found against id', 422));
    }

    // Nl
    let existingNlWebProfile;
    try {
        existingNlWebProfile = await NlPageSection.findOne({ enId: profileId });
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error getting data from database', 500));
    };

    if (!existingNlWebProfile) {
        return next(new HttpError('No profile found against id', 422));
    }

    existingWebProfile.language = language;
    existingArWebProfile.language = language_ar;
    existingNlWebProfile.language = language_nl;

    try {
        const session = await mongoose.startSession();
        session.startTransaction();
        await existingWebProfile.save({ session: session });
        await existingArWebProfile.save({ session: session });
        await existingNlWebProfile.save({ session: session });
        await session.commitTransaction();
    } catch (error) {
        console.log(error);
        return next(new HttpError('Cannot updating language section', 500));
    };

    res.json({ message: "Language section language successfully" });
};

const packageUpdate = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid data received', 422));
    }

    const {
        package,
        package_ar,
        package_nl
    } = req.body;

    const profileId = req.params.profileId;

    let existingWebProfile;
    try {
        existingWebProfile = await PageSection.findById(profileId);
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error getting data from database', 500));
    };

    if (!existingWebProfile) {
        return next(new HttpError('No profile found against id', 422));
    }

    // Ar
    let existingArWebProfile;
    try {
        existingArWebProfile = await ArPageSection.findOne({ enId: profileId });
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error getting data from database', 500));
    };

    if (!existingArWebProfile) {
        return next(new HttpError('No profile found against id', 422));
    }

    // Nl
    let existingNlWebProfile;
    try {
        existingNlWebProfile = await NlPageSection.findOne({ enId: profileId });
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error getting data from database', 500));
    };

    if (!existingNlWebProfile) {
        return next(new HttpError('No profile found against id', 422));
    }

    existingWebProfile.package = package;
    existingArWebProfile.package = package_ar;
    existingNlWebProfile.package = package_nl;

    try {
        const session = await mongoose.startSession();
        session.startTransaction();
        await existingWebProfile.save({ session: session });
        await existingArWebProfile.save({ session: session });
        await existingNlWebProfile.save({ session: session });
        await session.commitTransaction();
    } catch (error) {
        console.log(error);
        return next(new HttpError('Cannot updating package section', 500));
    };

    res.json({ message: "Package section language successfully" });
};

const footerUpdate = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid data received', 422));
    }

    const {
        footer,
        footer_ar,
        footer_nl
    } = req.body;

    const profileId = req.params.profileId;

    let existingWebProfile;
    try {
        existingWebProfile = await PageSection.findById(profileId);
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error getting data from database', 500));
    };

    if (!existingWebProfile) {
        return next(new HttpError('No profile found against id', 422));
    }

    // Ar
    let existingArWebProfile;
    try {
        existingArWebProfile = await ArPageSection.findOne({ enId: profileId });
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error getting data from database', 500));
    };

    if (!existingArWebProfile) {
        return next(new HttpError('No profile found against id', 422));
    }

    // Nl
    let existingNlWebProfile;
    try {
        existingNlWebProfile = await NlPageSection.findOne({ enId: profileId });
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error getting data from database', 500));
    };

    if (!existingNlWebProfile) {
        return next(new HttpError('No profile found against id', 422));
    }

    existingWebProfile.footer = footer;
    existingArWebProfile.footer = footer_ar;
    existingNlWebProfile.footer = footer_nl;

    try {
        const session = await mongoose.startSession();
        session.startTransaction();
        await existingWebProfile.save({ session: session });
        await existingArWebProfile.save({ session: session });
        await existingNlWebProfile.save({ session: session });
        await session.commitTransaction();
    } catch (error) {
        console.log(error);
        return next(new HttpError('Cannot updating footer text section', 500));
    };

    res.json({ message: "Footer text section language successfully" });
};

const allSections = async (req, res, next) => {
    if (req.headers.lang === 'en') {
        let existingSections;
        try {
            existingSections = await PageSection.findById('61c5d4f9dbe9259cdf13b541');
        } catch (error) {
            console.log(error);
            return next(new HttpError('Error fetching sections from database', 500));
        }

        if (!existingSections) {
            return next(new HttpError('No data found', 422));
        }

        let existingWebProfile;
        try {
            existingWebProfile = await WebProfile.findById('61b6f6e84cb6e87df531d81c');
        } catch (error) {
            console.log(error);
            return next(new HttpError('Error getting data from database', 500));
        }

        if (!existingWebProfile) {
            return next(new HttpError('No data found in database', 422));
        }

        res.json({ sections: existingSections, profileId: existingWebProfile.id, address: existingWebProfile.address, location: existingWebProfile.location, contact: existingWebProfile.contact, email: existingWebProfile.email, hours: existingWebProfile.hours });
    }
    else if (req.headers.lang === 'ar') {
        let existingArSections;
        try {
            existingArSections = await ArPageSection.findOne({ enId: '61c5d4f9dbe9259cdf13b541' });
        } catch (error) {
            console.log(error);
            return next(new HttpError('Error fetching sections from database', 500));
        }

        if (!existingArSections) {
            return next(new HttpError('No data found', 422));
        }

        let existingArWebProfile;
        try {
            existingArWebProfile = await ArWebProfile.findOne({ enId: '61b6f6e84cb6e87df531d81c' });
        } catch (error) {
            console.log(error);
            return next(new HttpError('Error fetching data from database', 500));
        };

        if (!existingArWebProfile) {
            return next(new HttpError('No ar result found against id', 422));
        }

        res.json({ sections: existingArSections, enId: existingArWebProfile.enId, profileId: existingArWebProfile.id, address: existingArWebProfile.address, location: existingArWebProfile.location, contact: existingArWebProfile.contact, email: existingArWebProfile.email, hours: existingArWebProfile.hours });
    }
    else if (req.headers.lang === 'nl') {
        let existingNlSections;
        try {
            existingNlSections = await NlPageSection.findOne({ enId: '61c5d4f9dbe9259cdf13b541' });
        } catch (error) {
            console.log(error);
            return next(new HttpError('Error fetching sections from database', 500));
        }

        if (!existingNlSections) {
            return next(new HttpError('No data found', 422));
        }

        let existingNlWebProfile;
        try {
            existingNlWebProfile = await NlWebProfile.findOne({ enId: '61b6f6e84cb6e87df531d81c' });
        } catch (error) {
            console.log(error);
            return next(new HttpError('Error fetching data from database', 500));
        };

        if (!existingNlWebProfile) {
            return next(new HttpError('No nl result found against id', 422));
        }

        res.json({ sections: existingNlSections, enId: existingNlWebProfile.enId, profileId: existingNlWebProfile.id, address: existingNlWebProfile.address, location: existingNlWebProfile.location, contact: existingNlWebProfile.contact, email: existingNlWebProfile.email, hours: existingNlWebProfile.hours });
    }
    else {
        return next(new HttpError('Invalid or no header found in request', 422));
    }
};

const updateEmailTemplate = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid data received', 422));
    }

    const templateText = req.body;

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

    existingEmailTemplate.templateText = templateText.templateText;

    try {
        await existingEmailTemplate.save();
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error saving data to database', 500));
    }

    res.json({ message: "Email template updated successfully" });

};

const getEmailTemplate = async (req, res, next) => {
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

    res.json({ email_template: existingEmailTemplate.toObject({ getters: true }) });
};

exports.getUsers = getUsers;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
exports.createPackage = createPackage;
exports.createUser = createUser;
exports.deletePackage = deletePackage;
exports.adminLogin = adminLogin;
exports.adminUpdatePassword = adminUpdatePassword;
exports.adminUpdateProfile = adminUpdateProfile;
exports.adminUserBlock = adminUserBlock;
exports.activePackage = activePackage;
exports.userSubscriptionDetails = userSubscriptionDetails;
exports.activePaymentMethod = activePaymentMethod;
exports.allPayments = allPayments;
exports.updateWebProfile = updateWebProfile;
exports.webProfile = webProfile;
exports.editPackage = editPackage;
exports.resetUserPassword = resetUserPassword
exports.heroUpdate = heroUpdate;
exports.aboutUpdate = aboutUpdate;
exports.contactUpdate = contactUpdate;
exports.languageUpdate = languageUpdate;
exports.packageUpdate = packageUpdate;
exports.footerUpdate = footerUpdate;
exports.allSections = allSections;
exports.updateEmailTemplate = updateEmailTemplate;
exports.getEmailTemplate = getEmailTemplate;
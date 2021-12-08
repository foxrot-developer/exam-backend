const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const stripe = require('stripe')('sk_test_51K3gR8GptmPxUZeMVyiVoakC2tYzXDict6ZdlvauzE4cDDK57MuBGQ9IHoZNDIlMJCOSpZUwEd7x8VXGzIKPjOKb00hz7QBzvB');

const HttpError = require('../../helpers/http-error');
const User = require('../../models/user');
const Package = require('../../models/package');
const userSubscription = require('../../models/user-subscription');
const Admin = require('../../models/admin');

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

    let existingPlan;
    try {
        existingPlan = await stripe.plans.del(
            existingPackage.planid
        );
    } catch (error) {
        return next(new HttpError('Stripe deletion error', 500));
    };

    if (!existingPlan) {
        return next(new HttpError('Cannot delete plan', 500));
    }

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
        await existingPackage.remove();
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

    try {
        await existingUser.remove();
    } catch (error) {
        return next(new HttpError('Error deleting user', 500));
    }

    res.status(200).json({ message: 'User deleted successfully' });
};

const createPackage = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new HttpError('Invalid data received from frontend!', 422);
    }

    const { package_name, price, description, duration } = req.body;

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
            amount: price,
            currency: 'eur',
            interval: duration,
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
        productid: product.id
    });

    try {
        await newPackage.save();
    } catch (error) {
        return next(new HttpError('Cannot create new package', 500));
    };

    res.status(201).json({ newPackage });
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

    const newUser = new User({
        username,
        email,
        password: hashedPassword,
        packageId,
        freeAccess: true,
        block: false,
        customerId: '',
        specialCode,
        subscriptionid: ''
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
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const HttpError = require('../../helpers/http-error');
const User = require('../../models/user');
const Package = require('../../models/package');

const signup = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid data received', 422));
    }

    const { username, email, password } = req.body;

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
        password: hashedPassword
    });

    try {
        await newUser.save();
    } catch (error) {
        return next(new HttpError('Cannot create user. Try again', 500));
    }

    res.status(201).json({ userId: newUser.id, email: newUser.email, username: newUser.username })
};

const login = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid data received', 422));
    }

    const { email, password } = req.body;

    let existingUser;
    try {
        existingUser = await User.findOne({ email: email });
    } catch (error) {
        return next(new HttpError('Error fetching user', 500));
    }

    if (!existingUser) {
        return next(new HttpError('Invalid email', 422));
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

exports.signup = signup;
exports.login = login;
exports.getPackages = getPackages;
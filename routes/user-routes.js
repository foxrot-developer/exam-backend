const express = require('express');
const { check } = require('express-validator');

const userController = require('../controllers/user-controller');

const router = express.Router();

router.get('/', userController.getUsers);

router.post('/signup', [
    check('username').not().isEmpty(),
    check('email').normalizeEmail().isEmail(),
    check('password').isLength({ min: 8 })
], userController.signup);

router.post('/login', [
    check('email').normalizeEmail().isEmail(),
    check('password').not().isEmpty().isLength({ min: 8 })
], userController.login);

module.exports = router;
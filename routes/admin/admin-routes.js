const express = require('express');
const { check } = require('express-validator');

const adminController = require('../../controllers/admin/admin-controller');

const router = express.Router();

router.get('/all-users', adminController.getUsers);

router.patch('/update-user/:userId', [
    check('username').not().isEmpty(),
    check('email').normalizeEmail().isEmail(),
], adminController.updateUser);

module.exports = router;
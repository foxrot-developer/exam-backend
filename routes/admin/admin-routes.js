const express = require('express');
const { check } = require('express-validator');

const adminController = require('../../controllers/admin/admin-controller');

const router = express.Router();

router.get('/all-users', adminController.getUsers);

router.patch('/update-user/:userId', [
    check('username').not().isEmpty(),
    check('email').normalizeEmail().isEmail(),
], adminController.updateUser);

router.delete('/delete-user/:userId', adminController.deleteUser);

router.delete('/delete-package/:pkgId', adminController.deletePackage);

router.post('/create-package', [
    check('package_name').not().isEmpty(),
    check('price').not().isEmpty(),
    check('description').not().isEmpty(),
    check('duration').not().isEmpty(),
], adminController.createPackage);

router.post('/register-user', [
    check('username').not().isEmpty(),
    check('packageId').not().isEmpty(),
    check('specialCode').not().isEmpty(),
    check('email').normalizeEmail().isEmail(),
    check('password').isLength({ min: 8 })
], adminController.createUser);

module.exports = router;
const express = require('express');
const { check } = require('express-validator');

const adminController = require('../../controllers/admin/admin-controller');
const admin = require('../../models/admin');

const router = express.Router();

router.get('/all-users', adminController.getUsers);

router.get('/user-subscription/:userId', adminController.userSubscriptionDetails);

router.get('/all-payments', adminController.allPayments);

router.get('/web-profile/:profileId', adminController.webProfile);

router.patch('/update-user/:userId', [
    check('username').not().isEmpty(),
    check('email').normalizeEmail().isEmail(),
], adminController.updateUser);

router.delete('/delete-user/:userId', adminController.deleteUser);

router.delete('/delete-package/:pkgId', adminController.deletePackage);

router.post('/create-package', [
    check('package_name').not().isEmpty(),
    check('package_name_ar').not().isEmpty(),
    check('package_name_nl').not().isEmpty(),
    check('price').not().isEmpty(),
    check('price_ar').not().isEmpty(),
    check('price_nl').not().isEmpty(),
    check('description').not().isEmpty(),
    check('description_ar').not().isEmpty(),
    check('description_nl').not().isEmpty(),
    check('duration').not().isEmpty(),
    check('duration_ar').not().isEmpty(),
    check('duration_nl').not().isEmpty(),
    check('no_exam').not().isEmpty(),
    check('repeat').not().isEmpty(),
    check('langs').not().isEmpty(),
    check('langs_ar').not().isEmpty(),
    check('langs_nl').not().isEmpty(),
], adminController.createPackage);

router.patch('/edit-package/:pkgId', [
    check('package_name').not().isEmpty(),
    check('package_name_ar').not().isEmpty(),
    check('package_name_nl').not().isEmpty(),
    check('price').not().isEmpty(),
    check('description').not().isEmpty(),
    check('description_ar').not().isEmpty(),
    check('description_nl').not().isEmpty(),
    check('duration').not().isEmpty(),
    check('duration_ar').not().isEmpty(),
    check('duration_nl').not().isEmpty(),
    check('no_exam').not().isEmpty(),
    check('repeat').not().isEmpty(),
    check('langs').not().isEmpty(),
], adminController.editPackage);

router.post('/register-user', [
    check('username').not().isEmpty(),
    check('packageId').not().isEmpty(),
    check('specialCode').not().isEmpty(),
    check('email').normalizeEmail().isEmail(),
    check('password').isLength({ min: 8 })
], adminController.createUser);

router.post('/login', [
    check('email').normalizeEmail().isEmail(),
    check('password').not().isEmpty().isLength({ min: 8 })
], adminController.adminLogin);

router.patch('/update-web-profile/:profileId', adminController.updateWebProfile);

router.patch('/update-password/:adminId', [
    check('oldPassword').not().isEmpty(),
    check('newPassword').not().isEmpty()
], adminController.adminUpdatePassword);

router.patch('/update-profile/:adminId', [
    check('name').not().isEmpty(),
    check('email').normalizeEmail().isEmail(),
], adminController.adminUpdateProfile);

router.patch('/block-user/:userId', [
    check('block').not().isEmpty().isBoolean()
], adminController.adminUserBlock);

router.patch('/active-package/:pkgId', [
    check('active').not().isEmpty().isBoolean()
], adminController.activePackage);

router.patch('/active-payment/:payId', [
    check('active').not().isEmpty().isBoolean()
], adminController.activePaymentMethod);

module.exports = router;
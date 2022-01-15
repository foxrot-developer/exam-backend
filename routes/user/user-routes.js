const express = require('express');
const { check } = require('express-validator');

const userController = require('../../controllers/user/user-controller');

const router = express.Router();

router.get('/all-packages', userController.getPackages);

router.get('/user-details/:userId', userController.getUserDetails);

router.post('/signup', [
    check('username').not().isEmpty(),
    check('packageId').not().isEmpty(),
    check('paymentMethod').not().isEmpty(),
    check('email').normalizeEmail().isEmail(),
    check('password').isLength({ min: 8 })
], userController.signup);

router.post('/ideal-signup', [
    check('packageId').not().isEmpty(),
    check('email').normalizeEmail().isEmail()
], userController.idealSignup);

router.post('/ideal-user', [
    check('username').not().isEmpty(),
    check('packageId').not().isEmpty(),
    check('email').normalizeEmail().isEmail(),
    check('password').isLength({ min: 8 })
], userController.createIdealUser);

router.post('/login', [
    check('email').normalizeEmail().isEmail(),
    check('password').not().isEmpty().isLength({ min: 8 })
], userController.login);

router.post('/exam-enrollment', [
    check('examId').not().isEmpty(),
    check('userId').not().isEmpty(),
    check('lang').not().isEmpty()
], userController.examEnrollment);

router.patch('/change-password/:userId', [
    check('oldPassword').not().isEmpty(),
    check('newPassword').not().isEmpty()
], userController.changePassword);

router.patch('/forget-password', [
    check('email').normalizeEmail().isEmail(),
    check('password').not().isEmpty().isLength({ min: 8 })
], userController.userForgetPassword);

module.exports = router;
const express = require('express');
const { check } = require('express-validator');

const router = express.Router();
const userSubscriptionController = require('../../controllers/user/user-subscription-controller');

router.post('/create-subscription', [
    check('currency').not().isEmpty(),
    check('value').not().isEmpty(),
    check('name').not().isEmpty(),
    check('email').not().isEmpty(),
], userSubscriptionController.createUserSubscription);

module.exports = router;
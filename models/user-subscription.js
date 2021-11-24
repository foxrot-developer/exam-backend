const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const userSubscription = new Schema({
    customer: { type: Object, required: true },
    subscription: { type: Object, required: true },
    user: { type: mongoose.Types.ObjectId, required: true, ref: 'User' }
});

userSubscription.plugin(uniqueValidator);

module.exports = mongoose.model('User Subscription', userSubscription);
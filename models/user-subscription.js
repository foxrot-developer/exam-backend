const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const userSubscription = new Schema({
    subscription: { type: Object, required: true },
    user: { type: String },
    package: { type: mongoose.Types.ObjectId, required: true, ref: 'Package' },
    subscriptionid: { type: String }
});

// userSubscription.plugin(uniqueValidator);

module.exports = mongoose.model('User Subscription', userSubscription);
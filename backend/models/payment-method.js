const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const paymentMethodSchema = new Schema({
    name: { type: String, required: true },
    active: { type: Boolean, required: true },
});

// userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Payment Method', paymentMethodSchema);
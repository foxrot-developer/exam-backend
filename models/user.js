const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 8 },
    packageId: { type: mongoose.Types.ObjectId, required: true, ref: 'Package' },
    freeAccess: { type: Boolean, required: true },
    block: { type: Boolean, required: true },
    customerId: { type: String },
    specialCode: { type: String, required: true },
    subscriptionid: { type: String }
});

// userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);
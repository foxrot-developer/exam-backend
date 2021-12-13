const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const nlWebProfileSchema = new Schema({
    enId: { type: String, required: true },
    address: { type: String, required: true },
    contact: { type: String, required: true },
    location: { type: String, required: true }
});

// userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Nl Web Profile', nlWebProfileSchema);
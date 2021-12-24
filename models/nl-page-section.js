const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const nlPageSectionSchema = new Schema({
    enId: { type: String, required: true },
    about: { type: String, required: true },
    contact: { type: String, required: true },
    hero: { type: String, required: true },
    language: { type: String, required: true },
    package: { type: String, required: true },
});

// userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Nl Page Section', nlPageSectionSchema);
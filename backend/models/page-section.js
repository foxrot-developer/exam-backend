const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const pageSectionSchema = new Schema({
    about: { type: String, required: true },
    contact: { type: String, required: true },
    hero: { type: String, required: true },
    language: { type: String, required: true },
    package: { type: String, required: true },
    footer: { type: String, required: true },
});

// userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Page Section', pageSectionSchema);
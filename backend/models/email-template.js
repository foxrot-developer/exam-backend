const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const emailTemplateSchema = new Schema({
    templateText: { type: String, required: true }
});

// userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Email Template', emailTemplateSchema);
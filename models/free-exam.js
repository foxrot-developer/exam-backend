const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const freeExamSchema = new Schema({
    question: { type: String, required: true },
    answer: { type: String, required: true },
    options: { type: Array, required: true },
    part: { type: String, required: true }
});

// freeExamSchema.plugin(uniqueValidator);
module.exports = mongoose.model('Free', freeExamSchema);
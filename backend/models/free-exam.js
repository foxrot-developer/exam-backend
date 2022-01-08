const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const freeExamSchema = new Schema({
    examId: { type: String, required: true },
    part1: { type: String, required: true },
    part2: { type: String, required: true },
    part3: { type: String, required: true },
});

// freeExamSchema.plugin(uniqueValidator);
module.exports = mongoose.model('Free', freeExamSchema);
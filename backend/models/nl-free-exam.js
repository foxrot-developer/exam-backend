const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const nlFreeExamSchema = new Schema({
    enId: { type: String, required: true },
    examId: { type: String, required: true },
    part1: { type: String, required: true },
    part2: { type: String, required: true },
    part3: { type: String, required: true },
});

// freeExamSchema.plugin(uniqueValidator);
module.exports = mongoose.model('Nl Free', nlFreeExamSchema);
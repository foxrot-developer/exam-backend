const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const paidExamQuestionSchema = new Schema({
    question: { type: String, required: true },
    questionImage: { type: String, required: true },
    answer: { type: String, required: true },
    options: { type: String, required: true },
    part: { type: String, required: true },
    reason: { type: String },
    draggable: { type: Boolean, required: true },
});

// freeExamSchema.plugin(uniqueValidator);
module.exports = mongoose.model('Paid Exam Question', paidExamQuestionSchema);
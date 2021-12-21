const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const nlPaidExamQuestionSchema = new Schema({
    enId: { type: String, required: true },
    question: { type: String, required: true },
    questionImage: { type: String, required: true },
    answer: { type: String, required: true },
    options: { type: String, required: true },
    part: { type: String, required: true },
    draggable: { type: Boolean, required: true },
});

// freeExamSchema.plugin(uniqueValidator);
module.exports = mongoose.model('Nl Paid Exam Question', nlPaidExamQuestionSchema);
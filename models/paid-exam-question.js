const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const paidExamQuestionSchema = new Schema({
    question: { type: String, required: true },
    questionImage: { type: String, required: true },
    answer: { type: String, required: true },
    options: { type: String, required: true },
    part: { type: String, required: true },
    examId: { type: mongoose.Types.ObjectId, required: true, ref: 'Paid Exam' }
});

// freeExamSchema.plugin(uniqueValidator);
module.exports = mongoose.model('Paid Exam Question', paidExamQuestionSchema);
const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const examAllocationSchema = new Schema({
    examId: { type: mongoose.Types.ObjectId, required: true, ref: 'Paid Exam' },
    part1: { type: String, required: true },
    part2: { type: String, required: true },
    part3: { type: String, required: true },
});

// freeExamSchema.plugin(uniqueValidator);
module.exports = mongoose.model('Question Allocation', examAllocationSchema);
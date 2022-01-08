const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const arExamAllocationSchema = new Schema({
    enId: { type: String, required: true },
    examId: { type: mongoose.Types.ObjectId, required: true, ref: 'Ar Paid Exam' },
    part1: { type: String, required: true },
    part2: { type: String, required: true },
    part3: { type: String, required: true },
});

// freeExamSchema.plugin(uniqueValidator);
module.exports = mongoose.model('Ar Question Allocation', arExamAllocationSchema);
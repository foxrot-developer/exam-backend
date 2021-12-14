const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const arPaidExamSchema = new Schema({
    enId: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true }
});

// freeExamSchema.plugin(uniqueValidator);
module.exports = mongoose.model('Ar Paid Exam', arPaidExamSchema);
const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const nlPaidExamSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: true }
});

// freeExamSchema.plugin(uniqueValidator);
module.exports = mongoose.model('Nl Paid Exam', nlPaidExamSchema);
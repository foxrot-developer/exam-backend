const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const resultSchema = new Schema({
    userId: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
    results: [{ type: Object, required: true }]
});

// userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Result', resultSchema);
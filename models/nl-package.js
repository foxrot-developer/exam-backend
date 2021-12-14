const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const nlPackageSchema = new Schema({
    enId: { type: String, required: true },
    package_name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, required: true },
    duration: { type: String, required: true },
    active: { type: Boolean, required: true },
    planid: { type: String, required: true },
    productid: { type: String, required: true },
    no_exam: { type: Number, required: true },
    repeat: { type: Number, required: true },
});

module.exports = mongoose.model('Nl Package', nlPackageSchema);
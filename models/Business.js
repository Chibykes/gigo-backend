const mongoose = require('mongoose');
const Schema = require('mongoose').Schema;

const BusinessSchema = new Schema({
    id: { type: String, uppercase: true },
    name: { type: String },
    address: { type: String },
    phone: { type: String },
    expiryDate: { type: String }
}, { timestamps: true })

module.exports = mongoose.model('businesses', BusinessSchema);
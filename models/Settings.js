const mongoose = require('mongoose');
const Schema = require('mongoose').Schema;

const SettingsSchema = new Schema({
    name: { type: String },
    address: { type: String },
    phone: { type: String },
    expiryDate: { type: String }
}, { timestamps: true })

module.exports = mongoose.model('settings', SettingsSchema);
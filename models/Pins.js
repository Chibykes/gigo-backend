const mongoose = require('mongoose');
const Schema = require('mongoose').Schema;

const PinsSchema = new Schema({
    pin: { type: String },
    days: { type: Number }
}, { timestamps: true })

module.exports = mongoose.model('pins', PinsSchema);
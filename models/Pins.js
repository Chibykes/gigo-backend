const mongoose = require('mongoose');
const Schema = require('mongoose').Schema;

const PinsSchema = new Schema({
    business: { type: Schema.Types.ObjectId, ref: 'Business' },
    pin: { type: String, uppercase: true },
    days: { type: Number }
}, { timestamps: true })

module.exports = mongoose.model('pins', PinsSchema);
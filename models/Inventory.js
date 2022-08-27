const mongoose = require('mongoose');
const Schema = require('mongoose').Schema;
const Business = require('../models/Business');

const InventorySchema = new Schema({
    id: { type: String, uppercase: true },
    business: { type: Schema.Types.ObjectId, ref: Business },
    name: { type: String, lowercase: true },
    qty: { type: Number, lowercase: true },
    unit: { type: String, lowercase: true },
    cost_price: { type: Number },
    selling_price: { type: Number },
}, { timestamps: true })

module.exports = mongoose.model('inventories', InventorySchema);
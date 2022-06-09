const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TransactionsSchema = new Schema({
    id: {type: String, uppercase: true},
    type: {type: String, lowercase: true},
    category: {type: String, lowercase: true},
    customer_name: {type: String, lowercase: true},
    customer_phone: {type: String, lowercase: true},
    sales: {type: Array},
    amount: {type: Number},
    balance: {type: Number},
    description: {type: String},
    reference: {type: String},
    creator: { type: Object },
}, { timestamps: true })

module.exports = mongoose.model('transactions', TransactionsSchema);
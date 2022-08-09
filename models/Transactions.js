const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Business = require('./Business');
const Admins = require('./Admins');

const TransactionsSchema = new Schema({
    id: {type: String, uppercase: true},
    type: {type: String, lowercase: true},
    category: {type: String, lowercase: true},
    customer_name: {type: String, lowercase: true},
    customer_phone: {type: String, lowercase: true},
    sales: {type: Array},
    amount: {type: Number},
    balance: {type: Number},
    discount: {type: Number},
    description: {type: String},
    reference: {type: String},
    payment_method: {type: String},
    business: { type: Schema.Types.ObjectId, ref: Business },
    initiator: { type: Schema.Types.ObjectId, ref: Admins },
    debt_resolver: { type: Schema.Types.ObjectId, ref: Admins },
}, { timestamps: true })

module.exports = mongoose.model('transactions', TransactionsSchema);
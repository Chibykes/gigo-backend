const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Business = require('./Business');
const Admins = require('./Admins');
const Inventory = require('./Inventory');
const Transactions = require('./Transactions');

const HistorySchema = new Schema({
    id: {type: String, uppercase: true},
    section: {type: String, lowercase: true},
    action: {type: String, lowercase: true},
    oldData: {type: Object},
    newData: {type: Object},
    business: { type: Schema.Types.ObjectId, ref: Business },
    product: { type: Schema.Types.ObjectId, ref: Inventory },
    staff: { type: Schema.Types.ObjectId, ref: Admins },
    transaction: { type: Schema.Types.ObjectId, ref: Transactions },
    initiator: { type: Schema.Types.ObjectId, ref: Admins },
}, { timestamps: true })

module.exports = mongoose.model('historys', HistorySchema);
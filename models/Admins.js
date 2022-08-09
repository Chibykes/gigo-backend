const mongoose = require('mongoose');
const Schema = require('mongoose').Schema;
const Business = require('./Business');

const AdminSchema = new Schema({
    id: {type: String, uppercase: true},
    name: {type: String, lowercase: true},
    username: {type: String, lowercase: true},
    password: {type: String},
    role: {type: String},
    img: { type: String },
    business: { type: Schema.Types.ObjectId, ref: Business },
}, { timestamps: true })

module.exports = mongoose.model('admins', AdminSchema);
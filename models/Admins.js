const mongoose = require('mongoose');
const Schema = require('mongoose').Schema;

const AdminSchema = new Schema({
    id: {type: String, uppercase: true},
    name: {type: String, lowercase: true},
    username: {type: String, lowercase: true},
    password: {type: String},
    img: { type: String }
}, { timestamps: true })

module.exports = mongoose.model('admins', AdminSchema);
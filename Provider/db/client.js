'use strict';

var bcrypt = require('bcrypt-nodejs');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Client = new Schema({
    id: String,
 	name: String,
    clientId: String,
    uri: String,
    password: String,
    isTrusted: Boolean
});

Client.methods.generateHash = function (password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(9), null);
}

Client.methods.isValidPassword = function (password) {
    return bcrypt.compareSync(password, this.password);
}

module.exports = mongoose.model('Client', Client);

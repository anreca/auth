'use strict';


var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var AuthoritzationCode = new Schema({
    code: String,
    clientId: String,
    redirectUri: String,
    userId: String,
    scope: String
});

module.exports = mongoose.model('AuthoritzationCode', AuthoritzationCode);

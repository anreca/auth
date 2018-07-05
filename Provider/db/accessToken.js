'use strict';

var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var AccessToken = new Schema({
    userId: String,
    clientId: String,
    token: String,
    scope: String
});

module.exports = mongoose.model('AccessToken', AccessToken);

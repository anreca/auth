'use strict'

var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var Schema = mongoose.Schema;

var User = new Schema({
	id: String,
	firstName: String,
	lastName: String,
	username: String,
	password: String,
    token: String,
    createdAt: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date
});

User.methods.generateHash = function(password){
      return bcrypt.hashSync(password, bcrypt.genSaltSync(9), null);
}

User.methods.isValidPassword = function(password){
	return bcrypt.compareSync(password, this.password);
}

module.exports = mongoose.model('User', User);

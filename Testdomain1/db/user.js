var mongoose = require('mongoose');

var Schema = mongoose.Schema;

//usuario creado para serializar y deserializar la sesion
var User = new Schema({
  id: String,
  accessToken: String,
  refreshToken: String,
  name: String
});

module.exports = mongoose.model('User', User);

'use strict';


var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var ProtectedResource = new Schema({
    beach: {
        nombre: String,
        ciudad: String,
        comunidad: String,
        longitud: Number,
        nudista: String,
        userid: String
    }
});

module.exports = mongoose.model('ProtectedResource', ProtectedResource);

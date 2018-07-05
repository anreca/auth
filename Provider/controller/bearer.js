const BearerStrategy = require('passport-http-bearer').Strategy;

const Client = require('../db/client');
const User = require('../db/user');
const AccessToken = require('../db/accessToken');

/*
 * Modulo de la estrategia Bearer para la autenticacion de clientes y usuarios 
 * a partir del token de acceso. 
 * @method exports
 * @param {} passport
 * @return 
 */
module.exports = function (passport) {


};

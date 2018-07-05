'use strict';

const passport = require('passport');
const bCrypt = require('bcrypt-nodejs');
const Client = require('../db/client');

module.exports.info = [
    passport.authenticate('bearer', { session: false }), function (request, response) {
        console.log('Info endpoint');
        response.json({ client_id: request.user.id, name: request.user.firstName, scope: request.authInfo.scope });
    }
];

/*
 * Ruta del formulario de registro de clientes  en el sistema.
 * @method clientSignupForm
 * @param {} request
 * @param {} response 
 */
module.exports.clientSignupForm = function (request, response) {
    response.render('clientSignup', { message: request.flash('signupMessage') });
};

module.exports.clientSignup = passport.authenticate('client-signup', {
    successReturnToOrRedirect: '/',
    failureRedirect: '/clientSignup',
    failureFlash: true
});

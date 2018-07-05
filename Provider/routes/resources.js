'use strict';

const passport = require('passport');

const ProtectedResource = require('../db/resource');

/* Endpoint de acceso a los recursos a traves de un token de acceso.
 */
module.exports.protectedResources = [
    passport.authenticate('bearer', { session: false }), function (request, response) {
        console.log('Endpoint resources');
        ProtectedResource.find({ 'beach.userid': 'DBV5BtSP7TywrkgU' }, function (err, beach) {
            if (err) return response.send(err);
            response.json(beach);
        });
    }
];

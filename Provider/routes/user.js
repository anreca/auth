'use strict';

const passport = require('passport');

//Endpoint para obtener de los datos del usuario
module.exports.info = [
    passport.authenticate('bearer', { session: false }),
    function (request, response) {
        console.log('exports user info: user.id, firstName, scope');
        console.log('exports user info:', request.user.id, request.user.firstName, request.authInfo.scope);
        response.json({
            user_id: request.user.id,
            name: request.user.firstName,
            scope: request.authInfo.scope
        });
    }
];

//Endpoint para obtener de los datos del usuario
module.exports.personaldata = [
    passport.authenticate('bearer', { session: false }),
    ensureValidToken("personaldata"),
    function (req, res) {
        res.json(req.user)
    }
]

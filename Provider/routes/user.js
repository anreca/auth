'use strict';

const passport = require('passport');

//Endpoint de obtencio de los datos del usuario
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

module.exports.personaldata = [
    passport.authenticate('bearer', { session: false }),
    ensureValidToken("personaldata"),

    function (req, res) {
        res.json(req.user)
    }
]

function ensureValidToken(scope) {
    return function (req, res, next) {
        console.log("ensureScope[" + scope + "], req.authInfo=", req.authInfo);
        console.log("req.user=", req.user);
        next();
    };
}
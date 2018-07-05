
/*
 * Modulo de registro de clientes(consumers) en el sistema a partir del formulario de registro.
 * @method exports
 * @param {} passport
 * @return
 */
module.exports = function (passport) {

    passport.use('client-signup', new LocalStrategy({
        usernameField: 'id',
        passwordField: 'password',
        passReqToCallback: true
    },
    function (req, id, password, done) {
        process.nextTick(function () {
            Client.findOne({ 'id': id }, function (err, client) {
                if (err) {
                    return done(err);
                }
                else if (client) {
                    return done(null, false, req.flash('signupMessage', 'La id del cliente ya esta en uso.'));
                }
                else {
                    var newClient = new Client();
                    newClient.id = utils.getUid(16);
                    newClient.name = req.body.name;
                    newClient.clientId = id;
                    newClient.uri = req.body.uri;
                    newClient.password = req.body.password;
                    newClient.isTrusted = false;
                    newClient.password = newClient.generateHash(password);
                    newClient.save(function (err) {
                        return done(null, newClient);
                    });
                }
            });
        });
    }));
};

const LocalStrategy = require('passport-local').Strategy;
const User = require('../db/user');
const bCrypt = require('bcrypt-nodejs');
const utils = require('../utils');

/*
 * Modulo de registro de usuarios en el sistema a partir de los datos proporcionados
 * en el formulario de registro de usuarios.
 * @method exports
 * @param {} passport
 * @return 
 */
module.exports = function (passport) {



    passport.use('local-signup', new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
    },
    function (req, email, password, done) {
        //funcion asincrona
        console.log("userSignup Strategy");
        process.nextTick(function () {
            //busqueda del usuario en la base de datos segun el email proporcionado
            User.findOne({ 'username': email }, function (err, user) {
                //si se produce un error, devuelve el error de conexion con la bbdd
                if (err) return done(err);
                //si ya existe un usuario con el email, devuelve mensaje flash.
                else if (user) return done(null, false, req.flash('signupMessage', 'El email ya esta en uso'));
                //si no existe un usuario y no hay error, crea el usuario en la bbdd
                else {
                    var newUser = new User();
                    newUser.id = utils.getUid(16);
                    newUser.firstName = req.body.firstName;
                    newUser.lastName = req.body.lastName;
                    newUser.username = email;
                    newUser.password = newUser.generateHash(password);
                    newUser.createdAt = Date();
                    newUser.save(function (err) {
                        return done(null, newUser);
                    });
                }
            });
        });
    }));
};

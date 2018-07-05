'use strict';

const passport = require('passport');
const BearerStrategy = require('passport-http-bearer').Strategy;
const BasicStrategy = require('passport-http').BasicStrategy;
const ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const bCrypt = require('bcrypt-nodejs');

const config = require('../config/config');
const Client = require('../db/client');
const AccessToken = require('../db/accessToken');
const User = require('../db/user');
const utils = require('../utils');

/*
 * Modulo de inicializacion de las estrategias de autenticacion.
 * @method exports
 * @param {} passport
 * @return
 */
passport.use('local', new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
    },
    function (req, email, password, done) {
        console.log("userLogin Strategy");
        //busqueda del usuario en la base de datos segun el email proporcionado
        User.findOne({ 'username': email }, function (err, user) {
            //si se produce un error, devuelve el error de conexion con la bbdd
            if (err) {
                console.log(err);
                return done(err);
            }
            //si no existe un usuario con el email, devuelve mensaje flash.
            if (!user) {
                return done(null, false, req.flash('loginMessage', 'Datos no validos.'));
            }
            //si la contrase�a proporcionada es incorrecta, devuelve mensaje flash.
            if (!user.isValidPassword(password)) {
                return done(null, false, req.flash('loginMessage', 'Datos no validos.'));
            }
            //si existe un usuario y la contrase�a es correcta, devuelve el usuario.
            return done(null, user);
        });
    }));

    passport.serializeUser(function (user, done) {
        console.log('serializeuser');
        console.log(user);
        done(null, user.id);
    });

    passport.deserializeUser(function (id, done) {
        User.findOne({ 'id': id }, function (err, user) {
            console.log('deserializeuser');
            console.log(user);
            done(err, user);
        });
    });

    // Modulo de la estrategia Bearer para la autenticacion de clientes y usuarios
    // a partir del token de acceso.
    passport.use(new BearerStrategy(
        function (accessToken, done) {
            console.log('BearerStrategy');
            AccessToken.findOne({ 'token': accessToken }, function (err, token) {
                if (err) return done(err);
                if (!token) return done(null, false);
                if (token.userId) {
                    User.findOne({ 'id': token.userId }, function (err, user) {
                        if (err) return done(err);
                        if (!user) return done(null, false);
                        var data = { scope: token.scope }
                        console.log('tokeninfo scope');
                        console.log(token.scope);

                        done(null, user, data);
                    });
                } else {
                    Client.findOne({ 'clientId': token.clientId }, function (err, client) {
                        if (err) return done(err);
                        if (!client) return done(null, false);
                        done(null, client, { scope: '*' });
                    });
                }
            });
   }));


   //Modulo de inicio de sesion de clientes
    passport.use(new BasicStrategy(
        function (clientId, password, done) {
            console.log("basicstrategy clientlogin")
            Client.findOne({ 'clientId': clientId }, function (err, client) {
                if (err) return done(err);
                if (!client) return done(null, false);
                if (!client.isValidPassword(password)) return done(null, false);
                return done(null, client);
            });
        }
    ));
    //Modulo de inicio de sesion de clientes
    passport.use(new ClientPasswordStrategy(
    function (clientId, clientSecret, done) {
        console.log("clientpasswordstrategy")
        Client.findOne({ 'clientId': clientId }, function (err, client) {
            if (err) return done(err);
            if (!client) return done(null, false);
            if (!client.isValidPassword(clientSecret)) return done(null, false);
            return done(null, client);
        });
    }
    ));

    //Modulo de registro de aplicaciones cliente.
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

    //Modulo de autenticación de usuarios via Facebook
    passport.use('facebook', new FacebookStrategy({
        clientID: config.facebook.clientID,
        clientSecret: config.facebook.clientSecret,
        callbackURL: config.facebook.callbackURL
    },
        // facebook devuelve el token y el perfil del usuario de facebook
        function (accessToken, refreshToken, profile, done) {
            //funcion asincrona
            console.log("Facebook Strategy");
            process.nextTick(function () {
                //busqueda del usuario en la base de datos segun la id en facebook
                User.findOne({ 'id': profile.id }, function (err, user) {
                    //si se produce un error, devuelve el error de conexion con la bbdd
                    if (err) return done(err);
                    //si existe un usuario, devuelve el usuario
                    if (user) return done(null, user);
                    //si no existe un usuario con la id, crea el usuario en la bbdd
                    else {
                        var newUser = new User();
                        newUser.id = profile.id;
                        newUser.firstName = profile.displayName;
                        newUser.token = accessToken;
                        newUser.createdAt = Date();

                        newUser.save(function (err) {
                            //en caso de no poder guardar el usuario, devuelve error
                            if (err) return done(err);
                            //en caso de poder guardar el usuario, devuelve el usuario
                            return done(null, newUser);
                        });
                    }
                });
            });
        }));

    // Modulo de registro de usuario a partir del formulario
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

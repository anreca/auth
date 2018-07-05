'use strict';

const passport = require('passport');

const site = require('./site');
const oauth2 = require('./oauth2');
const user = require('./user');
const client = require('./client');
const resources = require('./resources');

const ProtectedResource = require('../db/resource');

/*
 * Definicion de las rutas del sistema.
 * @method exports
 * @param {} router
 * @param {} passport
 * @return router
 */
module.exports = function (router, passport) {

    router.get('/', site.index);
    //portal de login
    router.get('/login', site.loginForm);
    router.post('/login', site.login);
    //gestion de cerrar sesion del usuario
    router.get('/logout', site.logout);
    // acceso a los datos del usaurio
    router.get('/account', site.account);
    //registro de usuario
    router.get('/signup', site.signupForm);
    router.post('/signup', site.signup);
    //inicio de sesion mediante facebook
    router.get('/facebook', site.facebook);
    router.get('/facebook/callback', site.facebookCallback);
    //recuperacion de contraseña
    router.get('/forgot', site.forgotForm);
    router.post('/forgot', site.forgot);

    //gestión de la transacción oauth2 con las aplicaciones cliente
    router.get('/auth/oauth2/authorize', oauth2.authorization);
    router.post('/auth/oauth2/authorize/decision', oauth2.decision);
    router.post('/auth/oauth2/token', oauth2.token);

    //api de acceso a los recusos protegidos
    router.get('/api/userinfo', user.info);
    router.get('/api/personaldata', user.personaldata);
    router.get('/resourcesignup', function (req, res) {
        res.render('protectedresources');
    });
    router.get('/api/protectedresources', resources.protectedResources);
    router.get('/api/clientinfo', client.info);

    //registro de aplicaciones cliente
    router.get('/clientsignup', client.clientSignupForm);
    router.post('/clientsignup', client.clientSignup);

    return router;
};

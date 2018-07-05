'use strict';

const passport = require('passport');

var async = require('async');
var crypto = require('crypto');
var bcrypt = require('bcrypt-nodejs');
var nodemailer = require('nodemailer');
var Oauth2 = require('oauth2');
const config = require('../config/config');

const site = require('./site');
const oauth2 = require('./oauth2');

const user = require('./user');
const client = require('./client');
const resources = require('./resources');
const User = require('../db/user');


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
    router.get('/login', site.loginForm);
    router.post('/login', site.login);
    router.get('/logout', site.logout);
    router.get('/account', site.account);
    router.get('/signup', site.signupForm);
    router.post('/signup', site.signup);
    router.get('/facebook', site.facebook);
    router.get('/facebook/callback', site.facebookCallback);

    /* Get forgot password */
    router.get('/forgot', function (req, res) {
        res.render('forgot', {
            user: req.user
        });
    });

    router.post('/forgot', function (req, res, next) {
        async.waterfall([
            function (done) {
                crypto.randomBytes(20, function (err, buf) {
                    var token = buf.toString('hex');
                    done(err, token);
                });
            },
            function (token, done) {
                console.log('reqbodyemail', req.body.email);
                User.findOne({ 'username': req.body.email }, function (err, user) {
                    console.log('ENtra en findOne');
                    console.log(req.body.email);
                    if (!user) {
                        console.log('No account with this email');
                        req.flash('error', 'No existe una cuenta con este email.');
                        return res.redirect('/forgot');
                    }
                    user.resetPasswordToken = token;
                    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
                    console.log('Abans resetPasswordExpires');
                    console.log(Date.now());
                    user.save(function (err) {
                        if (err) {
                            console.log(err);
                        }
                        done(err, token, user);
                    });
                });
            },
            function (token, user, done) {
                console.log('createtrasnsport');
           
                var smtpTransport = nodemailer.createTransport({
                    service: 'Gmail',
                    auth: {
                        type: 'OAuth2',
                        user: config.support.user,
                        clientId: config.support.clientId,
                        clientSecret: config.support.clientSecret,
                        refreshToken: config.support.refreshToken,
                        accessToken: config.support.accessToken
                    }
                });
                var mailOptions = {
                    from: 'suport.auth@gmail.com',
                    to: req.body.email,
                    subject: 'Reseteo de contraseña',
                    html: '<p>Para su seguridad usted debe escoger una nueva contraseña . Por favor, acceda al siguiente enlace:</p>' +
                    '<p>http://' + req.headers.host + '/reset/' + token + '</p>' +
                    '<p>Si usted no ha solicitado una nueva contraseña ignore este mensaje.</p>' +
                    '<p>Por su seguridad este link es valido 1 hora a partir de su recepción.</p>'
                };

                smtpTransport.sendMail(mailOptions, function (err, response) {
                    console.log('Ready to send');
                    if (err) console.log(err);
                    smtpTransport.close();
                    done(err, 'done');
                });

            }],
            function (err) {
                if (err) return next(err);
                res.redirect('/forgot');
            });
    });



    router.get('/reset/:token', function (req, res) {
        User.findOne({ 'resetPasswordToken': req.params.token }, function (err, user) {
            if (!user) {
                req.flash('error', 'Password reset token is invalid or has expired.');
                return res.redirect('/forgot');
            }
            res.render('reset', {
                user: req.user
            });
        });
    });


    router.post('/reset/:token', function (req, res) {
        async.waterfall([
            function (done) {
                console.log('Despres resetPasswordExpires');
                console.log(Date.now());

                User.findOne({ 'resetPasswordToken': req.params.token, 'local.resetPasswordExpires': { $gt: Date.now() } }, function (err, user) {
                    if (!user) {
                        req.flash('error', 'Password reset token is invalid or has expired.');
                        return res.redirect('back');
                    }
                    user.password = newUser.generateHash(req.body.password);
                    user.resetPasswordToken = undefined;
                    user.resetPasswordExpires = undefined;

                    user.save(function (err) {
                        req.logIn(user, function (err) {
                            done(err, user);
                        });
                    });
                });
            }], function (err) {
                res.redirect('/');
            });
    });

    router.get('/auth/oauth2/authorize', oauth2.authorization);
    router.post('/auth/oauth2/authorize/decision', oauth2.decision);
    router.post('/auth/oauth2/token', oauth2.token);

    router.get('/api/userinfo', user.info);
    router.get('/api/personaldata', user.personaldata);

    router.get('/resourcesignup', function (req, res) {
        res.render('protectedresources');
    });

    router.get('/api/protectedresources', resources.protectedResources);
    router.get('/api/clientinfo', client.info);
    router.get('/clientsignup', client.clientSignupForm);
    router.post('/clientsignup', client.clientSignup);

    return router;
};

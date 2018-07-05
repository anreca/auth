                                                                                          'use strict';

const async = require('async');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const passport = require('passport');
const login = require('connect-ensure-login');

const config = require('../config/config');
const User = require('../db/user');
const Client = require('../db/client');

module.exports.index = [
  function(request, response){
    response.send('OAuth');
  },  
];

// Portal de autenticación de usuarios
module.exports.loginForm = function (request, response) {
    response.render('login', { message: request.flash('loginMessage') });
};

// Portal de autenticación local de usuarios
module.exports.login = passport.authenticate('local', {
  successReturnToOrRedirect: '/',
  failureRedirect: '/login',
  failureFlash : true
});

// Registro de usuarios
module.exports.signupForm = function(request, response) {
  response.render('signup', { message: request.flash('signupMessage')});
};

//Estrategia de autenticación de usuarios local
module.exports.signup = passport.authenticate('local-signup', {
  successReturnToOrRedirect: '/',
  failureRedirect: '/signup',
  failureFlash : true
});

//Estrategia de autenticación de usuarios via facebook
module.exports.facebook = passport.authenticate('facebook', {
  scope : ['email']
});

//Estrategia de autenticación facebook
module.exports.facebookCallback = passport.authenticate('facebook', {
      successReturnToOrRedirect: '/',
	  failureRedirect : '/login'
});

//Logout de usuarios
module.exports.logout = function(request, response) {
  request.logout();
  response.redirect('/');
};

//Get Formulario de restauración de contraseña
module.exports.forgotForm = function(request, response){
  response.render('forgot', { message: request.flash('info')});
};

//Post Formulario de restauración de contraseña
module.exports.forgot = function (req, res, next){
    async.waterfall([
    function (done){
        crypto.randomBytes(20, function (err, buf) {
            var token = buf.toString('hex');
            done(err, token);
        });
    },
    function (token, done) {
		User.findOne({ username: req.body.email }, function(err, user){
			if (!user) {
			req.flash('error', 'No existe un usuario con este email.');
			return res.redirect('/forgot');
			}
            user.resetPasswordToken = token;
            console.log('reset token', token);
			user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
            user.save(function (err) {
                if (err) {
                    console.log('error creating reset token');
                }
                done(err, token, user);
            });
		});
    },
    function (token, user, done) {
        var generator = require('xoauth2').createXOAuth2Generator({
            user: config.support.user,
            clientId: config.support.clientId,
            clientSecret: config.support.clientSecret,
            refreshToken: config.support.refreshToken,
            accessToken: config.support.accessToken
        });
        generator.on('token', function(token){
            config.support.accessToken = token.accessToken;
            console.log('New token for %s: %s', token.user, token.accessToken);
        });
        // login
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                xoauth2: generator
            }
        });
        var mailOptions = {
            to: user.username, from: 'antoniasqm@gmail.com',
            subject: 'Reseteo de contraseña',
            text: 'Para su seguridad usted debe escoger una nueva contraseña. Por favor, acceda al siguiente enlace:\n\n' + 'http://' + req.headers.host + '/reset/' + token + '\n\n Si usted no ha solicitado una nueva contraseña ignore este mensaje. Por su seguridad este link es valido 1 hora a partir de su recepción.\n'
        };
        transporter.sendMail(mailOptions, function (err) {
            req.flash('info', 'Mire en su correo ' + user.username + ' y siga las instrucciones para recuperar su contraseña.');
            done(err, 'done');
        });
    }],
    function (err) {
        if (err) return next(err);
        res.redirect('/forgot');
	});
};

//Datos del usuario
module.exports.account = [
  login.ensureLoggedIn(),
  function(request, response){
    response.render('account', { user: request.user });
  }
];

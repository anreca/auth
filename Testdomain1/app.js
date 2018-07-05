'use strict';

const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const errorHandler = require('errorhandler');
const session = require('express-session');
const passport = require('passport');
const store = require('store');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const ClientOAuth2 = require('client-oauth2');
var http = require('http');
var DomainStrategy = require('./domainOauth2Strategy').Strategy;
//configuración del almacenaje local de las sesiones
var expirePlugin = require('./expire');
store.addPlugin(expirePlugin);

const resource = require('./routes/resource');
const User = require('./db/user');
const config = require('./config');

//conexión con la base de datos del fichero gblij
mongoose.connect(config.db.url);

// Express configuration
const app = express();
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(cookieParser());
app.use(bodyParser.json({ extended: false }));
app.use(bodyParser.urlencoded({ extended: false }));
//app.use(errorHandler());
app.use(session({
  secret: config.session.secret,
}));


//Estrategia passport para solicitar a la aplicación cliente el codigo de
//autorización y el token de acceso
passport.use('oauth2', new DomainStrategy({
  authorizationURL: config.auth2.oauth2ServerBaseUrl + config.auth2.authorizationUrl,
  tokenURL: config.auth2.oauth2ServerBaseUrl + config.auth2.tokenUrl,
  clientID: config.auth2.clientId,
  clientSecret: config.auth2.clientSecret,
  callbackURL: config.auth2.callbackUrl
},
  function (accessToken, refreshToken, profile, done) {

    process.nextTick(function () {
      store.remove('accessToken');
      var expiration = new Date().getTime() + 1000000;
      store.set('accessToken', { token: accessToken }, expiration);
      User.findOne({ 'accessToken': accessToken }, function (err, user) {
        if (err) {
          return done(err);
        }
        if (user) {
          return done(null, user);
        }
        else {
          var newUser = new User();
          newUser.accessToken = accessToken;
          newUser.id = profile.id;
          newUser.name = profile.name;
          newUser.save(function (error) {
            if (error) {
              console.log(error);
              throw error;
            }
            return done(null, newUser);
          });
        }
      });
    });
  }));

app.use(passport.initialize());
app.use(passport.session());

// Configuración de las sesiones de passport
passport.serializeUser(function (user, done) {
  done(null, user.id);
});
passport.deserializeUser(function (user, done) {
  User.findOne({ 'id': user }, function (err, user) {
    if (err) {
      return done(err);
    }
    return done(null, user);
  });
});

app.get('/', function (req, res)  { res.render('index', {user: req.user}) ;);

app.get('/auth/oauth2', passport.authenticate('oauth2', { scope: 'personaldata' }));

app.get('/auth/oauth2/callback',
  passport.authenticate('oauth2', {
    failureRedirect: '/'
  }),
  function (req, res) {
    res.redirect('/');
  }
);

app.get('/success', function (req, res, next) {
  res.render('success', { user: req.user });
});

app.get('/protectedresource', resource.getresource);

app.get('/logout', function (req, res) {
  store.remove('accessToken');
  req.logout();
  res.redirect('/');
});

//creacion del servidor
app.listen(config.server.port, function () {
  console.log('OAuth2 provider is listening on port ' + config.server.port);
});

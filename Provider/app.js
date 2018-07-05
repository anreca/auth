'use strict';

const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const mongoose = require('mongoose');
const errorHandler = require('errorhandler');
const session = require('express-session');
const passport = require('passport');

const config = require('./config/config');
const app = express();
mongoose.Promise = global.Promise;

//Conexion con la base de datos MongoDB definida en config
mongoose.connect(config.db.url);

app.set('view engine', 'ejs');
app.use(flash());
app.use(bodyParser.json({ extended: false }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(errorHandler());
app.use(session({ secret: config.session.secret, resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

//controladores
require('./controller/index');

//rutas de la aplicación
const routes = express.Router();
require('./routes/index')(routes, passport);
app.use('/', routes);

app.listen(config.port.number, function() {
  console.log('OAuth2 provider is listening on port ' + config.port.number);
});

module.exports = app;

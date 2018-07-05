'use strict';
var util = require('util');
var request = require('request');
var store = require('store');

const config = require('../config');

//envio del token de acceso para obtener el recurso en forma de tabla
exports.getresource = [
  function (req, res, next) {
    store.removeExpiredKeys();
    var token = store.get('accessToken').token;
    var options = {
      method: 'GET',
      json: true,
      url: config.auth2.urlgetresource,
      auth: {
        sendImmediately: true,
        bearer: token,
      },
    };
    function callback(error, response, body) {
      if (error) {
        console.error('failed:', error);
      };
      if (!error && response.statusCode == 200) {
        console.log(body);
        res.render('resource', { title: 'show beach', json: JSON.stringify(body) , });
      }
    };
    request(options, callback);
  }
];

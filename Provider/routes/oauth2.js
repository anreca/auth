'use strict';

const oauth2orize = require('oauth2orize');
const passport = require('passport');
const login = require('connect-ensure-login');

const utils = require('../utils');
const Client = require('../db/client');
const User = require('../db/user');
const AccessToken = require('../db/accessToken');
const AuthoritzationCode = require('../db/authoritzationCode');


/* Creacion del servidor OAuth 2.0 de autorizacion de acceso de las aplicaciones
 * cliente a los recursos del servidor de recursos. */
const server = oauth2orize.createServer();

/* Funciones de serializacion y deserializacion
 * Cuando un cliente redirecciona a un usuario al servidor de autorizacion se inicia
 * la transaccion de autorizacion, que se completa cuando el usuario se identifica y
 * aprueba la peticion de autorizacion. Esta transaccion se almacena en una sesion.
 * La transaccion OAuth2.0 se serializa en una sesion a traves de la id del cliente.
 * Para la deserializacion se identifica en la base de datos la id del cliente.
 */

server.serializeClient(function (client, done) {
    console.log('client de serializeclient');
    console.log(client);
	done(null, client.id);
});

server.deserializeClient(function (id, done) {
    Client.findOne({ 'id': id }, function (err, client) {
        console.log('client de deserializeclient');
        console.log(client);
        if (err){
			return done(err);
        }
        return done(null, client);
    });
});

/* Flujo de autorizacion por codigo de acceso. La funcion callback recibe la
 * peticion de autorizacion de la aplicacion cliente, con la id del cliente,
 * la uri de redireccion, el usuario autenticado y la respuesta, la cual contiene
 * parametros de duracion o alcance. La aplicacion cliente envia un codigo para 
 * intercambiarlo por el token de acceso a los recursos.
 */
server.grant(oauth2orize.grant.code(function (client, redirectUri, user, ares, done) {
    console.log('grant code: client, redirecturi, user, ares (scope)');
    console.log(client, " ", redirectUri, " ", user, " ", ares, " ");

	const code = utils.getUid(16);
	var newAuthoritzationCode = new AuthoritzationCode();
	newAuthoritzationCode.code = code;
	newAuthoritzationCode.clientId= client.id;
    newAuthoritzationCode.redirectUri = redirectUri;
    newAuthoritzationCode.scope = ares.scope;
	newAuthoritzationCode.userId = user.id;
    newAuthoritzationCode.save(function(err){
		if (err) return done(err);
		return done(null, code);
    });
}));

/* Flujo de autorizacion implicito en el que el proveedor envia a la aplicacion
 * cliente que hace la peticion un access token.
 */
server.grant(oauth2orize.grant.token(function(client, user, ares, done){
    const token = utils.getUid(256);
	var newAccessToken = new AccessToken();
    newAccessToken.userId = user.id;
	newAccessToken.clientId= client.clientId;
	newAccessToken.token= token;
    newAccessToken.save(function(err){
		if (err) return done(err);
        return done(null, token);
    });
}));

// Modulo de intercambio del token de autorización por el token de acceso. Validación del cliente
// que realiza la peticion y de la redirect uri proporcionada y la del token de acceso.
server.exchange(oauth2orize.exchange.code(function (client, code, redirectUri, done) {
    console.log('exchange code');
	AuthoritzationCode.findOne({'code': code},function(err, authCode){
        if (err) return done(err);
        if (client.id !== authCode.clientId) return done(null, false);
        if (redirectUri !== authCode.redirectUri) return done(null, false);

        //borrar authorizationcode intercambiado
        AuthoritzationCode.remove(function (err) {
            if (err) {
                return done(err);
            }
        });
        var token = utils.getUid(256);
        var newAccessToken = new AccessToken();
        newAccessToken.userId = authCode.userId;
	    newAccessToken.clientId= authCode.clientId;
        newAccessToken.token = token;
        newAccessToken.scope = authCode.scope;
	    newAccessToken.save(function(err){
            if (err) return done(err);
            return done(null, token);
	    });
    });
}));

// Modulo de intercambio del correo y contraseña del usuario por un access token.
server.exchange(oauth2orize.exchange.password(function(client, username, password, scope, done){
    Client.findOne({'clientId': client.clientId}, function(err, localClient){
        if (err) return done(err);
        if (!localClient) return done(null, false);
        if (!localClient.isValidPassword(client.password)) return done(null, false);
        User.findOne({ 'username': username }, function (err, user) {
            if (err) return done(err);
            if (!user) return done(null, false);
            if (!user.isValidPassword(password)) return done(null, false);
            const token = utils.getUid(256);
			var newAccessToken = new AccessToken();
			newAccessToken.userId = user.id;
			newAccessToken.clientId= client.clientId;
			newAccessToken.token= token;
			newAccessToken.save( function(err){
				if (err) return done(err);
				return done(null, token);
			});
        });
    });
}));

// Modulo de intercambio de la id del cliente y del secreto por un access token.
server.exchange(oauth2orize.exchange.clientCredentials(function (client, scope, done) {
    Client.findOne({ 'clientId': client.clientId }, function (err, localClient) {
        if (err) return done(err);
        if (!localClient) return done(null, false);
        if (!localClient.isValidPassword(client.password)) return done(null, false);
		const token = utils.getUid(256);
		var newAccessToken = new AccessToken();
		newAccessToken.userId = null;
		newAccessToken.clientId= client.clientId;
		newAccessToken.token= token;
		newAccessToken.save(function(err){
			if (err) return done(err);
			return done(null, token);
		});
    });
}));

/*El endpoint de autorizacion acepta una respuesta de una function 
 * callback, que es responsable de validar el cliente a traves de la peticion.
 * Se valida que la 'redirectUri' sea igual a la registrada. Una vez se valida la
 * peticion el cliente debe invocar la instancia callback 'done' recibida, para
 * redirigir al usuario a la `redirectUri`.
 */
module.exports.authorization = [
    login.ensureLoggedIn(),
    server.authorization(function (clientId, redirectUri,  scope, state, done) {
        console.log('Authorization Endpoint: client id, redirect uri, scope, state');
        console.log(clientId, " ", redirectUri, " ", scope, " ", state, " ");

        Client.findOne({ 'clientId': clientId }, function (err, client) {
            if (err) return done(err);
            if (client.uri !== redirectUri) return done(err);
            return done(null, client, redirectUri);
        });
    },
    function (client, user, done) {
        if (client.isTrusted) return done(null, true);
        AccessToken.findOne({ 'userId': user.id }, function (err, user) {
            AccessToken.findOne({ 'clientId': client.clientId }, function (err, token) {
                if (token) return done(null, true);
                return done(null, false);
            });
        });
    }),
    function (request, response) {
        response.render('dialog', {
            transactionId: request.oauth2.transactionID,
      	    user: request.user,
            client: request.oauth2.client,
            scope: request.query['scope']
        });
    }
];

/* Endpoint de decision en el que una vez un usuario se ha autenticado debe
 * decidir si permitir o no el acceso de la aplicacion cliente a las peticiones
 * de acceso.
 */
exports.decision = [
    login.ensureLoggedIn(),
    server.decision(function (req, done) {
        console.log('\n \n decision req:   ', req);
        return done(null, { scope: req.body.scope });
    }),
];


 /*
  * Endpoint del token en el que se reciben las peticiones de los clientes que
  * solicitan un token de acceso a traves de un metodo de autorizacion.
  */
exports.token = [
    passport.authenticate(['basic', 'oauth2-client-password'], { session: false }),
    server.token(),
    server.errorHandler()
];
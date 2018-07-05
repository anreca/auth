/**
 * Module dependencies fr
 */
var util = require('util')
  , OAuth2Strategy = require('passport-oauth').OAuth2Strategy
  , InternalOAuthError = require('passport-oauth').InternalOAuthError

const config = require('./config');



/**
 * `Strategy` constructor.
 *
 * The TestDomain authentication strategy authenticates requests by delegating to
 * AppExample using the OAuth 2.0 protocol.
 *
 * Applications must supply a `verify` callback which accepts an `accessToken`,
 * `refreshToken` and service-specific `profile`, and then calls the `done`
 * callback supplying a `user`, which should be set to `false` if the
 * credentials are not valid.  If an exception occured, `err` should be set.
 *
 * Options:
 *   - `clientID`      your Testdomain application's client id
 *   - `clientSecret`  your Testdomain application's client secret
 *   - `callbackURL`   URL to which Testdomain will redirect the user after granting authorization
 *
 *
 * @param {Object} options
 * @param {Function} verify
 * @api public
 */
function Strategy(options, verify) {
  options = options || {};
  options.authorizationURL = options.authorizationURL || config.auth2.oauth2ServerBaseUrl+config._oauth2.authorizationURL;
  options.tokenURL = options.tokenURL || config.auth2.oauth2ServerBaseUrl+config.auth2tokenURL;

  OAuth2Strategy.call(this, options, verify);
  this.name = 'oauth2';
}

/**
 * Inherit de `OAuth2Strategy`.
 */
util.inherits(Strategy, OAuth2Strategy);


/**
 * Retrieve user profile from AppExample.
 *
 * This function constructs a normalized profile, with the following properties:
 *
 *   - `provider`         always set to `appexample`
 *   - `id`
 *   - `username`
 *   - `displayName`
 *
 * @param {String} accessToken
 * @param {Function} done
 * @api protected
 */
Strategy.prototype.userProfile = function (accessToken, done) {
  this._oauth2.getProtectedResource(config.auth2.oauth2ServerBaseUrl+'/api/userinfo', accessToken, function (err, body, res) {

    if (err) { return done(new InternalOAuthError('failed to fetch user profile', err)); }

    try {
      //obtención de las variables solicitadas para identificar al usaurio
      var json = JSON.parse(body);
      console.log(" * userProfile body[" + body + "]")
      var profile = { provider: 'oauth2' };
      profile.id = json.user_id;
      profile.name = json.name;

      done(null, profile);
    } catch (e) {
      done(e);
    }
  });
}


/**
 * Expose `Strategy`.
 */
exports.Strategy = Strategy;

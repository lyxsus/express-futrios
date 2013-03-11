var	passport = require ('passport'),
	LocalStrategy = require ('passport-local').Strategy,

	Q = require ('q'),
	_ = require ('lodash'),

	authorize = require ('./authorize.js');


module.exports = function (app, pool) {
	passport.serializeUser (function (user, done) {
		var oauth = user.get ('oauth'),
			consumer_key = _.first (_.keys (oauth.consumer_keys)),
			token = _.first (_.keys (oauth.tokens));

		done (null, {
			consumer_key: consumer_key,
			consumer_secret: oauth.consumer_keys [consumer_key],
			token: token,
			token_secret: oauth.tokens [token]
		});
	});

	passport.deserializeUser (function (user, done) {
		done (null, user);
	});

	passport.use (new LocalStrategy ({
		usernameField: 'username',
		passwordField: 'password'
	}, function (username, password, done) {
		authorize (pool, {
			username: username,
			password: password
		})
			.then (function (user) {
				done (null, user);
			})
			.fail (done)
			.done ();
	}));

	return app
		.use (passport.initialize ())
		.use (passport.session ())

		.post ('/login', passport.authenticate ('local', {
			successRedirect: '/',
			failureRedirect: '/'
		}))

		.use ('/logout', function (req, res) {
			req.logout ();
			
			res.cookie ('user_token', 'nobody', {
				maxAge: 3600000,
				path: '/'
			});
			
			res.writeHead (302, {
				'Location': '/'
			});
			
			res.end ();
		});
};

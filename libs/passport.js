var	passport = require ('passport'),
	LocalStrategy = require ('passport-local').Strategy,

	Q = require ('q'),
	_ = require ('lodash'),

	authorize = require ('./authorize.js');

function userCtx (user) {
	if (user && (user.get ('name') != 'nobody')) {
		return {
			name: user.get ('name'),
			roles: user.get ('roles'),
			account: user.get ('account'),
			database: user.get ('database')
		};
	} else {
		return {
			name: null,
			roles: []
		};
	}
}


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

		.post ('/login', passport.authenticate ('local'), function (req, res) {
			if (req.headers.accept == 'application/json') {
				res.setHeader ('content-type', 'application/json; charset=utf-8');

				res.write (
					JSON.stringify ({
						ok: true,
						userCtx: userCtx (req.user)
					})
				);
				res.end ();
			} else {
				res.redirect ('/');
			}
		})

		.use ('/_session', function (req, res) {
			res.setHeader ('content-type', 'application/json; charset=utf-8');

			Q.when (pool.client (req.user ? {oauth: req.user} : null))
				.then (function (client) {
					res.write (
						JSON.stringify ({
							ok: true,
							userCtx: userCtx (client.user)
						})
					);
					res.end ();
				})
				.fail (console.error)
				.done ();
		})

		.use ('/logout', function (req, res) {
			// req.logout ();
			req.session.destroy ();
			
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

var	passport = require ('passport'),
	LocalStrategy = require ('passport-local').Strategy,

	Q = require ('q'),
	_ = require ('lodash'),

	authorize = require ('./authorize.js');


module.exports = function (app, pool) {
	passport.serializeUser (function (user, done) {
		done (null, user.id);
	});

	passport.deserializeUser (function (id, done) {
		Q.when (pool.server.database ('_users'))
			.then (function (users) {
				return users.documents.get (id);
			})
			.then (function (user) {
				done (null, user);
			})
			.fail (function (error) {
				done ('Session error ' + error.error);
			})
			.done ();
		
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

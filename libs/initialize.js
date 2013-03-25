var	Q = require ('q'),
	_ = require ('lodash'),
	passport = require ('./passport'),
	route = require ('./route'),
	render = require ('./render');

Q.longStackJumpLimit = 0;

module.exports = function (app, pool) {
	passport (app, pool);

	app.use (require ('express-device').capture ());

	return function (req, res, next) {
		pool.client (req.user ? {oauth: req.user} : null)
			.then (function (client) {
				if (client.errors) {
					throw client.errors;
				}
				return route (req, client)
					.then (function (routed) {
						return render (req, res, next, client, routed);
					})
					.fail (function (error) {
						res.statusCode = 500;
						res.write ('Internal Server Error ' + error);
						res.end ();
					})
					.fin (function () {
						client.release ();
					});
			})

			.fail (function (error) {
				console.log ('failed to get user session', error);

				req.session.destroy ();

				res.cookie ('user_token', 'nobody', {
					maxAge: 3600000,
					path: '/'
				});

				res.writeHead (302, {
					'Location': '/'
				});

				res.write (JSON.stringify (error));
				res.end ();
			})

			.done ();
	};
};

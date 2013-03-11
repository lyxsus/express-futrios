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
				return route (req, client)
					.then (function (routed) {
						return render (req, res, next, client, routed);
					})
			})

			.fail (function (error) {
				res.write (error.toString ());
				res.end ();
			})

			.done ();
	};
};

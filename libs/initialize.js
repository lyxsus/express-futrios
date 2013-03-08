var	Q = require ('q'),
	_ = require ('lodash'),
	passport = require ('./passport'),
	route = require ('./route'),
	render = require ('./render');


module.exports = function (app, pool) {
	passport (app, pool);

	app.use (require ('express-device').capture ());

	function client (user) {
		var params;

		if (user) {
			var oauth = user.get ('oauth'),
				consumer_key = _.first (_.keys (oauth.consumer_keys)),
				token = _.first (_.keys (oauth.tokens));

			params = {
				oauth: {
					consumer_key: consumer_key,
					consumer_secret: oauth.consumer_keys [consumer_key],
					token: token,
					token_secret: oauth.tokens [token]
				}
			};
		}

		return pool.client (params);
	}

	return function (req, res, next) {
		client (req.user)
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

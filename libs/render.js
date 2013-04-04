var	Promises = require ('vow'),
	_ = require ('lodash'),
	Negotiator = require ('negotiator');


function getResource (client, routed) {
	return client.resources.get (
		routed.doc ? routed.app + '/' + routed.doc : routed.app
	);
}

var engines = {
	html: require ('./engines/html'),
	json: require ('./engines/json'),
	xml: require ('./engines/xml')
};

var contentTypes = _.uniq (_.flatten (
	_.map (engines, function (engine) {
		return engine.contentTypes;
	})
));

function getEngine (ext, contentType) {
	if (engines [ext]) {
		return engines [ext];
	} else {
		return _.find (engines, function (engine) {
			return engine.contentTypes.indexOf (contentType) !== -1;
		});
	}
}

function checkUserCookie (req, res, client) {
	var account = client.user.get ('account') || '',
		key = 'user_token';

	if (account != req.cookies [key]) {
		res.cookie (key, account, {
			maxAge: 3600000,
			path: '/'
		});
	}
}

module.exports = function (req, res, next, client, routed) {
	var negotiator = new Negotiator (req),
		desiredContentType = negotiator.preferredMediaType (contentTypes),
		desiredLanguages = negotiator.preferredLanguages ();

	res.header ('X-Powered-By', 'Futurios');
	res.header ('Vary', 'Cookie, ETag, User-Agent, Accept, Accept-Language');

	checkUserCookie (req, res, client);	

	switch (req.method) {
		case 'GET':
			return Promises.when (getResource (client, routed))
				.then (function (resource) {
					if (routed.attach) {
						return resource
							.getAttachment (routed.attach)
								// .on ('error', console.error)
								.pipe (res);
					} else {
						try {
							var Engine = getEngine (routed.ext, desiredContentType),
								engine = new Engine (resource, client, routed.host);
							
							return engine.render (req, res, next);
						} catch (e) {
							console.error (e.message, e.stack);

							res.redirect ('/');
						}
						

					}
				});

		case 'POST':	// TODO: Create element in collection

		case 'PUT':	{
			return Promises.when (getResource (client, routed))
				.then (function (resource) {
					if (routed.attach) {
						// req.setEncoding ('binary');

						// req.resume ();

						// req.on ('data', function (chunk) {
						// 	console.log ('data', chunk);
						// });

						// req.on ('end', function () {
						// 	console.log ('ended at last');
						// });

						// console.log ('fuck off');


						// res.write ('fuck off');
						// res.end ();
						// return;

						return resource
							.saveAttachment ({
								name: routed.attach,
								contentType: 'text/plain',	// TODO: Detect content-type
								body: req
							})
							.then (function () {
								return resource.getAttachment (routed.attach)
									.pipe (res);
							});
					} else {
						// TODO: Update element in collection
						throw new Error ('Not implemented');
					}
				});
		}
		case 'DELETE': {
			return Promises.when (getResource (client, routed))
				.then (function (resource) {
					if (routed.attach) {
						return resource
							.removeAttachment (routed.attach)
							.then (function () {
								res.statusCode = 204;
								res.write ('204 No Content');
								res.end ();
							});
					} else {
						// TODO: Delete document
						throw new Error ('Not implemented');
					}
				});
		}

		default:
			res.writeHead (415);
			res.write ('<h1>415 - method not allowed</h1>');
			res.end ();
	}
};

// module.exports.engines = engines;

var	Q = require ('q'),
	_ = require ('lodash'),
	Negotiator = require ('negotiator');


function getResource (client, routed) {
	return client.get (
		routed.doc ? routed.app + '/' + routed.doc : routed.app
	);
}

var engines = {
	json: require ('./engines/json'),
	html: require ('./engines/html')
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

module.exports = function (req, res, next, client, routed) {
	var negotiator = new Negotiator (req),
		desiredContentType = negotiator.preferredMediaType (contentTypes),
		desiredLanguages = negotiator.preferredLanguages ();

	res.header ('X-Powered-By', 'Futurios');

	switch (req.method) {
		case 'GET':
			return Q.when (getResource (client, routed))
				.then (function (resource) {
					if (routed.attach) {
						return resource.source
							.getAttachment (routed.attach)
								.pipe (res);
					} else {
						var Engine = getEngine (routed.ext, desiredContentType),
							engine = new Engine (resource, client);
						
						return engine.render (req, res, next);

					}
				});

		case 'POST':	// TODO: Create element in collection
		case 'PUT':		// TODO: Update document
		case 'DELETE':	// TODO: Delete document

		default:
			res.writeHead (415);
			res.write ('<h1>415 - method not allowed</h1>');
			res.end ();
	}
};

// module.exports.engines = engines;
var	_ = require ('lodash'),
	loader = require ('fs').readFileSync(__dirname + '/loader.html', 'utf-8');


module.exports = function (resource, client) {
	this.resource = resource;
	this.client = client;
	this.loader = loader;
};

_.extend (module.exports.prototype, {
	render: function (req, res, next) {
		this.headers (req, res);

		// TODO: Place renderer here, in fact
		
		if (req.device == 'bot') {
			res.write ('<h1>hi, bot</h1>');
		} else {
			res.write (this.loader);
		}
		
		res.end ();
	},

	headers: function (req, res) {
		var resource = this.resource,
			meta = resource.get ('meta');

		// res.header ('Content-Type', 'text/html; charset=utf-8');
		res.header ('Vary', 'Accept, Accept-Encoding, Accept-Language, Cookie');
		res.header ('ETag', resource.get ('_rev'));

		if (meta) {
			if (meta.updated_at) {
				res.header ('Last-Modified', (new Date (meta.updated_at)).toGMTString ());
			}
		}
	}
})


module.exports.contentTypes = [
	'text/html'
];

var	_ = require ('lodash'),
	Renderer = require ('fos-render');


module.exports = function (resource, client, host) {
	this.resource = resource;
	this.client = client;
	this.host = host;
};

_.extend (module.exports.prototype, {
	render: function (req, res, next) {
		if (this.headers (req, res)) {
			return;
		}

		var renderer = new Renderer (this);

		return renderer.html ({
			device: req.device
		})
			.then (function (html) {
				res.write (html);
			})
			.fail (function (error) {
				console.error (error);
				res.write (error);
			})
			.fin (function () {
				res.end ();
			})
			.done ();
	},

	headers: function (req, res) {
		var resource = this.resource,
			meta = resource.get ('meta');

		var checkETag = req.headers ['if-none-match'];

		if (checkETag == resource.get ('_rev')) {
			res.statusCode = 304;
			res.end ();
			return true;
		}

		res.header ('Content-Type', 'text/html; charset=utf-8');
		res.header ('Vary', 'Accept, Accept-Encoding, Accept-Language, Cookie');
		res.header ('ETag', resource.get ('_rev'));
		// res.header ('Cache-Control', 'max-age')

		if (meta) {
			if (meta.updated_at) {
				// res.header ('Last-Modified', (new Date (meta.updated_at)).toGMTString ());
			}
		}
	}
})


module.exports.contentTypes = [
	'text/html'
];

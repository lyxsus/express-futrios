var	_ = require ('lodash'),
	Renderer = require ('fos-render');


module.exports = function (resource, client, host) {
	this.resource = resource;
	this.client = client;
	this.host = host;
};

_.extend (module.exports.prototype, {
	render: function (req, res, next) {
		this.headers (req, res);

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

		res.header ('Content-Type', 'text/html; charset=utf-8');
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

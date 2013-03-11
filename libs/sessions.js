module.exports = function sessions (express, config) {
	var Store;

	switch (config.store ? config.store.type : 'memory') {
		case 'couchdb':
			Store = require ('connect-couchdb') (express);
			break;

		case 'redis':
			Store = require ('connect-redis') (express);
			break;

		default:
			Store = express.session.MemoryStore;
	}

	config.instance = new Store (config.store ? config.store.options : null);
	
	return express.session ({
		secret: config.secret,
		key: config.key,
		store: config.instance
	});
};
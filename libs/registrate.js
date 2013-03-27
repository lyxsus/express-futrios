var Promises = require ('vow');

function createAccount () {

}

function createDatabase () {
	return server.create ()
}

function createUser () {

}

module.exports = function (data, pool) {
	var server = pool.server,
		sign = {auth: server.settings.auth};

	var createAccount = function (data) {
		return Promises.when (server.database ('app/accounts'))
			.then (function (database) {
				data.type = 'urn:types/account';

				return database.documents.create ('urn:accounts', data, sign)
					.fail (function () {
						return database.documents.get ('urn:accounts/' + data.id);
					});
			});
	};

	return pool.server.uuid ()
		.then (function (uuid) {
			uuid = 'b63ee1a30d15300ac7ae58ca6ad91d7045f618ba';

			return Promises.all ([
				createAccount ({id: uuid}),
				server.create ('users/' + uuid, sign)
			]);
		})

		.then (function (fulfilled) {
			var account = fulfilled [0],
				database = fulfilled [1];

			return Promises.when (server.database ('_users'))
				.then (function (users) {
					if (!data.roles) {
						data.roles = [];
					}

					if (data.roles.indexOf ('user') === -1) {
						data.roles.push ('user');
					}

					data._id = 'org.couchdb.user:' + data.name;

					data.account = account.id;
					data.database = database.name;
					data.type = 'user';


					// TODO: Generate oauth tokens
					// TODO: Generate random password

					return users.documents.create (null, data, sign);
				});
		})

		.fail (function () {
			console.log ('???', arguments);
		});
};

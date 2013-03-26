var	Promises = require ('vow'),
	sha1 = require ('sha1');


function getUserByPassword (db, params) {
	return Promises.when (db.views.get ('oauth', 'username'))
		.then (function (view) {
			return view.get ({
				key: params.username,
				reduce: false,
				limit: 1
			});
		})
		.then (function (fragment) {
			var rows = fragment.get ('rows');

			if (rows.length) {
				return db.documents.get (rows [0].id);
			} else {
				throw new Error ('Username not found');
			}
		})
		.then (function (user) {
			var salt = user.get ('salt'),
				password_sha = user.get ('password_sha');

			if (sha1 (params.password + salt) != password_sha) {
				throw new Error ('Wrong password');
			}
			
			return user;
		});
}

module.exports = function (pool, params) {
	return Promises.when (pool.server.database ('_users'))
		.then (function (users) {
			switch (true) {
				default:
					return getUserByPassword (users, params);
			}
		})
		.fail (function (error) {
			console.error ('Failed to find user', error)
		});
};
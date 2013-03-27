var	Promises = require ('vow'),
	_ = require ('lodash'),
	sha1 = require ('sha1'),

	registrate = require ('./registrate');


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

function getUserByOAuth (db, params) {
	var provider, access_token, profile;

	if (params.oauth) {
		provider = params.oauth.profile.provider;
		access_token = params.oauth.accessToken;
		profile = params.oauth.profile;
	}

	if (params.openid) {
		provider = access_token = params.openid.token;
		profile = params.openid.profile;
	}

	return Promises.when (db.views.get ('oauth', 'tokens'))
		.then (function (view) {
			return view.get ({
				key: [provider, profile.id],
				reduce: false,
				limit: 1
			});
		})
		.then (function (fragment) {
			var rows = fragment.get ('rows');

			if (rows.length) {
				return db.documents.get (rows [0].id);
			}
		});
}

function getLoggedUser (pool, oauth) {
	if (!oauth) return;

	return Promises.when (pool.client ({oauth: oauth}))
		.then (function (client) {
			return client.user;
		})
		.fail (function (error) {
			console.error ('Could not get user', error);
		});
}

function findEmail (tokens) {
	if (tokens) {
		for (var i in tokens) {
			var token = tokens [i];

			if (token.profile && token.profile.emails) {
				var emails = token.profile.emails;
				for (var j in emails) {
					if (emails [j] && emails [j].value) {
						return emails [j].value;
					}
				}
			}
		}
	}
}

function getUserTokens (user) {
	var oauth = user.get ('oauth'),
		consumer_key = _.first (_.keys (oauth.consumer_keys)),
		token = _.first (_.keys (oauth.tokens));

	return {
		consumer_key: consumer_key,
		consumer_secret: oauth.consumer_keys [consumer_key],
		token: token,
		token_secret: oauth.tokens [token]
	};
}

module.exports = function (pool, params) {
	return Promises.when (pool.server.database ('_users'))
		.then (function (users) {
			switch (true) {
				case (!!params.oauth || !!params.openid):
					var provider, access_token, profile;

					if (params.oauth) {
						provider = params.oauth.profile.provider;
						access_token = params.oauth.accessToken;
						profile = params.oauth.profile;
					}

					if (params.openid) {
						provider = access_token = params.openid.token;
						profile = params.openid.profile;
					}

					return getUserByOAuth (users, params)
						.then (function (user) {
							if (user) {
								return user;
							} else {
								return getLoggedUser (pool, params.user)
							}
						})

						.then (function (user) {
							if (user) {
								return user;
							} else {
								return registrate ({
									name: 'create-new-user'
								}, pool);
							}
						})

						.then (function (user) {
							var tokens = user.get ('tokens') || {},
								email = user.get ('email');
							
							tokens [provider] = {
								access_token: access_token,
								profile: profile
							};

							if (!email) {
								email = findEmail (tokens);
							}

							user.merge ({
								tokens: tokens,
								email: email
							});

							return user.save (null, {oauth: getUserTokens (user)});
						});

				default:
					return getUserByPassword (users, params);
			}
		})
		.fail (function (error) {
			console.error ('Failed to find user', error)
		});
};
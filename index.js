var Q = require ('q');

Q.longStackJumpLimit = 0;

module.exports = {
	Pool: require ('fos-pool'),
	SocketIO: require ('fos-socket.io'),
	initialize: require ('./libs/initialize.js'),
	sessions: require ('./libs/sessions.js')
};

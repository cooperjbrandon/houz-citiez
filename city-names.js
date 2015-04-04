var citynames = ['san-jose-ca', 'san-francisco-ca']; //TODO: add more city names

var amqp, clc, config,
		connection, publishRoutingKey,
		exchange, exchangeName;

amqp = require('amqp');
clc = require('cli-color');
config = require('houz-config');

exchangeName = config.exchangeName;
publishRoutingKey = config.routingKey.cities;

var beginSetup = function() {
	connection = amqp.createConnection();
	connection.on('ready', connectionReady);
};

var connectionReady = function() {
	console.log(clc.blue('The connection is ready'));
	connectToExchange();
};

var connectToExchange = function() {
	exchange = connection.exchange(exchangeName, {autoDelete: false}); //connect to exchange
	exchange.on('open', exchangeReady);
}

var exchangeReady = function() {
	console.log(clc.bgBlueBright('The exchange "' +exchange.name+ '" is ready'));
	pushCityNamesToExchange();
};

var pushCityNamesToExchange = function() {
	for (var i = 0; i < citynames.length; i++) {
		exchange.publish(publishRoutingKey, { city: citynames[i] }); //routingKey, message
	}
};

beginSetup();

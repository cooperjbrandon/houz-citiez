//Libraries
var expect = require('chai').expect;
var sinon = require('sinon');
var amqp = require('amqp');

//Files
var Connection = require('amqp/lib/connection');
var Exchange = require('amqp/lib/exchange');
var Queue = require('amqp/lib/queue');
var city_file = require('../city-names');
var citynames = city_file.citynames;
var config = require('houz-config');

//stubs
var stubconn, stubexch, spy, stub1, stub2, stub3;

describe('City Names', function() {
	before('stub out amqp and begin connection', function() {
		//create a stub connection to return when connecting to amqp
		stubconn = new Connection();
		
		//stub out _sendMethod - this is used when creating an exchange
		stub1 = sinon.stub(stubconn, '_sendMethod');

		//create a stub exchange to return when connecting to an exchange
		stubexch = new Exchange(stubconn, null, config.exchangeName);

		// don't actually connect to server (see node_modules/amqp/ampq.js)
		// just return new Connection object.
		stub2 = sinon.stub(amqp, 'createConnection').returns(stubconn);
		
		// don't actually connect to exchange, just return new Exchange object
		stub3 = sinon.stub(stubconn, 'exchange').returns(stubexch);
		
		//this invokes beginSetup
		city_file.beginSetup();
		
		//spy on exchange.publish
		spy = sinon.spy(stubexch, 'publish');
		
		stubconn.emit('ready');
		stubexch.emit('open');
	});
	after('restore all', function() {
		spy.restore();
		stub1.restore();
		stub2.restore();
		stub3.restore();
	});
	
	it('should publish to the exchange for each city name', function(){
		expect(spy.callCount).to.equal(citynames.length);
	});

	it('should publish to the exchange with the correct routingKey and message', function(){
		var expectedRoutingKey = config.routingKey.cities;
		var expectedMessageStructure = config.messageExpectations.cities;

		for (var i = 0; i < citynames.length; i++) {
			var args = spy.args[i];
			
			expect(args[0]).to.equal(expectedRoutingKey);
			correctStructureOfMessage(args[1], expectedMessageStructure, citynames[i]);
		};
	});
});

var correctStructureOfMessage = function(message, expectedMessage, city) {
	var messageKeys = Object.keys(message)
	var expectedMessageKeys = Object.keys(expectedMessage);
	
	//verify that the number of properties are the same
	expect(messageKeys).to.have.length(expectedMessageKeys.length);

	//verify that the message has the expected properties
	for (var i = 0; i < expectedMessageKeys.length; i++) {
		expect(message).to.have.property(expectedMessageKeys[i], city);
	}
};

var assert = require('assert'),
    util = require('util'),
    config = require('../config'),
    io = require('socket.io-client'),
    appUrl = 'http://localhost:' + (config.server.port || 5000);


describe('App', function() {
  this.timeout(10000);

  // Before run this test ensure to have rules that generate at least 1
  // activity every 10 seconds
  it('should connect to the stream and fetch data', function(done) {
    var socket = io.connect(appUrl + '/stream', {'force new connection': true});
    socket.on('connect', function() {
      socket.on('data', function(data) {
        assert.ok(data, 'data is present');
        done();

        // prevents calling done() twice
        socket.removeAllListeners();
      });
    });
  });

  it('should get the list of rules', function(done) {
    var socket = io.connect(appUrl + '/rules', {'force new connection': true});
    socket.on('connect', function() {
      socket.emit('get', function(error, data) {
        assert.equal(error, null, 'get response contains no error');
        assert.ok(data, 'get response contains some data');
        done();
      });
    });
  });

  it('should add a new rule', function(done) {
    var socket = io.connect(appUrl + '/rules', {'force new connection': true}),
        testRule = 'node-gnip-test';

    socket.on('connect', function() {
      socket.emit('add', {rules: [{value: testRule}]}, function(error) {
        assert.equal(error, null, 'add response contains no error');

        socket.emit('get', function(error, data) {
          assert.equal(error, null, 'get response contains no error');

          assert.ok((function(rules) {
            var i, len;
            for (i = 0, len = rules.length; i < len; i++) {
              if (rules[i].value === testRule)
                return true;
            }
            return false;
          })(data.rules), 'get response contains the test rule');
          done();
        });
      });
    });
  });

  // this test assumes the previous one has been run
  it('should remove an exhisting rule', function(done) {
    var socket = io.connect(appUrl + '/rules', {'force new connection': true}),
        testRule = 'node-gnip-test';

    socket.on('connect', function() {
      socket.emit('remove', {rules: [{value: testRule}]}, function(error) {
        assert.equal(error, null, 'remove response contains no error');

        socket.emit('get', function(error, data) {
          assert.equal(error, null, 'get response contains no error');

          assert.ok((function(rules) {
            var i, len;
            for (i = 0, len = rules.length; i < len; i++) {
              if (rules[i].value === testRule)
                return false;
            }
            return true;
          })(data.rules), 'get response does not contain the test rule');
          done();
        });
      });
    });
  });
});

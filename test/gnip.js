var assert = require('assert'),
    util = require('util'),
    config = require('../config'),
    gnip = require('../lib/gnip'),
    powerTrackConfig = {
      apiUrl: config.gnip.powerTrackUrl,
      username: config.gnip.username,
      password: config.gnip.password
    },
    rulesAPIConfig = {
      apiUrl: config.gnip.rulesAPIUrl,
      username: config.gnip.username,
      password: config.gnip.password
    };

describe('Gnip', function() {
  this.timeout(10000);

  describe('PowerTrack', function() {
    it('should connect to Gnip PowerTrack', function(done) {
      var powerTrack = new gnip.PowerTrack(powerTrackConfig);
      powerTrack.on('connect', function() {
        this.reset();
        done();
      });
      powerTrack.start();
    });


    it('should reconnect if an error occurs', function(done) {
      var powerTrack = new gnip.PowerTrack(powerTrackConfig),
          error = false;
      powerTrack.start();
      powerTrack.on('error', function(error) {
        error = true;
      });
      powerTrack.on('connect', function() {
        if (error) {
          done();
        }
        else {
          error = true;
          setTimeout(function() {
            // calls private method just to force an error
            powerTrack._handleError(new Error('error'));
          }, 3000);
        }
      });
    });
  });

  describe('RulesAPI', function() {
    var testRule = 'node-gnip-powertrack-test';

    it('should get the list of rules', function(done) {
      var rulesAPI = new gnip.RulesAPI(rulesAPIConfig);
      rulesAPI.get(function(error, data) {
        assert.equal(error, null, 'get response contains no error');
        assert.ok(data, 'get response contains some data');
        done();
      });
    });

    it('should add a new rule', function(done) {
      var rulesAPI = new gnip.RulesAPI(rulesAPIConfig);
      rulesAPI.add({rules: [{value: testRule}]}, function(error) {
        assert.equal(error, null, 'add response contains no error');
        rulesAPI.get(function(error, data) {
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

    // this test assumes the previous one has been run
    it('should remove an exhisting rule', function(done) {
      var rulesAPI = new gnip.RulesAPI(rulesAPIConfig);
      rulesAPI.remove({rules: [{value: testRule}]}, function(error) {
        assert.equal(error, null, 'remove response contains no error');
        rulesAPI.get(function(error, data) {
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

    it('should handle wrong add parameters', function(done) {
      var rulesAPI = new gnip.RulesAPI(rulesAPIConfig);
      rulesAPI.add(function(error) {
        assert.ok(error);

        rulesAPI.add(null, function(error) {
          assert.ok(error);

          rulesAPI.add('Invalid object', function(error) {
            assert.ok(error);

            rulesAPI.add({invalid: 'rule object'}, function(error) {
              done();
            });
          });
        });
      });
    });

    it('should handle wrong remove parameters', function(done) {
      var rulesAPI = new gnip.RulesAPI(rulesAPIConfig);
      rulesAPI.remove(function(error) {
        assert.ok(error);

        rulesAPI.remove(null, function(error) {
          assert.ok(error);

          rulesAPI.remove('Invalid object', function(error) {
            assert.ok(error);

            rulesAPI.remove({invalid: 'rule object'}, function(error) {
              done();
            });
          });
        });
      });
    });
  });
});

var assert = require('assert'),
    util = require('util'),
    Backoff = require('../lib/backoff');

describe('Backoff', function() {
  it('should backoff exponentially', function(done) {
    var startDelay = 50,
        backoff = new Backoff({ startDelay: startDelay }),
        startTime = (new Date()).getTime(),
        attempts = 5;

    backoff.on('tick', function(attempt, delay) {
      assert.equal(delay, Math.pow(2, attempt - 1) * startDelay, 'delay has been exponentially increased according to the current attempt');
      assert.ok((new Date()).getTime() >= startTime + delay, 'tick is executed after the correct exponential timeout');
      attempts--;
      if (attempts === 0)
        done();
      else
        this.next();
    });
    backoff.start();
  });

  it('should fail after maximum number of attempts', function(done) {
    var maxAttempts = 4,
        backoff = new Backoff({ startDelay: 50, maxAttempts: maxAttempts}),
        currentAttempt = 0;
    backoff.on('tick', function(attempt, delay) {
      currentAttempt++;
      this.next();
    }).on('fail', function() {
      assert.equal(currentAttempt, maxAttempts, 'fail after the maximum number of attempts');
      done();
    });
    backoff.start();
  });
});

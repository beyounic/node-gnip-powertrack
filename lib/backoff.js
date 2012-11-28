var util = require('util'),
    EventEmitter = require('events').EventEmitter;

var Backoff = (function() {
  var Backoff = function(options) {
    EventEmitter.call(this);

    options = options || {};
    this._options = {
      startDelay: options.startDelay || 1000,
      maxAttempts: options.maxAttempts || 10
    };

    this._init();
  };

  util.inherits(Backoff, EventEmitter);

  Backoff.prototype._init = function() {
    this._delay = this._options.startDelay;
    this._attempts = 0;
    this._timeout = null;
  };

  Backoff.prototype._tick = function() {
    var that = this;

    this._timeout = setTimeout(function() {
      that._timeout = null;
      that._attempts++;
      that._delay *= 2;

      if (that._attempts > that._options.maxAttempts)
        that.emit('fail');
      else
        that.emit('tick', that._attempts, that._delay / 2);
    }, this._delay);
  };

  Backoff.prototype.start = function() {
    this.reset();
    this.next();
  };

  Backoff.prototype.next = function() {
    if (this.isRunning()) return;
    this._tick();
  };

  Backoff.prototype.reset = function() {
    if (this.isRunning()) {
      clearTimeout(this._timeout);
    }
    this._init();
  };

  Backoff.prototype.isRunning = function() {
    return this._timeout ? true : false;
  };

  return Backoff;
})();

module.exports = Backoff;

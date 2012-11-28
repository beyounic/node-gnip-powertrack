var util = require('util'),
    zlib = require('zlib'),
    url = require('url'),
    https = require('https'),
    EventEmitter = require('events').EventEmitter,
    Backoff = require('./backoff'),
    StreamParser = require('./stream-parser');

var PowerTrack = (function() {
  var PowerTrack = function(options) {
    var that = this,
        apiUrlParts;

    EventEmitter.call(this);

    apiUrlParts = url.parse(options.apiUrl);
    this._options = {
      host: apiUrlParts.hostname,
      port: apiUrlParts.port,
      path: apiUrlParts.path,
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip'
      },
      auth: options.username + ':' + options.password
    };

    this._init();

    this._backoff = new Backoff();
    this._backoff.on('tick', function(attempt, delay) {
      // try to reconnect
      that.reset();
      that.start();

      // schedule another backoff
      this.next();
    }).on('fail', function() {
      that.reset();
      that.emit('fail');
    });
  };

  util.inherits(PowerTrack, EventEmitter);

  PowerTrack.prototype._init = function() {
    this._parser = null;
    this._decompressor = null;
    this._request = null;
  };

  PowerTrack.prototype._handleError = function(error) {
    this.emit('error', error);
    if (!this._backoff.isRunning())
      this._backoff.start();
  };

  PowerTrack.prototype.reset = function() {
    this._parser.removeAllListeners();
    this._decompressor.removeAllListeners();
    this._request.removeAllListeners();
    this._request.abort();
    this._init();
  };

  PowerTrack.prototype.start = function() {
    var that = this;

    this._parser = new StreamParser();
    this._parser.on('data', function(data) {
      that.emit('data', data);
    }).on('error', function(error) {
      that._handleError(new Error('Error while parsing stream: ' + error));
    });

    this._decompressor = zlib.createGunzip();
    this._decompressor.on('error', function(error) {
      that._handleError('Error while deflating stream: ' + error);
    });
    this._decompressor.pipe(this._parser);

    this._request = https.get(this._options, function(res) {
      if (res.statusCode !== 200) {
        that._handleError(new Error('Wrong response status code: ' + res.statusCode));
      }
      else {
        that._backoff.reset();
        res.pipe(that._decompressor);
      }
    });
    this._request.on('error', function(error) {
      that._handleError(new Error('Request error: ' + error));
    });
    this._request.end();
  };

  return PowerTrack;
})();

var RulesAPI = (function() {
  var RulesAPI = function() {

  };

  return RulesAPI;
})();

module.exports = {
  PowerTrack: PowerTrack,
  RulesAPI: RulesAPI
};

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
      if (res.statusCode >= 200 && res.statusCode < 300) {
        that._backoff.reset();
        res.pipe(that._decompressor);
      }
      else {
        that._handleError(new Error('Wrong response status code: ' + res.statusCode));
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
  var RulesAPI = function(options) {
    var that = this,
        apiUrlParts;

    EventEmitter.call(this);

    apiUrlParts = url.parse(options.apiUrl);
    this._options = {
      host: apiUrlParts.hostname,
      port: apiUrlParts.port,
      path: apiUrlParts.path,
      headers: {
        'Accept': 'application/json'
      },
      auth: options.username + ':' + options.password
    };
  };

  RulesAPI.prototype._performRequest = function(method, params, callback) {
    var options = {
      method: method,
      host: this._options.host,
      port: this._options.port,
      path: this._options.path,
      headers: this._options.headers,
      auth: this._options.auth
    };

    // placeholder in case callback is not specified
    if (typeof callback !== 'function')
      callback = function() { };

    var request = https.request(options, function(res) {
      var body = '';

      if (res.statusCode >= 200 && res.statusCode < 300) {
        res.on('data', function(chunk) {
          body += chunk;
        });
        res.on('end', function() {
          var data = null;

          if (body) {
            try {
              data = JSON.parse(body);
              if (data.error)
                callback(new Error(data.error.message), null);
              else
                callback(null, data);
            }
            catch (error) {
              callback(error, null);
            }
          }
          else {
            callback(null, null);
          }
        });
      }
      else {
        callback(new Error('Wrong response status code: ' + res.statusCode), null);
      }
    });

    if (params) {
      request.write(JSON.stringify(params));
    }

    request.end();
  };

  RulesAPI.prototype.get = function(callback) {
    this._performRequest('GET', null, callback);
  };

  RulesAPI.prototype.add = function(params, callback) {
    this._performRequest('POST', params, callback);
  };

  RulesAPI.prototype.remove = function(params, callback) {
    this._performRequest('DELETE', params, callback);
  };

  return RulesAPI;
})();

module.exports = {
  PowerTrack: PowerTrack,
  RulesAPI: RulesAPI
};

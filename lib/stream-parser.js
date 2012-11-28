var util = require('util'),
    Stream = require('stream').Stream;

var StreamParser = (function() {
  var StreamParser = function(options) {
    Stream.call(this);

    this.writable = true;

    this._chunks = '';

    options = options || {};
    this._options = {
      json: options.json || true,
      delimiter: options.delimiter || '\r\n',
      encoding: options.encoding || 'utf8'
    };
    this._options.delimiterLength = this._options.delimiter.length;
  }

  util.inherits(StreamParser, Stream);

  StreamParser.prototype.write = function(chunk) {
    var index,
        slice;

    this._chunks += chunk.toString(this._options.encoding);

    while ((index = this._chunks.indexOf(this._options.delimiter)) > -1) {
      slice = this._chunks.slice(0, index);
      this._chunks = this._chunks.slice(index + this._options.delimiterLength);

      if (slice.length > 0) {
        if (this._options.json) {
          try {
            this.emit('data', JSON.parse(slice));
          }
          catch (error) {
            this.emit('error', error);
          }
        }
        else {
          this.emit('data', slice);
        }
      }
    }

    return true;
  };

  StreamParser.prototype.destroy = function() {
    this._chunks = null;
    this._options = null;
    this.writable = false;
  };

  StreamParser.prototype.end = function() {
    this.emit('end');
  };

  return StreamParser;
})();

module.exports = StreamParser;

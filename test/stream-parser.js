var assert = require('assert'),
    util = require('util'),
    StreamParser = require('../lib/stream-parser');

describe('StreamParser', function() {
  it('should parse a fragmented JSON string and return an object', function(done) {
    var streamParser = new StreamParser(),
        obj1 = {key: {complex: 'value'}},
        obj2 = [{key: 'value1'}, {key: 'value2'}],
        streamData = JSON.stringify(obj1) + '\r\n' + JSON.stringify(obj2) + '\r\n',
        iteration = 0,
        i,
        len;

    streamParser.on('data', function(data) {
      if (iteration === 0) {
        assert.deepEqual(data, obj1, 'data matches the first object sent in the stream');
        iteration++;
      }
      else {
        assert.deepEqual(data, obj2, 'data matches the second object sent in the stream');
        done();
      }
    });

    // Simulates a fragmented stream by sending 1 character at a time
    for (i = 0, len = streamData.length; i < len; i++)
      streamParser.write(streamData[i]);
  });

  it('should handle wrong JSON string', function(done) {
    var streamParser = new StreamParser(),
        streamData = '{invalid: object\r\n';
    streamParser.on('error', function(error) {
      assert.ok(error);
      done();
    });
    streamParser.write(streamData);
  });
});

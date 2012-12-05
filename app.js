var config = require('./config'),
    io = require('socket.io').listen(config.server.port || 5000),
    util = require('util'),
    gnip = require('./lib/gnip'),
    powerTrack = new gnip.PowerTrack({
      apiUrl: config.gnip.powerTrackUrl,
      username: config.gnip.username,
      password: config.gnip.password
    }),
    rulesAPI = new gnip.RulesAPI({
      apiUrl: config.gnip.rulesAPIUrl,
      username: config.gnip.username,
      password: config.gnip.password
    }),
    counters = {};

if (config.server.rate) {
  if (typeof config.server.rate.max !== 'number' ||
      typeof config.server.rate.interval !== 'number')
    throw new Error('Invalid config.server.rate structure. Should be {max: number, interval, number}');

  setInterval(function() {
    var rulesToRemove = [],
        i;

    for (i in counters) {
      if (counters[i] > config.server.rate.max) {
        rulesToRemove.push({value: i});
      }
    }

    if (rulesToRemove.length > 0) {
      rulesAPI.remove({rules: rulesToRemove}, function(error) {
        io.of('/stream').emit('overflow', rulesToRemove);
      });
    }

    counters = {};

  }, config.server.rate.interval);
}

io.configure(function() {
  io.set('transports', ['websocket']);
  io.set('log level', 1);
});

io.of('/rules').on('connection', function(socket) {
  socket.on('get', function(callback) {
    rulesAPI.get(function(error, data) {
      if (typeof callback === 'function')
        callback(error, data);
    });
  }).on('add', function(rules, callback) {
    rulesAPI.add(rules, function(error) {
      if (typeof callback === 'function')
        callback(error);
    });
  }).on('remove', function(rules, callback) {
    rulesAPI.remove(rules, function(error) {
      if (typeof callback === 'function')
        callback(error);
    });
  });
});

io.of('/stream').on('connection', function(socket) { });

powerTrack.on('data', function(data) {
  var i, len, rule;

  if (data.gnip && util.isArray(data.gnip.matching_rules)) {
    for (i = 0, len = data.gnip.matching_rules.length; i < len; i++) {
      rule = data.gnip.matching_rules[i].value;
      counters[rule] = (counters[rule] || 0) + 1;
    }
  }

  io.of('/stream').emit('data', data);
}).on('error', function(error) {
  io.of('/stream').emit('error', error);
}).on('fail', function() {
  io.of('/stream').emit('fail');
});
powerTrack.start();

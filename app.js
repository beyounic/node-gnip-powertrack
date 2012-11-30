var config = require('./config'),
    io = require('socket.io').listen(config.server.port || 5000),
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
    });

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
  io.of('/stream').emit('data', data);
}).on('error', function(error) {
  io.of('/stream').emit('error', error);
}).on('fail', function() {
  io.of('/stream').emit('fail');
});
powerTrack.start();

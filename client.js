var config = require('./config'),
    io = require('socket.io-client').connect('http://localhost:' + config.server.port + '/stream');

io.on('data', function(data) {
  console.log(data.id + ' - ' + data.postedTime);
});

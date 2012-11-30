node-gnip-powertrack
=========

A node.js server that proxies Gnip PowerTrack and RulesAPI over socket.io. An exponential backoff algorithm handles reconnection in case of errors.

# Installation

Clone the repository and install all dependencies using `npm`

```
git clone git@github.com:beyounic/node-gnip-powertrack.git
cd node-gnip-powetrack
npm install
```

Copy `config-sample.js` into `config.js` end edit it by adding your Gnip PowerTrack url, RulesAPI url and your credentials. Additionally you can also specify the socket.io port on which the server will be listening (default is `5000`).

```javascript
module.exports = {
  gnip: {
    powerTrackUrl: 'https://stream.gnip.com:443/accounts/XYZ/publishers/twitter/streams/track/Production.json',
    rulesAPIUrl: 'https://api.gnip.com:443/accounts/XYZ/publishers/twitter/streams/track/Production/rules.json',
    username: '',
    password: ''
  },
  server: {
    port: 5000
  }
};
```

# Execution and testing

To run the server simply use `npm`

```
npm start
```

If you want to run tests please ensure first to have the server running and then to have a configured set of Gnip rules that generates at least 1 activity every 10 seconds. To run tests simply use `npm`

```
npm test
```

# Usage

The server runs a socket on port `5000` (unless overridden in the config file) and provides two namespaces `/stream` for the PowerTrack and `/rules` for the RulesAPI.

## PowerTrack

In order to access PowerTrack you simply have to connect to the `/stream` namespace. All incoming data will be broadcasted to this namespace. There are three types of event that can be emitted by the server:

* `server.emit('data', data)`: emitted everytime a new activity is available. The argument `data` contains the objectified Gnip activity according to the output format you specified in the stream configuration (normalized or original).
* `server.emit('error', error)`: emitted everytime an error occurs. The argument `error` contains an `Error` object. After emitting the event the server handles a reconnection to PowerTrack using an exponential backoff algorithm
* `server.emit('fail')`: emitted when the maximum number of backoff attempts is reached. When this happens, the server is hanging with no connection to the PowerTrack and waits for manual recovery.

## RulesAPI

In order to access RulesAPI you simply have to connect to the `/rules` namespace. The server will listen to three types of event that a client can emit; with every emission the client must specify a callback function that will be executed (on the client) once the server responds (this is the aknowledgement pattern of socket.io)

* `client.emit('get', function(error, data) { … })`: asks for active rules. If an error occurs the `error` argument will contain an `Error` object, otherwise the `data` argument will contain the object representation of Gnip rules.
* `client.emit('add', rules, function(error) { … })`: asks for adding the given set of `rules` according to the Gnip rules specification format. If an error occurs the `error` argument will contain an `Error` object, otherwise it will be `null`.
* `client.emit('remove', rules, function(error) { … })`: asks for removing the given set of `rules` according to the Gnip rules specification format. If an error occurs the `error` argument will contain an `Error` object, otherwise it will be `null`.

# License

(The MIT License)

Copyright (c) 2012 Beyounic, info@beyounic.com

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
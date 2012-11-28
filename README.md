node-gnip-powertrack
=========

A node.js server that proxies GNIP PowerTrack over socket.io.

All activities are broadcasted to a generic `/stream` namespace. In addition, the matching rules of activities are also processed to find out which are tags; for every tag found, the activity will also be broadcasted to `/stream/tag` namespace.
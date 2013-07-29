var util = require('util'),
    connect = require('connect'),
    port = process.env.PORT;

connect.createServer(connect.static(__dirname + "/web")).listen(port);
util.puts('Listening on ' + port + '...');
util.puts('Press Ctrl + C to stop.');

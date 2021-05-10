var express = require('express');
var path = require('path');
var app = express();
var game = require('./DGgame.js');

app.use(express.static(path.join(__dirname,'public')));

var server = require('http').createServer(app).listen(process.env.PORT || 8080);
var io = require('socket.io')(server);

io.sockets.on('connection', function (socket) {
    game.initGame(io, socket);
});
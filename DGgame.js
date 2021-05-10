var io;
var gameSocket;

exports.initGame = function(socketIo, socket){
    io = socketIo;
    gameSocket = socket;

    gameSocket.emit('connected', { message: "You are connected!" });

    gameSocket.on('hostCreateNewGame', hostCreateNewGame);
};

function hostCreateNewGame(){
    var gameId = ( Math.random() * 100000 | 0);

    this.emit('newGameCreated', {gameId: gameId, socketId: this.id});

    this.join(gameId.toString());
}
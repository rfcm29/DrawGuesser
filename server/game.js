var io;
var gameSocket;

exports.initGame = function(socketIo, socket){
    io = socketIo;
    gameSocket = socket;
    gameSocket.emit('connected', { message: "You are connected!" });

    gameSocket.on('hostCreateLobby', hostCreateLobby);
    gameSocket.on('roomFull', onRoomFull);
    gameSocket.on('playerEscolha', onPlayerEscolha);

    gameSocket.on('playerJoinGame', playerJoinGame);
};

//HOST

function hostCreateLobby() {
    var thisGameId = (Math.random() * 10000) | 0;

    this.emit('lobbyCreated', {gameId: thisGameId, mySocketId: this.id});

    this.join(thisGameId);
}

function onRoomFull(data) {
    //var sock = this;
    /*var data = {
        mySocketId : sock.id,
        gameId : gameId
    };*/

    var words = randomWords();

    data.words = words;

    io.emit('beginGame', data);
}


//PLAYER

function playerJoinGame(data) {

    var sock = this;
    //var room = gameSocket.manager.rooms["/" + data.gameId];

    //if(room != undefined){
        data.mySocketId = sock.id;
        sock.join(data.gameId);
        io.to(data.gameId).emit('playerJoinedRoom', data);
    //} else {
        //this.emit('error', {message: "This room does not exist."});
    //}
}

function onPlayerEscolha(data) {
    wordPool.splice(wordPool.indexOf(data.escolha), 1);
    io.emit('startRound', data);
}

//GAME LOGIC

function randomWords() {
    
    var words = [];

    for(var i = 0; i < 3; i++){
        var word;
        do {
            word = wordPool[Math.floor(Math.random() * wordPool.length)];
        } while (words.includes(word) === true);
        words.push(word);
    }

    return words;
}

var wordPool = [
    "bola", "banana", "casa", "computador", "telemovel", "chavena", "gritar", "andar", "pensar",
    "dormir", "escrever", "dor"
];

var chosenWords = [];